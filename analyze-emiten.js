/**
 * Script untuk scraping emitennews.com
 */
import { BrowserEngine } from './src/index.js';

const browser = new BrowserEngine({ 
  headless: true,
  stealth: true
});

await browser.launch();

try {
  console.log('Navigating to emitennews.com...\n');
  
  // Navigate dengan timeout lebih lama dan waitUntil lebih relaxed
  const response = await browser.page.goto('https://emitennews.com/category/emiten', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  console.log('Status:', response.status());
  
  // Tunggu content load
  await browser.page.waitForTimeout(5000);
  
  // Ambil data
  const data = await browser.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      
      // Cari semua artikel berdasarkan berbagai kemungkinan selector
      articles: Array.from(document.querySelectorAll('h2 a, h3 a, .title a, article h2 a, article h3 a'))
        .map(el => ({
          title: el.textContent.trim(),
          href: el.href,
          parent: el.parentElement?.tagName + '.' + el.parentElement?.className
        })),
      
      // Semua cards/items
      cards: Array.from(document.querySelectorAll('[class*="card"], [class*="item"], [class*="post"], [class*="berita"], [class*="news"]'))
        .map(el => ({
          class: el.className,
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100)
        })),
      
      // Pagination
      pagination: Array.from(document.querySelectorAll('.pagination a, .page-numbers a, [class*="page"] a'))
        .map(el => ({
          text: el.textContent.trim(),
          href: el.href
        }))
    };
  });
  
  console.log('\n=== PAGE INFO ===');
  console.log('URL:', data.url);
  console.log('Title:', data.title);
  
  console.log('\n=== ARTICLES FOUND (' + data.articles.length + ') ===');
  data.articles.slice(0, 15).forEach((article, i) => {
    console.log(`${i+1}. ${article.title}`);
    console.log(`   URL: ${article.href}`);
    console.log(`   Parent: ${article.parent}`);
  });
  
  console.log('\n=== CARDS/ITEMS FOUND ===');
  console.log('Total:', data.cards.length);
  const uniqueClasses = [...new Set(data.cards.map(c => c.class))];
  console.log('Unique classes:', uniqueClasses.slice(0, 20));
  
  console.log('\n=== PAGINATION ===');
  console.log(data.pagination);
  
  // Coba selector spesifik
  console.log('\n=== TESTING SPECIFIC SELECTORS ===');
  const selectors = [
    'article', '.article', '.post-item', '.news-item', '.berita-item',
    '.item-news', '.post', '.news', '.berita',
    '.col-md-4', '.col-md-3', '.col-sm', '.col-xs',
    '.thumb', '.thumbnail', '.image-wrap',
    '.entry-title', '.post-title', '.article-title', '.news-title',
    '.catItem', '.itemCat', '.category-item',
    'h2 > a', 'h3 > a', 'h4 > a',
    '.result', '.results', '.listing', '.list-item'
  ];
  
  for (const sel of selectors) {
    const count = await browser.evaluate((s) => document.querySelectorAll(s).length, sel);
    if (count > 0) {
      console.log(`✓ ${sel}: ${count}`);
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}
