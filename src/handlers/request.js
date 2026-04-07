import axios from 'axios';
import { HttpsProxyAgent } from 'hpagent';
import { CookieJar, Cookie } from 'tough-cookie';

/**
 * @typedef {Object} RequestHandlerOptions
 * @property {number} [maxRetries=3]
 * @property {number} [timeout=30000]
 * @property {Object} [headers]
 * @property {number} [retryDelay=1000]
 */

export class RequestHandler {
  /**
   * @param {RequestHandlerOptions} options
   */
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      timeout: 30000,
      headers: {},
      retryDelay: 1000,
      ...options
    };

    this.cookieJar = new CookieJar();
    this.defaultHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      ...this.options.headers
    };
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async request(url, options = {}) {
    const {
      userAgent,
      proxy,
      cookies,
      method = 'GET',
      data = null,
      followRedirects = true
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const headers = {
          ...this.defaultHeaders,
          ...(userAgent ? { 'User-Agent': userAgent } : {})
        };

        const httpsAgent = proxy ? new HttpsProxyAgent({ proxy }) : undefined;

        const config = {
          method,
          url,
          headers,
          timeout: this.options.timeout,
          maxRedirects: followRedirects ? 5 : 0,
          validateStatus: () => true,
          decompress: true,
          responseType: 'arraybuffer',
          ...(httpsAgent && { httpsAgent })
        };

        if (data) {
          config.data = data;
        }

        const response = await axios(config);

        // Convert arraybuffer to string
        const encoding = response.headers['content-type']?.includes('charset=') 
          ? response.headers['content-type'].split('charset=')[1].split(';')[0]
          : 'utf-8';
        
        const body = Buffer.from(response.data).toString(encoding);

        // Parse cookies from response
        const responseCookies = {};
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
          cookieArray.forEach(cookieStr => {
            const cookie = Cookie.parse(cookieStr);
            if (cookie) {
              responseCookies[cookie.key] = cookie.value;
            }
          });
        }

        return {
          url,
          statusCode: response.status,
          body,
          headers: response.headers,
          cookies: { ...cookies, ...responseCookies }
        };
      } catch (error) {
        lastError = error;
        
        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * GET request
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} url
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async post(url, data, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'POST',
      data: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Set default headers
   * @param {Object} headers
   */
  setHeaders(headers) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers
    };
  }

  /**
   * Add header
   * @param {string} key
   * @param {string} value
   */
  addHeader(key, value) {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove header
   * @param {string} key
   */
  removeHeader(key) {
    delete this.defaultHeaders[key];
  }

  /**
   * Sleep helper
   * @param {number} ms
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get random retry delay with jitter
   * @param {number} baseDelay
   * @returns {number}
   */
  getRetryDelay(baseDelay = 1000) {
    const jitter = Math.random() * 0.3 + 0.85; // 0.85 to 1.15
    return baseDelay * jitter;
  }
}

export default RequestHandler;
