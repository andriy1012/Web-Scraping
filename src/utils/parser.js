import * as cheerio from 'cheerio';

/**
 * @typedef {Object} ExtractRule
 * @property {string} selector - CSS selector
 * @property {string} [attr] - Attribute to extract (href, src, text, etc.)
 * @property {boolean} [multiple=false] - Extract multiple elements
 * @property {Object} [children] - Nested extraction rules
 */

export class ResponseParser {
  /**
   * @param {string} html
   */
  constructor(html) {
    this.html = html;
    this.$ = cheerio.load(html);
  }

  /**
   * Extract data based on rules
   * @param {Object.<string, ExtractRule>} rules
   * @returns {Object}
   */
  extract(rules) {
    const result = {};

    for (const [key, rule] of Object.entries(rules)) {
      result[key] = this.extractField(rule);
    }

    return result;
  }

  /**
   * Extract single field
   * @param {ExtractRule} rule
   * @returns {any}
   */
  extractField(rule) {
    const { selector, attr, multiple = false, children, transform } = rule;

    if (multiple) {
      return this.extractMultiple(selector, attr, children, transform);
    } else {
      return this.extractSingle(selector, attr, children, transform);
    }
  }

  /**
   * Extract single element
   * @param {string} selector
   * @param {string} [attr]
   * @param {Object} [children]
   * @param {Function} [transform]
   * @returns {any}
   */
  extractSingle(selector, attr, children, transform) {
    const element = this.$(selector).first();
    
    if (element.length === 0) {
      return null;
    }

    let value;

    if (children) {
      value = this.extractFromElement(element, children);
    } else {
      value = this.getElementValue(element, attr);
    }

    if (transform && value !== null) {
      value = transform(value);
    }

    return value;
  }

  /**
   * Extract multiple elements
   * @param {string} selector
   * @param {string} [attr]
   * @param {Object} [children]
   * @param {Function} [transform]
   * @returns {Array}
   */
  extractMultiple(selector, attr, children, transform) {
    const elements = this.$(selector);
    const results = [];

    elements.each((_, element) => {
      const el = this.$(element);
      let value;

      if (children) {
        value = this.extractFromElement(el, children);
      } else {
        value = this.getElementValue(el, attr);
      }

      if (transform && value !== null) {
        value = transform(value);
      }

      results.push(value);
    });

    return results;
  }

  /**
   * Extract data from element with nested rules
   * @param {cheerio.Cheerio} element
   * @param {Object} children
   * @returns {Object}
   */
  extractFromElement(element, children) {
    const result = {};

    for (const [key, rule] of Object.entries(children)) {
      // Handle :scope selector - use the element itself
      let childElement;
      if (rule.selector === ':scope') {
        childElement = element;
      } else {
        childElement = element.find(rule.selector || key);
      }

      if (childElement.length === 0) {
        result[key] = null;
        continue;
      }

      if (rule.multiple) {
        const items = [];
        childElement.each((_, el) => {
          const el_ = this.$(el);
          if (rule.children) {
            items.push(this.extractFromElement(el_, rule.children));
          } else {
            items.push(this.getElementValue(el_, rule.attr));
          }
        });
        result[key] = items;
      } else {
        if (rule.children) {
          result[key] = this.extractFromElement(childElement, rule.children);
        } else {
          result[key] = this.getElementValue(childElement, rule.attr);
        }
      }
    }

    return result;
  }

  /**
   * Get element value based on attr
   * @param {cheerio.Cheerio} element
   * @param {string} [attr]
   * @returns {any}
   */
  getElementValue(element, attr) {
    if (!attr || attr === 'text') {
      return element.text().trim();
    } else if (attr === 'html' || attr === 'inner') {
      return element.html();
    } else if (attr === 'outer') {
      return this.$.html(element);
    } else {
      return element.attr(attr) || null;
    }
  }

  /**
   * Find elements with CSS selector
   * @param {string} selector
   * @returns {cheerio.Cheerio}
   */
  find(selector) {
    return this.$(selector);
  }

  /**
   * Find elements with XPath (converted to CSS)
   * @param {string} xpath
   * @returns {cheerio.Cheerio}
   */
  findByXPath(xpath) {
    // Simple XPath to CSS converter for common cases
    let css = xpath;
    
    // Convert // to space (descendant selector)
    css = css.replace(/\/\//g, ' ');
    // Remove leading /
    css = css.replace(/^\//, '');
    // Convert [@attr] to [attr]
    css = css.replace(/\[@(\w+)\]/g, '[$1]');
    // Convert [@attr='value'] to [attr='value']
    css = css.replace(/\[@(\w+)='([^']+)'\]/g, '[$1="$2"]');
    // Convert [1] to :first
    css = css.replace(/\[(\d+)\]/g, (match, num) => {
      return num === '1' ? ':first' : `:nth-of-type(${num})`;
    });

    try {
      return this.$(css);
    } catch (e) {
      console.warn(`XPath conversion failed: ${xpath}`);
      return this.$([]);
    }
  }

  /**
   * Extract all links from page
   * @returns {string[]}
   */
  getAllLinks() {
    const links = [];
    this.$('a[href]').each((_, el) => {
      const href = this.$(el).attr('href');
      if (href) {
        links.push(href);
      }
    });
    return links;
  }

  /**
   * Extract all images from page
   * @returns {string[]}
   */
  getAllImages() {
    const images = [];
    this.$('img[src]').each((_, el) => {
      const src = this.$(el).attr('src');
      if (src) {
        images.push(src);
      }
    });
    return images;
  }

  /**
   * Get meta tags
   * @returns {Object}
   */
  getMetaTags() {
    const meta = {};
    this.$('meta').each((_, el) => {
      const name = this.$(el).attr('name') || this.$(el).attr('property');
      const content = this.$(el).attr('content');
      if (name && content) {
        meta[name] = content;
      }
    });
    return meta;
  }

  /**
   * Get page title
   * @returns {string}
   */
  getTitle() {
    return this.$('title').text().trim();
  }

  /**
   * Get page base text (body text without scripts/styles)
   * @returns {string}
   */
  getBaseText() {
    return this.$('body').clone()
      .children('script, style, noscript, nav, footer, header')
      .remove()
      .end()
      .text()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Check if element exists
   * @param {string} selector
   * @returns {boolean}
   */
  exists(selector) {
    return this.$(selector).length > 0;
  }

  /**
   * Count elements
   * @param {string} selector
   * @returns {number}
   */
  count(selector) {
    return this.$(selector).length;
  }

  /**
   * Get raw HTML
   * @returns {string}
   */
  getHTML() {
    return this.html;
  }

  /**
   * Get pretty HTML
   * @returns {string}
   */
  getPrettyHTML() {
    return this.$.html();
  }
}

export default ResponseParser;
