/**
 * Script untuk scraping emitennews.com
 * Mendapatkan daftar berita/artikel dari halaman kategori
 */
import { Scrapling } from './src/index.js';
import { writeFileSync } from 'fs';

async function scrapeEmitenNews(pageCount = 3) {
  console.log('=== Scraping EmitenNews.com ===\n');
  
  const scraper = new Scrapling({
    useBrowser: true,
    headless: true,
    stealth: true,
    requestDelay: 2000
  });

  await scraper.init();

  try {
    const allArticles = [];
    
    for (let page = 1; page <= pageCount; page++) {
      const url = page === 1 
        ? 'https://emitennews.com/category/emiten'
        : `https://emitennews.com/category/emiten/${(page - 1) * 9}`;
      
      console.log(`\n📄 Scraping page ${page}...`);
      console.log(`   URL: ${url}`);
      
      // Gunakan selector yang benar - href ada di element .news-card-2 itu sendiri
      const result = await scraper.scrape(url, {
        articles: {
          selector: '.news-card-2',
          multiple: true,
          children: {
            title: { 
              selector: 'p.fs-16', 
              attr: 'text',
              transform: (text) => text?.trim()
            },
            // href ada di element parent (.news-card-2), gunakan :scope
            url: { 
              selector: ':scope', 
              attr: 'href'
            },
            image: {
              selector: '.news-card-2-img img',
              attr: 'src'
            },
            time: {
              selector: 'span.small',
              attr: 'text',
              transform: (text) => text?.trim()
            }
          }
        }
      });
      
      console.log(`   ✓ Found ${result.data.articles?.length || 0} articles`);
      
      if (result.data.articles) {
        // Filter articles yang valid
        const validArticles = result.data.articles.filter(a => a.title && a.url);
        allArticles.push(...validArticles);
        
        console.log(`   ✓ Valid articles: ${validArticles.length}`);
      }
      
      // Delay antar page
      if (page < pageCount) {
        console.log(`   ⏳ Waiting 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log(`Total articles scraped: ${allArticles.length}`);
    
    // Tampilkan beberapa artikel pertama
    console.log('\n📰 Sample articles:');
    allArticles.slice(0, 10).forEach((article, i) => {
      console.log(`\n${i+1}. ${article.title}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Time: ${article.time || 'N/A'}`);
      console.log(`   Image: ${article.image ? '✓' : '✗'}`);
    });
    
    // Save ke file
    const filename = `emitennews_articles_${new Date().toISOString().split('T')[0]}.json`;
    writeFileSync(filename, JSON.stringify(allArticles, null, 2));
    console.log(`\n💾 Saved to ${filename}`);
    
    return allArticles;
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await scraper.close();
  }
}

// Jalankan scraping
await scrapeEmitenNews(2);
