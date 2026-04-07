import { chromium, firefox, webkit } from 'playwright';

/**
 * @typedef {Object} BrowserOptions
 * @property {boolean} [headless=true]
 * @property {string} [proxy]
 * @property {string} [userAgent]
 * @property {boolean} [stealth=false] - Enable stealth mode
 */

export class BrowserEngine {
  /**
   * @param {BrowserOptions} options
   */
  constructor(options = {}) {
    this.options = {
      headless: true,
      stealth: false,
      ...options
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.browserType = chromium;
  }

  /**
   * Launch browser
   */
  async launch() {
    const launchOptions = {
      headless: this.options.headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-sandbox',
        '--disable-gpu'
      ]
    };

    this.browser = await this.browserType.launch(launchOptions);

    const contextOptions = {
      viewport: { width: 1920, height: 1080 },
      userAgent: this.options.userAgent || this.getDefaultUserAgent(),
      acceptDownloads: true,
      javaScriptEnabled: true
    };

    if (this.options.proxy) {
      contextOptions.proxy = this.parseProxy(this.options.proxy);
    }

    if (this.options.stealth) {
      contextOptions.isMobile = false;
      contextOptions.hasTouch = false;
    }

    this.context = await this.browser.newContext(contextOptions);

    this.page = await this.context.newPage();

    if (this.options.stealth) {
      await this.addStealthScripts();
    }

    return this;
  }

  /**
   * Navigate to URL
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async navigate(url, options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched');
    }

    if (options.userAgent) {
      await this.page.setExtraHTTPHeaders({
        'User-Agent': options.userAgent
      });
    }

    if (options.proxy && options.proxy !== this.options.proxy) {
      await this.context.setExtraHTTPHeaders({
        'Proxy': options.proxy
      });
    }

    const response = await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (options.acceptCookies) {
      await this.acceptCookies();
    }

    const body = await this.page.content();
    const cookies = await this.page.context().cookies();
    const headers = response ? response.headers() : {};

    return {
      url,
      body,
      statusCode: response ? response.status() : 200,
      headers,
      cookies: this.cookiesToObject(cookies)
    };
  }

  /**
   * Execute JavaScript in page context
   * @param {string} script
   * @returns {Promise<any>}
   */
  async evaluate(script) {
    if (!this.page) {
      throw new Error('Browser not launched');
    }
    return await this.page.evaluate(script);
  }

  /**
   * Take screenshot
   * @param {Object} options
   * @returns {Promise<Buffer>}
   */
  async screenshot(options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched');
    }

    const screenshotOptions = {
      type: 'png',
      fullPage: true,
      ...options
    };

    return await this.page.screenshot(screenshotOptions);
  }

  /**
   * Click element with selector
   * @param {string} selector
   */
  async click(selector) {
    await this.page.click(selector, { timeout: 10000 });
  }

  /**
   * Type text into input
   * @param {string} selector
   * @param {string} text
   * @param {Object} options
   */
  async type(selector, text, options = {}) {
    await this.page.type(selector, text, { delay: 50, ...options });
  }

  /**
   * Wait for selector
   * @param {string} selector
   * @param {Object} options
   */
  async waitForSelector(selector, options = {}) {
    await this.page.waitForSelector(selector, { timeout: 30000, ...options });
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation() {
    await this.page.waitForNavigation({ waitUntil: 'networkidle' });
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  /**
   * Auto accept cookies (common cookie banners)
   */
  async acceptCookies() {
    const cookieSelectors = [
      'button[id*="accept"]',
      'button[class*="accept"]',
      'button[id*="agree"]',
      'button[class*="agree"]',
      '[aria-label*="accept"]',
      '[aria-label*="agree"]'
    ];

    for (const selector of cookieSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(500);
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  /**
   * Add stealth scripts to avoid detection
   */
  async addStealthScripts() {
    await this.page.addInitScript(() => {
      // Override the navigator.webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });

      // Override plugins to look more natural
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Remove automation flags
      delete navigator.__proto__.webdriver;

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });
  }

  /**
   * Get HTML content
   * @returns {Promise<string>}
   */
  async getHTML() {
    return await this.page.content();
  }

  /**
   * Get text content
   * @returns {Promise<string>}
   */
  async getText() {
    return await this.page.evaluate(() => document.body.innerText);
  }

  /**
   * Close browser
   */
  async close() {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  /**
   * Get default user agent
   * @returns {string}
   */
  getDefaultUserAgent() {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Parse proxy string to Playwright format
   * @param {string} proxy
   * @returns {Object}
   */
  parseProxy(proxy) {
    const url = new URL(proxy);
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username || undefined,
      password: url.password || undefined
    };
  }

  /**
   * Convert cookies array to object
   * @param {Array} cookies
   * @returns {Object}
   */
  cookiesToObject(cookies) {
    return cookies.reduce((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {});
  }
}

export default BrowserEngine;
