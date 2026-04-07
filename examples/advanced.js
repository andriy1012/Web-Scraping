/**
 * Advanced Scraping Examples
 * Contoh scraping website modern dengan JavaScript rendering
 */

import { Scrapling } from '../src/index.js';
import { writeFileSync } from 'fs';

async function scrapeWithJavaScript() {
  console.log('=== Scrape dengan JavaScript Rendering ===\n');

  const scraper = new Scrapling({
    useBrowser: true,
    headless: true,
    stealth: true // Enable stealth mode
  });

  await scraper.init();

  try {
    // Navigate dan wait for dynamic content
    const result = await scraper.scrape('https://example.com', {
      title: { selector: 'h1', attr: 'text' }
    });

    console.log('Title:', result.data.title);

    // Execute custom JavaScript
    const dynamicData = await scraper.evaluate('https://example.com', `
      () => {
        return {
          innerHTML: document.body.innerHTML.length,
          links: document.querySelectorAll('a').length,
          images: document.querySelectorAll('img').length
        };
      }
    `);

    console.log('Dynamic data:', dynamicData);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function takeScreenshot() {
  console.log('=== Screenshot Example ===\n');

  const scraper = new Scrapling({
    useBrowser: true,
    headless: true
  });

  await scraper.init();

  try {
    const screenshot = await scraper.screenshot('https://example.com', {
      fullPage: true,
      type: 'png'
    });

    writeFileSync('screenshot.png', screenshot);
    console.log('✓ Screenshot saved to screenshot.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function withProxyRotation() {
  console.log('=== Proxy Rotation Example ===\n');

  // List proxy (ganti dengan proxy Anda)
  const proxies = [
    'http://proxy1:port',
    'http://proxy2:port',
    'http://proxy3:port'
  ];

  const scraper = new Scrapling({
    proxies: proxies,
    rotateUserAgent: true,
    requestDelay: 1000
  });

  await scraper.init();

  try {
    // Scraping dengan automatic proxy rotation
    for (let i = 0; i < 5; i++) {
      const result = await scraper.scrape('https://httpbin.org/ip');
      console.log(`Request ${i + 1}: Status ${result.statusCode}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function ecommerceScraping() {
  console.log('=== E-commerce Scraping Example ===\n');

  const scraper = new Scrapling({
    useBrowser: true,
    headless: true,
    requestDelay: 2000 // Lebih lambat untuk avoid blocking
  });

  await scraper.init();

  try {
    // Contoh scraping product listing
    const products = await scraper.scrape('https://example.com/products', {
      products: {
        selector: '.product-card',
        multiple: true,
        children: {
          name: { selector: '.product-name', attr: 'text' },
          price: { selector: '.product-price', attr: 'text' },
          image: { selector: 'img', attr: 'src' },
          rating: { selector: '.rating', attr: 'text' },
          url: { selector: 'a', attr: 'href' }
        }
      }
    });

    console.log(`Found ${products.data.products?.length || 0} products`);
    
    if (products.data.products) {
      products.data.products.forEach((product, i) => {
        console.log(`${i + 1}. ${product.name} - ${product.price}`);
      });
    }

    // Save to file
    writeFileSync('products.json', JSON.stringify(products.data, null, 2));
    console.log('✓ Products saved to products.json');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function newsScraping() {
  console.log('=== News Article Scraping Example ===\n');

  const scraper = new Scrapling({
    requestDelay: 1000
  });

  await scraper.init();

  try {
    const article = await scraper.scrape('https://example.com/article', {
      title: { selector: 'h1', attr: 'text' },
      author: { selector: '.author', attr: 'text' },
      date: { selector: '.date', attr: 'text' },
      content: { 
        selector: '.article-content', 
        attr: 'text',
        transform: (text) => text.replace(/\s+/g, ' ').trim()
      },
      tags: {
        selector: '.tag',
        attr: 'text',
        multiple: true
      },
      relatedArticles: {
        selector: '.related-article',
        multiple: true,
        children: {
          title: { selector: 'a', attr: 'text' },
          url: { selector: 'a', attr: 'href' }
        }
      }
    });

    console.log('Title:', article.data.title);
    console.log('Author:', article.data.author);
    console.log('Date:', article.data.date);
    console.log('Content length:', article.data.content?.length || 0);
    console.log('Tags:', article.data.tags);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function infiniteScroll() {
  console.log('=== Infinite Scroll Example ===\n');

  const scraper = new Scrapling({
    useBrowser: true,
    headless: true
  });

  await scraper.init();

  try {
    // Navigate to page
    await scraper.browser.navigate('https://example.com/infinite-scroll');
    
    // Scroll to bottom multiple times
    for (let i = 0; i < 3; i++) {
      await scraper.browser.scrollToBottom();
      await scraper.browser.page.waitForTimeout(2000); // Wait for content to load
    }

    // Extract all loaded content
    const items = await scraper.browser.evaluate(`
      () => {
        return Array.from(document.querySelectorAll('.item')).map(el => el.textContent);
      }
    `);

    console.log(`Loaded ${items.length} items after scrolling`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

async function formSubmission() {
  console.log('=== Form Submission Example ===\n');

  const scraper = new Scrapling({
    useBrowser: true,
    headless: true
  });

  await scraper.init();

  try {
    // Navigate to login page
    await scraper.browser.navigate('https://example.com/login');
    
    // Fill form
    await scraper.browser.type('#username', 'testuser');
    await scraper.browser.type('#password', 'password123');
    await scraper.browser.click('button[type="submit"]');
    
    // Wait for navigation
    await scraper.browser.waitForNavigation();
    
    // Get authenticated content
    const userProfile = await scraper.browser.evaluate(`
      () => {
        return {
          username: document.querySelector('.username')?.textContent,
          email: document.querySelector('.email')?.textContent
        };
      }
    `);

    console.log('User profile:', userProfile);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await scraper.close();
  }
}

// Pilih contoh yang ingin dijalankan
await scrapeWithJavaScript();
// await takeScreenshot();
// await withProxyRotation();
// await ecommerceScraping();
// await newsScraping();
// await infiniteScroll();
// await formSubmission();

console.log('\n✓ Done!');
