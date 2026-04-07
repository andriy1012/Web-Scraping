/**
 * User Agent Generator - Generate dan rotate User-Agent strings
 */

const userAgents = {
  chrome: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  ],
  firefox: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'
  ],
  safari: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36'
  ],
  edge: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  ],
  mobile: [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  ]
};

/**
 * @typedef {Object} UserAgentOptions
 * @property {string} [browser] - Browser type (chrome, firefox, safari, edge, mobile)
 * @property {string} [os] - Operating system (windows, mac, linux, android, ios)
 * @property {boolean} [random=true] - Randomize selection
 */

export class UserAgentGenerator {
  /**
   * @param {UserAgentOptions} options
   */
  constructor(options = {}) {
    this.options = {
      random: true,
      ...options
    };
    
    this.usedAgents = new Set();
    this.rotationIndex = {
      chrome: 0,
      firefox: 0,
      safari: 0,
      edge: 0,
      mobile: 0
    };
  }

  /**
   * Generate user agent
   * @param {UserAgentOptions} options
   * @returns {string}
   */
  generate(options = {}) {
    const opts = { ...this.options, ...options };
    
    let pool;
    
    if (opts.browser) {
      pool = userAgents[opts.browser];
      if (!pool) {
        throw new Error(`Unknown browser type: ${opts.browser}`);
      }
    } else {
      // Combine all pools
      pool = [
        ...userAgents.chrome,
        ...userAgents.firefox,
        ...userAgents.safari,
        ...userAgents.edge,
        ...userAgents.mobile
      ];
    }

    // Filter by OS if specified
    if (opts.os) {
      pool = this.filterByOS(pool, opts.os);
    }

    if (pool.length === 0) {
      throw new Error('No user agents available for specified criteria');
    }

    if (opts.random) {
      return this.getRandom(pool);
    } else {
      return this.getSequential(pool, opts.browser || 'chrome');
    }
  }

  /**
   * Get random user agent from pool
   * @param {string[]} pool
   * @returns {string}
   */
  getRandom(pool) {
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  /**
   * Get sequential user agent (rotation)
   * @param {string[]} pool
   * @param {string} browser
   * @returns {string}
   */
  getSequential(pool, browser) {
    const index = this.rotationIndex[browser];
    this.rotationIndex[browser] = (index + 1) % pool.length;
    return pool[index];
  }

  /**
   * Filter user agents by OS
   * @param {string[]} pool
   * @param {string} os
   * @returns {string[]}
   */
  filterByOS(pool, os) {
    const osPatterns = {
      windows: /Windows NT/,
      mac: /Macintosh|Mac OS X/,
      linux: /Linux|X11/,
      android: /Android/,
      ios: /iPhone|iPad|iPod/
    };

    const pattern = osPatterns[os];
    if (!pattern) {
      return pool;
    }

    return pool.filter(ua => pattern.test(ua));
  }

  /**
   * Get all available user agents
   * @returns {Object}
   */
  getAll() {
    return { ...userAgents };
  }

  /**
   * Add custom user agent
   * @param {string} browser
   * @param {string} userAgent
   */
  addCustom(browser, userAgent) {
    if (!userAgents[browser]) {
      userAgents[browser] = [];
    }
    userAgents[browser].push(userAgent);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      chrome: userAgents.chrome.length,
      firefox: userAgents.firefox.length,
      safari: userAgents.safari.length,
      edge: userAgents.edge.length,
      mobile: userAgents.mobile.length,
      total: Object.values(userAgents).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

// Singleton instance
let generatorInstance = null;

/**
 * Generate user agent (convenience function)
 * @param {UserAgentOptions} options
 * @returns {string}
 */
export function generateUserAgent(options = {}) {
  if (!generatorInstance) {
    generatorInstance = new UserAgentGenerator();
  }
  return generatorInstance.generate(options);
}

export default UserAgentGenerator;
