/**
 * Proxy Manager - Mengelola proxy rotation
 */
export class ProxyManager {
  /**
   * @param {string[]} proxies - List proxy servers
   */
  constructor(proxies = []) {
    this.proxies = [...proxies];
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.proxyScores = new Map(); // Track success rate per proxy
  }

  /**
   * Get current proxy
   * @returns {string|null}
   */
  getCurrentProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    return this.proxies[this.currentIndex];
  }

  /**
   * Rotate to next proxy
   * @returns {string|null}
   */
  rotate() {
    if (this.proxies.length === 0) {
      return null;
    }

    // Move to next proxy
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    
    // Skip failed proxies
    let attempts = 0;
    while (this.failedProxies.has(this.proxies[this.currentIndex]) && attempts < this.proxies.length) {
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      attempts++;
    }

    return this.getCurrentProxy();
  }

  /**
   * Add proxy to pool
   * @param {string} proxy
   */
  addProxy(proxy) {
    if (!this.proxies.includes(proxy)) {
      this.proxies.push(proxy);
      this.proxyScores.set(proxy, { success: 0, failure: 0 });
    }
  }

  /**
   * Add multiple proxies
   * @param {string[]} proxies
   */
  addProxies(proxies) {
    proxies.forEach(proxy => this.addProxy(proxy));
  }

  /**
   * Mark proxy as failed
   * @param {string} proxy
   */
  markFailed(proxy) {
    this.failedProxies.add(proxy);
    
    const stats = this.proxyScores.get(proxy);
    if (stats) {
      stats.failure++;
      this.proxyScores.set(proxy, stats);
    }

    // Auto rotate if current proxy failed
    if (proxy === this.getCurrentProxy()) {
      this.rotate();
    }
  }

  /**
   * Mark proxy as successful
   * @param {string} proxy
   */
  markSuccess(proxy) {
    const stats = this.proxyScores.get(proxy);
    if (stats) {
      stats.success++;
      this.proxyScores.set(proxy, stats);
    }

    // Remove from failed if it was there
    this.failedProxies.delete(proxy);
  }

  /**
   * Remove proxy from pool
   * @param {string} proxy
   */
  removeProxy(proxy) {
    const index = this.proxies.indexOf(proxy);
    if (index !== -1) {
      this.proxies.splice(index, 1);
      this.failedProxies.delete(proxy);
      this.proxyScores.delete(proxy);
      
      // Adjust current index if needed
      if (this.currentIndex >= this.proxies.length) {
        this.currentIndex = 0;
      }
    }
  }

  /**
   * Get all proxies
   * @returns {string[]}
   */
  getAllProxies() {
    return [...this.proxies];
  }

  /**
   * Get working proxies (not failed)
   * @returns {string[]}
   */
  getWorkingProxies() {
    return this.proxies.filter(proxy => !this.failedProxies.has(proxy));
  }

  /**
   * Get proxy statistics
   * @param {string} proxy
   * @returns {Object|null}
   */
  getProxyStats(proxy) {
    return this.proxyScores.get(proxy) || null;
  }

  /**
   * Get best performing proxy
   * @returns {string|null}
   */
  getBestProxy() {
    if (this.proxies.length === 0) {
      return null;
    }

    let bestProxy = null;
    let bestScore = -Infinity;

    for (const proxy of this.proxies) {
      const stats = this.proxyScores.get(proxy);
      const score = stats ? stats.success - stats.failure : 0;
      
      if (score > bestScore && !this.failedProxies.has(proxy)) {
        bestScore = score;
        bestProxy = proxy;
      }
    }

    return bestProxy || this.proxies[0];
  }

  /**
   * Reset all failed proxies
   */
  resetFailed() {
    this.failedProxies.clear();
  }

  /**
   * Get total proxy count
   * @returns {number}
   */
  getCount() {
    return this.proxies.length;
  }

  /**
   * Validate proxy format
   * @param {string} proxy
   * @returns {boolean}
   */
  static isValidProxy(proxy) {
    const proxyRegex = /^(http|https|socks4|socks5):\/\/(?:([^:@]+):([^:@]+)@)?([^:@]+):(\d+)$/;
    return proxyRegex.test(proxy);
  }

  /**
   * Parse proxy from string
   * @param {string} proxyString
   * @returns {Object|null}
   */
  static parseProxy(proxyString) {
    if (!this.isValidProxy(proxyString)) {
      return null;
    }

    const url = new URL(proxyString);
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      username: url.username || null,
      password: url.password || null
    };
  }
}

export default ProxyManager;
