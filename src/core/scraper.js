import { BrowserEngine } from './browser.js';
import { RequestHandler } from '../handlers/request.js';
import { ResponseParser } from '../utils/parser.js';
import { ProxyManager } from '../utils/proxy.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { generateUserAgent } from '../utils/userAgent.js';

/**
 * @typedef {Object} ScraplingOptions
 * @property {boolean} [useBrowser=false] - Gunakan browser automation
 * @property {boolean} [headless=true] - Browser headless mode
 * @property {string[]} [proxies] - List proxy servers
 * @property {boolean} [rotateUserAgent=true] - Rotasi User-Agent
 * @property {number} [requestDelay=1000] - Delay antar request (ms)
 * @property {number} [maxRetries=3] - Maksimal retry per request
 * @property {Object} [headers] - Custom headers
 * @property {boolean} [acceptCookies=true] - Auto accept cookies
 * @property {number} [timeout=30000] - Request timeout (ms)
 */

/**
 * @typedef {Object} ScrapingResult
 * @property {string} url - URL yang discrape
 * @property {number} statusCode - HTTP status code
 * @property {Object} data - Data yang diextract
 * @property {Object} headers - Response headers
 * @property {number} timestamp - Timestamp scraping
 */

export class Scrapling {
  /**
   * @param {ScraplingOptions} options
   */
  constructor(options = {}) {
    this.options = {
      useBrowser: false,
      headless: true,
      proxies: [],
      rotateUserAgent: true,
      requestDelay: 1000,
      maxRetries: 3,
      headers: {},
      acceptCookies: true,
      timeout: 30000,
      ...options
    };

    this.browser = null;
    this.proxyManager = new ProxyManager(this.options.proxies);
    this.rateLimiter = new RateLimiter(this.options.requestDelay);
    this.requestHandler = new RequestHandler({
      maxRetries: this.options.maxRetries,
      timeout: this.options.timeout,
      headers: this.options.headers
    });
    
    this.cookies = new Map();
    this.visitedUrls = new Set();
  }

  /**
   * Initialize browser jika menggunakan browser automation
   */
  async init() {
    if (this.options.useBrowser) {
      this.browser = new BrowserEngine({
        headless: this.options.headless,
        proxy: this.proxyManager.getCurrentProxy(),
        userAgent: this.options.rotateUserAgent ? generateUserAgent() : undefined
      });
      await this.browser.launch();
    }
    return this;
  }

  /**
   * Scraping single URL
   * @param {string} url
   * @param {Object} extractRules - Rules untuk extract data
   * @returns {Promise<ScrapingResult>}
   */
  async scrape(url, extractRules = {}) {
    await this.rateLimiter.wait();
    
    const proxy = this.proxyManager.getCurrentProxy();
    const userAgent = this.options.rotateUserAgent ? generateUserAgent() : null;

    let response;
    
    try {
      if (this.options.useBrowser && this.browser) {
        response = await this.browser.navigate(url, {
          userAgent,
          proxy,
          acceptCookies: this.options.acceptCookies
        });
      } else {
        response = await this.requestHandler.request(url, {
          userAgent,
          proxy,
          cookies: this.cookies.get(url)
        });
      }

      this.visitedUrls.add(url);

      const parser = new ResponseParser(response.body);

      const extractedData = extractRules ? parser.extract(extractRules) : {};
      
      // Selalu sertakan html dan metadata
      const result = {
        url,
        statusCode: response.statusCode,
        data: {
          ...extractedData,
          html: response.body,
          title: parser.getTitle(),
          meta: parser.getMetaTags()
        },
        headers: response.headers,
        timestamp: Date.now()
      };

      if (response.cookies) {
        this.cookies.set(url, response.cookies);
      }

      return result;
    } catch (error) {
      if (this.options.useBrowser && error.message.includes('browser')) {
        await this.relaunchBrowser();
      }
      throw error;
    }
  }

  /**
   * Scraping multiple URLs dengan concurrency control
   * @param {string[]} urls
   * @param {Object} extractRules
   * @param {number} [concurrency=5]
   * @returns {Promise<ScrapingResult[]>}
   */
  async scrapeBatch(urls, extractRules = {}, concurrency = 5) {
    const results = [];
    const queue = [...urls];
    const inProgress = new Set();

    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < concurrency && queue.length > 0) {
        const url = queue.shift();
        const promise = this.scrape(url, extractRules)
          .then(result => {
            results.push(result);
            inProgress.delete(promise);
          })
          .catch(error => {
            console.error(`Error scraping ${url}:`, error.message);
            inProgress.delete(promise);
          });
        
        inProgress.add(promise);
      }
      
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }

    return results;
  }

  /**
   * Crawl website dengan depth limit
   * @param {string} startUrl
   * @param {Object} extractRules
   * @param {Object} options
   * @returns {Promise<ScrapingResult[]>}
   */
  async crawl(startUrl, extractRules = {}, options = {}) {
    const {
      maxDepth = 2,
      maxPages = 50,
      sameDomain = true,
      linkSelector = 'a[href]'
    } = options;

    const results = [];
    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const baseUrl = new URL(startUrl);

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth } = queue.shift();

      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);

      try {
        const result = await this.scrape(url, extractRules);
        results.push(result);

        if (depth < maxDepth) {
          const parser = new ResponseParser(result.data.html || '');
          const links = parser.extract({ 
            links: { selector: linkSelector, attr: 'href', multiple: true }
          }).links || [];

          for (const link of links) {
            const absoluteUrl = new URL(link, url).href;
            
            if (!visited.has(absoluteUrl)) {
              if (!sameDomain || new URL(absoluteUrl).hostname === baseUrl.hostname) {
                queue.push({ url: absoluteUrl, depth: depth + 1 });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Execute JavaScript di browser context
   * @param {string} url
   * @param {string} script - JavaScript code to execute
   * @returns {Promise<any>}
   */
  async evaluate(url, script) {
    if (!this.browser) {
      throw new Error('Browser not initialized. Set useBrowser: true');
    }

    await this.browser.navigate(url);
    return await this.browser.evaluate(script);
  }

  /**
   * Screenshot halaman web
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Buffer>}
   */
  async screenshot(url, options = {}) {
    if (!this.browser) {
      throw new Error('Browser not initialized. Set useBrowser: true');
    }

    await this.browser.navigate(url);
    return await this.browser.screenshot(options);
  }

  /**
   * Add proxy ke rotation pool
   * @param {string} proxy
   */
  addProxy(proxy) {
    this.proxyManager.addProxy(proxy);
  }

  /**
   * Set custom headers
   * @param {Object} headers
   */
  setHeaders(headers) {
    this.options.headers = { ...this.options.headers, ...headers };
    this.requestHandler.setHeaders(headers);
  }

  async relaunchBrowser() {
    if (this.browser) {
      await this.browser.close();
    }
    this.browser = new BrowserEngine({
      headless: this.options.headless,
      proxy: this.proxyManager.getCurrentProxy(),
      userAgent: this.options.rotateUserAgent ? generateUserAgent() : undefined
    });
    await this.browser.launch();
  }

  /**
   * Close resources
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default Scrapling;
