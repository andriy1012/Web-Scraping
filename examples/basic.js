/**
 * Basic Scraping Example
 * Demonstrasi dasar penggunaan Webscrapling
 */

import { Scrapling } from '../src/index.js';

async function basicScraping() {
  console.log('=== Basic Scraping Example ===\n');

  // Initialize scraper
  const scraper = new Scrapling({
    useBrowser: false, // Gunakan HTTP request (lebih cepat)
    rotateUserAgent: true,
    requestDelay: 1000,
    maxRetries: 3
  });

  await scraper.init();

  try {
    // Scraping dengan extract rules
    const result = await scraper.scrape('https://example.com', {
      title: { selector: 'h1', attr: 'text' },
      description: { selector: 'p', attr: 'text' },
      links: { 
        selector: 'a[href]', 
        attr: 'href', 
        multiple: true 
      }
    });

    console.log('URL:', result.url);
    console.log('Status:', result.statusCode);
    console.log('Title:', result.data.title);
    console.log('Description:', result.data.description);
    console.log('Links found:', result.data.links?.length || 0);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function browserScraping() {
  console.log('\n=== Browser Scraping Example ===\n');

  // Initialize dengan browser automation
  const scraper = new Scrapling({
    useBrowser: true,
    headless: true,
    requestDelay: 500
  });

  await scraper.init();

  try {
    const result = await scraper.scrape('https://example.com', {
      title: { selector: 'h1', attr: 'text' },
      description: { selector: 'p', attr: 'text' }
    });

    console.log('Title:', result.data.title);
    console.log('Description:', result.data.description);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function crawling() {
  console.log('\n=== Crawling Example ===\n');

  const scraper = new Scrapling({
    requestDelay: 1000,
    maxRetries: 2
  });

  await scraper.init();

  try {
    const results = await scraper.crawl('https://example.com', {
      title: { selector: 'h1, title', attr: 'text' }
    }, {
      maxDepth: 2,
      maxPages: 10,
      sameDomain: true
    });

    console.log(`Crawled ${results.length} pages`);
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.url} - ${result.data.title}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function batchScraping() {
  console.log('\n=== Batch Scraping Example ===\n');

  const scraper = new Scrapling({
    requestDelay: 500,
    maxRetries: 2
  });

  await scraper.init();

  try {
    const urls = [
      'https://example.com',
      'https://example.org',
      'https://example.net'
    ];

    const results = await scraper.scrapeBatch(urls, {
      title: { selector: 'h1, title', attr: 'text' },
      description: { selector: 'meta[name="description"]', attr: 'content' }
    }, 3); // concurrency = 3

    console.log(`Scraped ${results.length} URLs`);
    
    results.forEach(result => {
      console.log(`- ${result.url}: ${result.data.title}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

// Pilih contoh yang ingin dijalankan
await basicScraping();
// await browserScraping();
// await crawling();
// await batchScraping();

console.log('\n✓ Done!');
