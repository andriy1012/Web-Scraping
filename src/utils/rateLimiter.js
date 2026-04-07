/**
 * Rate Limiter - Mengontrol request frequency untuk menghindari blocking
 */

/**
 * @typedef {Object} RateLimiterOptions
 * @property {number} [delay=1000] - Delay antar request (ms)
 * @property {number} [requestsPerSecond=1] - Max requests per second
 * @property {number} [burst=5] - Max burst requests
 * @property {boolean} [randomize=true] - Randomize delay
 * @property {number} [randomFactor=0.3] - Random factor (0-1)
 */

export class RateLimiter {
  /**
   * @param {RateLimiterOptions} options
   */
  constructor(options = {}) {
    this.options = {
      delay: 1000,
      requestsPerSecond: 1,
      burst: 5,
      randomize: true,
      randomFactor: 0.3,
      ...options
    };

    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.windowStartTime = Date.now();
    this.queue = [];
    this.processing = false;
  }

  /**
   * Wait for appropriate time based on rate limits
   * @returns {Promise<void>}
   */
  async wait() {
    const now = Date.now();
    let delayNeeded = 0;

    // Check requests per second limit
    if (now - this.windowStartTime < 1000) {
      if (this.requestCount >= this.options.requestsPerSecond) {
        delayNeeded = Math.max(delayNeeded, 1000 - (now - this.windowStartTime));
      }
    } else {
      // Reset window
      this.windowStartTime = now;
      this.requestCount = 0;
    }

    // Check minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.options.delay) {
      delayNeeded = Math.max(delayNeeded, this.options.delay - timeSinceLastRequest);
    }

    // Add randomization to avoid detection
    if (this.options.randomize && delayNeeded > 0) {
      delayNeeded = this.randomizeDelay(delayNeeded);
    }

    if (delayNeeded > 0) {
      await this.sleep(delayNeeded);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Randomize delay to avoid patterns
   * @param {number} delay
   * @returns {number}
   */
  randomizeDelay(delay) {
    const factor = 1 + (Math.random() * this.options.randomFactor * 2 - this.options.randomFactor);
    return Math.round(delay * factor);
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
   * Set delay
   * @param {number} ms
   */
  setDelay(ms) {
    this.options.delay = ms;
  }

  /**
   * Set requests per second limit
   * @param {number} rps
   */
  setRequestsPerSecond(rps) {
    this.options.requestsPerSecond = rps;
  }

  /**
   * Get current request count in current window
   * @returns {number}
   */
  getRequestCount() {
    const now = Date.now();
    if (now - this.windowStartTime >= 1000) {
      return 0;
    }
    return this.requestCount;
  }

  /**
   * Get time until next request can be made
   * @returns {number}
   */
  getTimeUntilNextRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const delayNeeded = Math.max(0, this.options.delay - timeSinceLastRequest);
    
    // Also consider requests per second limit
    if (now - this.windowStartTime < 1000 && this.requestCount >= this.options.requestsPerSecond) {
      const windowDelay = 1000 - (now - this.windowStartTime);
      return Math.max(delayNeeded, windowDelay);
    }
    
    return delayNeeded;
  }

  /**
   * Reset rate limiter state
   */
  reset() {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.windowStartTime = Date.now();
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get rate limiter status
   * @returns {Object}
   */
  getStatus() {
    const now = Date.now();
    return {
      delay: this.options.delay,
      requestsPerSecond: this.options.requestsPerSecond,
      currentWindowRequests: this.getRequestCount(),
      timeUntilNextRequest: this.getTimeUntilNextRequest(),
      queueLength: this.queue.length,
      isProcessing: this.processing
    };
  }

  /**
   * Create a delayed request queue
   * @param {Function} requestFn
   * @returns {Promise<any>}
   */
  async queueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const { requestFn, resolve, reject } = this.queue.shift();
      
      try {
        await this.wait();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Batch process with concurrency
   * @param {Array} items
   * @param {Function} processor
   * @param {number} concurrency
   * @returns {Promise<Array>}
   */
  async processBatch(items, processor, concurrency = 5) {
    const results = [];
    const queue = [...items];
    const inProgress = new Set();

    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < concurrency && queue.length > 0) {
        const item = queue.shift();
        const promise = this.queueRequest(() => processor(item))
          .then(result => {
            results.push(result);
            inProgress.delete(promise);
          })
          .catch(error => {
            results.push({ error });
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
   * Create a smart delay based on response patterns
   * @param {number} responseTime - Actual response time
   * @param {number} statusCode - HTTP status code
   */
  adjustDelay(responseTime, statusCode) {
    // Slow down if getting rate limited (429)
    if (statusCode === 429) {
      this.options.delay = Math.min(this.options.delay * 2, 10000);
      console.log(`Rate limit detected, increased delay to ${this.options.delay}ms`);
    }
    
    // Speed up if responses are fast and successful
    if (statusCode >= 200 && statusCode < 300 && responseTime < 500) {
      this.options.delay = Math.max(this.options.delay * 0.9, 500);
    }
    
    // Slow down on server errors
    if (statusCode >= 500) {
      this.options.delay = Math.min(this.options.delay * 1.5, 10000);
    }
  }
}

export default RateLimiter;
