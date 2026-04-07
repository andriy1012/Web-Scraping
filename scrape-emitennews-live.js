/**
 * Script scraping emitennews.com dengan live progress dan klik artikel
 * Menampilkan progress real-time saat scraping setiap artikel
 */
import { Scrapling } from './src/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 3,
  articlesPerPage: 9,
  delayBetweenPages: 2000,
  delayBetweenArticles: 1000,
  outputDir: './output'
};

/**
 * Format URL untuk pagination
 */
function formatUrl(page) {
  if (page === 1) {
    return `${CONFIG.baseUrl}/category/${CONFIG.category}`;
  }
  const offset = (page - 1) * CONFIG.articlesPerPage;
  return `${CONFIG.baseUrl}/category/${CONFIG.category}/${offset}`;
}

/**
 * Scrape listing halaman untuk mendapatkan list artikel
 */
async function scrapeListing(scraper, url) {
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
  
  return result.data.articles || [];
}

/**
 * Klik dan scrape detail artikel menggunakan browser
 */
async function clickAndScrapeArticle(browser, articleUrl, articleTitle, index, total) {
  console.log(`\n   🔵 [${index}/${total}] Membuka artikel...`);
  console.log(`      📰 ${articleTitle}`);
  console.log(`      🔗 ${articleUrl}`);
  
  try {
    // Navigate ke artikel
    await browser.page.goto(articleUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Tunggu loading
    await browser.page.waitForTimeout(2000);
    
    // Extract detail dari halaman artikel
    const detail = await browser.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent?.trim() || '',
        content: document.querySelector('.news-content, .content, article')?.textContent?.trim() || '',
        publishDate: document.querySelector('[class*="date"], [class*="time"], span.small')?.textContent?.trim() || '',
        author: document.querySelector('[class*="author"], .author')?.textContent?.trim() || '',
        tags: Array.from(document.querySelectorAll('.tag a, [class*="tag"] a'))
          .map(el => el.textContent.trim())
          .filter(t => t.length > 0)
      };
    });
    
    console.log(`      ✅ Success!`);
    console.log(`         Title: ${detail.title?.substring(0, 60)}${detail.title?.length > 60 ? '...' : ''}`);
    console.log(`         Content length: ${detail.content.length} characters`);
    console.log(`         Publish date: ${detail.publishDate || 'N/A'}`);
    console.log(`         Tags: ${detail.tags.length > 0 ? detail.tags.join(', ') : 'No tags'}`);
    
    return {
      url: articleUrl,
      title: articleTitle,
      detail: detail
    };
    
  } catch (error) {
    console.log(`      ❌ Error: ${error.message}`);
    return {
      url: articleUrl,
      title: articleTitle,
      error: error.message
    };
  }
}

/**
 * Convert ke CSV
 */
function toCSV(articles) {
  const headers = ['No', 'Title', 'URL', 'Time', 'Detail Title', 'Content Length', 'Publish Date'];
  const rows = articles.map((a, i) => [
    i + 1,
    `"${a.title?.replace(/"/g, '""') || ''}"`,
    a.url || '',
    a.time || '',
    `"${a.detail?.title?.replace(/"/g, '""') || ''}"`,
    a.detail?.content?.length || 0,
    a.detail?.publishDate || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Main scraping function dengan live progress
 */
async function scrapeEmitenNewsWithClick() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     SCRAPING EMITENNEWS.COM - LIVE PROGRESS MODE         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📋 Configuration:`);
  console.log(`   • Pages to scrape: ${CONFIG.pagesToScrape}`);
  console.log(`   • Articles per page: ${CONFIG.articlesPerPage}`);
  console.log(`   • Delay between pages: ${CONFIG.delayBetweenPages/1000}s`);
  console.log(`   • Delay between articles: ${CONFIG.delayBetweenArticles/1000}s`);
  console.log();
  
  // Create output directory
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const scraper = new Scrapling({
    useBrowser: true,
    headless: true,
    stealth: true,
    requestDelay: 500
  });

  await scraper.init();

  try {
    const allArticles = [];
    let globalArticleCount = 0;
    
    for (let page = 1; page <= CONFIG.pagesToScrape; page++) {
      const url = formatUrl(page);
      
      console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
      console.log(`║  📄 PAGE ${page}/${CONFIG.pagesToScrape}`);
      console.log(`╚═══════════════════════════════════════════════════════════╝`);
      console.log(`   URL: ${url}`);
      
      // Scrape listing untuk dapat list artikel
      const articles = await scrapeListing(scraper, url);
      console.log(`   📊 Found ${articles.length} articles`);
      
      // Klik dan scrape setiap artikel satu per satu
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        globalArticleCount++;
        
        if (!article.url) {
          console.log(`\n   ⚠️  [${globalArticleCount}] Skipping - No URL`);
          continue;
        }
        
        // Klik dan scrape detail
        const result = await clickAndScrapeArticle(
          scraper.browser, 
          article.url, 
          article.title,
          globalArticleCount,
          CONFIG.pagesToScrape * CONFIG.articlesPerPage
        );
        
        // Merge dengan data listing
        article.detail = result.detail;
        article.error = result.error;
        allArticles.push(article);
        
        // Delay antar artikel
        if (i < articles.length - 1) {
          console.log(`   ⏳ Waiting ${CONFIG.delayBetweenArticles/1000}s before next article...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenArticles));
        }
      }
      
      // Delay between pages
      if (page < CONFIG.pagesToScrape) {
        console.log(`\n   ⏳ Waiting ${CONFIG.delayBetweenPages/1000}s before next page...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPages));
      }
    }
    
    // Summary
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ SCRAPING COMPLETED!`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total articles: ${allArticles.length}`);
    console.log(`   • Successful: ${allArticles.filter(a => !a.error).length}`);
    console.log(`   • Failed: ${allArticles.filter(a => a.error).length}`);
    
    // Save to files
    const timestamp = new Date().toISOString().split('T')[0];
    const timeId = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1];
    
    // Save detailed JSON
    const jsonFile = join(CONFIG.outputDir, `emitennews_detailed_${timestamp}_${timeId}.json`);
    writeFileSync(jsonFile, JSON.stringify(allArticles, null, 2));
    console.log(`\n💾 Saved detailed JSON to ${jsonFile}`);
    
    // Save summary CSV
    const csvFile = join(CONFIG.outputDir, `emitennews_summary_${timestamp}_${timeId}.csv`);
    writeFileSync(csvFile, toCSV(allArticles));
    console.log(`💾 Saved summary CSV to ${csvFile}`);
    
    // Display sample
    console.log('\n📰 SAMPLE ARTICLES:');
    allArticles.slice(0, 5).forEach((article, i) => {
      console.log(`\n   ${i+1}. ${article.title}`);
      console.log(`      URL: ${article.url}`);
      console.log(`      Time: ${article.time}`);
      if (article.detail) {
        console.log(`      Detail Title: ${article.detail.title?.substring(0, 50)}...`);
        console.log(`      Content: ${article.detail.content?.substring(0, 100)}...`);
      }
    });
    
    return allArticles;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await scraper.close();
  }
}

// Run scraping dengan live progress
await scrapeEmitenNewsWithClick();
