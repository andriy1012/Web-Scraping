/**
 * Script lengkap untuk scraping emitennews.com
 * Fitur:
 * - Multi-page scraping
 * - Simpan ke JSON dan CSV
 * - Download gambar thumbnail
 * - Scrape detail artikel
 */
import { Scrapling } from './src/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

// Configuration
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 5,
  articlesPerPage: 9,
  delayBetweenPages: 2000,
  useBrowser: true,
  headless: true,
  stealth: true,
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
 * Scrape listing halaman
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
 * Scrape detail artikel
 */
async function scrapeArticleDetail(scraper, url) {
  try {
    const result = await scraper.scrape(url, {
      title: { selector: 'h1', attr: 'text' },
      content: { 
        selector: '.news-content, .content, article', 
        attr: 'text',
        transform: (text) => text?.replace(/\s+/g, ' ').trim()
      },
      publishDate: { 
        selector: '[class*="date"], [class*="time"], span.small', 
        attr: 'text' 
      },
      tags: {
        selector: '[class*="tag"] a, .tag a',
        attr: 'text',
        multiple: true
      }
    });
    
    return result.data;
  } catch (error) {
    console.error(`Error scraping detail ${url}:`, error.message);
    return null;
  }
}

/**
 * Download gambar
 */
async function downloadImage(url, filename) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const filepath = join(CONFIG.outputDir, 'images', filename);
    writeFileSync(filepath, response.data);
    return filename;
  } catch (error) {
    return null;
  }
}

/**
 * Convert ke CSV
 */
function toCSV(articles) {
  const headers = ['No', 'Title', 'URL', 'Time', 'Image'];
  const rows = articles.map((a, i) => [
    i + 1,
    `"${a.title?.replace(/"/g, '""') || ''}"`,
    a.url || '',
    a.time || '',
    a.image || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Main scraping function
 */
async function scrapeEmitenNews(options = {}) {
  const {
    pageCount = CONFIG.pagesToScrape,
    scrapeDetail = false,
    downloadImages = false,
    outputFormat = 'json'
  } = options;
  
  console.log('=== Scraping EmitenNews.com ===\n');
  console.log(`Configuration:`);
  console.log(`  - Pages to scrape: ${pageCount}`);
  console.log(`  - Scrape detail: ${scrapeDetail}`);
  console.log(`  - Download images: ${downloadImages}`);
  console.log(`  - Output format: ${outputFormat}`);
  console.log();
  
  // Create output directory
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  if (downloadImages && !existsSync(join(CONFIG.outputDir, 'images'))) {
    mkdirSync(join(CONFIG.outputDir, 'images'), { recursive: true });
  }
  
  const scraper = new Scrapling({
    useBrowser: CONFIG.useBrowser,
    headless: CONFIG.headless,
    stealth: CONFIG.stealth,
    requestDelay: 1000
  });

  await scraper.init();

  try {
    const allArticles = [];
    
    for (let page = 1; page <= pageCount; page++) {
      const url = formatUrl(page);
      
      console.log(`\n📄 Scraping page ${page}/${pageCount}...`);
      console.log(`   URL: ${url}`);
      
      const articles = await scrapeListing(scraper, url);
      console.log(`   ✓ Found ${articles.length} articles`);
      
      // Scrape detail if requested
      if (scrapeDetail) {
        console.log(`   📝 Scraping article details...`);
        for (let i = 0; i < articles.length; i++) {
          if (articles[i].url) {
            console.log(`      ${i+1}/${articles.length} ${articles[i].title?.substring(0, 40)}...`);
            const detail = await scrapeArticleDetail(scraper, articles[i].url);
            articles[i].detail = detail;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Download images if requested
      if (downloadImages) {
        console.log(`   🖼️  Downloading images...`);
        for (let i = 0; i < articles.length; i++) {
          if (articles[i].image) {
            const filename = `article_${page}_${i}.jpg`;
            console.log(`      ${i+1}/${articles.length} ${filename}`);
            const savedFile = await downloadImage(articles[i].image, filename);
            articles[i].localImage = savedFile;
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      allArticles.push(...articles);
      
      // Delay between pages
      if (page < pageCount) {
        console.log(`   ⏳ Waiting ${CONFIG.delayBetweenPages/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPages));
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log(`Total articles scraped: ${allArticles.length}`);
    
    // Save to files
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (outputFormat === 'json' || outputFormat === 'both') {
      const jsonFile = join(CONFIG.outputDir, `emitennews_${timestamp}.json`);
      writeFileSync(jsonFile, JSON.stringify(allArticles, null, 2));
      console.log(`💾 Saved JSON to ${jsonFile}`);
    }
    
    if (outputFormat === 'csv' || outputFormat === 'both') {
      const csvFile = join(CONFIG.outputDir, `emitennews_${timestamp}.csv`);
      writeFileSync(csvFile, toCSV(allArticles));
      console.log(`💾 Saved CSV to ${csvFile}`);
    }
    
    return allArticles;
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await scraper.close();
  }
}

// Run scraping
await scrapeEmitenNews({
  pageCount: 3,
  scrapeDetail: false,
  downloadImages: false,
  outputFormat: 'json'
});
