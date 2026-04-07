/**
 * Script scraping emitennews.com dengan PROMPT INTERAKTIF
 * Bisa pilih halaman mana saja yang mau di-scrape
 * 
 * Usage: node scrape-emitennews-interactive.js
 */
import { Scrapling } from './src/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

// Configuration
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  articlesPerPage: 9,
  delayBetweenArticles: 1000,
  outputDir: './output',
  maxContentPreview: 3000
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
 * Bersihkan content dari ads
 */
function cleanContent(text) {
  if (!text) return '';
  
  text = text.replace(/\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);/g, '');
  text = text.replace(/^EmitenNews\.com\s*-\s*/g, '');
  text = text.replace(/Temukan lebih banyak[^\n]{0,100}/g, '');
  text = text.replace(/Author:\s*Author:/g, 'Author:');
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.replace(/\s+/g, ' ');
  text = text.trim();
  text = text.replace(/[\u00A0]+/g, ' ');
  
  return text;
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
 * Klik dan scrape isi lengkap artikel
 */
async function clickAndScrapeFullArticle(browser, articleUrl, articleTitle, index, total) {
  console.log(`\n   🔵 [${index}/${total}] Membuka artikel...`);
  console.log(`      📰 ${articleTitle}`);
  console.log(`      🔗 ${articleUrl}`);
  
  try {
    await browser.page.goto(articleUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await browser.page.waitForTimeout(2000);
    
    const articleData = await browser.evaluate(() => {
      const extractText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      const articleBody = document.querySelector('div.article-body');
      let mainContent = '';
      let paragraphs = [];
      
      if (articleBody) {
        mainContent = articleBody.textContent.trim();
        paragraphs = Array.from(articleBody.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(text => text.length > 0);
      }
      
      if (!mainContent) {
        const contentAreas = ['.body-content', '.content-container', '.news-content', '.content'];
        for (const selector of contentAreas) {
          const el = document.querySelector(selector);
          if (el) {
            mainContent = el.textContent.trim();
            paragraphs = Array.from(el.querySelectorAll('p'))
              .map(p => p.textContent.trim())
              .filter(text => text.length > 0);
            break;
          }
        }
      }
      
      return {
        url: window.location.href,
        title: extractText('h1') || document.title,
        publishDate: extractText('[class*="date"], [class*="time"], span.small, .date'),
        author: extractText('[class*="author"], .author, [class*="writer"]'),
        content: mainContent,
        paragraphs: paragraphs,
        tags: Array.from(document.querySelectorAll('.tag a, [class*="tag"] a'))
          .map(el => el.textContent.trim())
          .filter(t => t.length > 0),
        hasArtikelBody: !!articleBody
      };
    });
    
    console.log(`      ✅ Success!`);
    
    if (!articleData.hasArtikelBody) {
      console.log(`      ⚠️  WARNING: div.article-body tidak ditemukan!`);
    }
    
    articleData.content = cleanContent(articleData.content);
    
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`         📌 TITLE: ${articleData.title}`);
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (articleData.publishDate) {
      console.log(`         📅 Publish Date: ${articleData.publishDate}`);
    }
    
    if (articleData.tags.length > 0) {
      console.log(`         🏷️  Tags: ${articleData.tags.join(', ')}`);
    }
    
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`         📄 CONTENT:`);
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    let contentToShow = articleData.content;
    if (CONFIG.maxContentPreview > 0 && contentToShow.length > CONFIG.maxContentPreview) {
      contentToShow = contentToShow.substring(0, CONFIG.maxContentPreview) + '\n\n... [truncated]';
    }
    
    const sentences = contentToShow
      .replace(/\.\s+/g, '.\n')
      .split('\n')
      .filter(s => s.trim().length > 0);
    
    sentences.forEach((sentence) => {
      const cleanSentence = sentence.trim()
        .replace(/^[0-9]+\.\s*/, '')
        .replace(/^(adsbygoogle|Temukan lebih banyak).*/i, '')
        .trim();
      
      if (cleanSentence.length > 20) {
        console.log(`            ${cleanSentence}`);
        console.log();
      }
    });
    
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    return {
      url: articleUrl,
      title: articleTitle,
      detail: articleData
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
  const headers = ['No', 'Title', 'URL', 'Time', 'Content Length', 'Publish Date', 'Tags'];
  const rows = articles.map((a, i) => [
    i + 1,
    `"${a.title?.replace(/"/g, '""') || ''}"`,
    a.url || '',
    a.time || '',
    a.detail?.content?.length || 0,
    a.detail?.publishDate || '',
    `"${a.detail?.tags?.join('; ') || ''}"`
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Save artikel ke file terpisah
 */
function saveArticleToFile(article, outputDir, index) {
  const safeTitle = article.title
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  const filename = `article_${index.toString().padStart(3, '0')}_${safeTitle}.txt`;
  const filepath = join(outputDir, 'articles', filename);
  
  let content = `═══════════════════════════════════════════════════════════\n`;
  content += `ARTIKEL #${index}\n`;
  content += `═══════════════════════════════════════════════════════════\n\n`;
  content += `📰 TITLE: ${article.title}\n`;
  content += `🔗 URL: ${article.url}\n`;
  content += `📅 TIME: ${article.time || 'N/A'}\n\n`;
  
  if (article.detail) {
    content += `───────────────────────────────────────────────────────\n`;
    content += `FULL CONTENT\n`;
    content += `───────────────────────────────────────────────────────\n`;
    content += `${article.detail.content}\n\n`;
  }
  
  writeFileSync(filepath, content, 'utf-8');
  return filename;
}

/**
 * Parse input halaman dari user
 */
function parsePages(input) {
  if (!input || input.trim() === '') {
    return [1];
  }
  
  const pages = new Set();
  const parts = input.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end >= start) {
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 1) {
        pages.add(num);
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Main scraping function
 */
async function scrapeEmitenNewsInteractive() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   SCRAPING EMITENNEWS.COM - INTERACTIVE MODE            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 PILIH HALAMAN YANG MAU DI-SCRAPE:');
  console.log('   • Ketik angka tunggal: 1  atau  2  atau  3');
  console.log('   • Ketik beberapa angka: 1,2,3');
  console.log('   • Ketik range: 1-5  (halaman 1 sampai 5)');
  console.log('   • Kombinasi: 1,2,5-7  (halaman 1, 2, 5, 6, 7)');
  console.log('   • Kosongkan = halaman 1 saja\n');
  
  const pageInput = await question('🎯 Pilih halaman (contoh: 1,2,3 atau 1-5): ');
  const pages = parsePages(pageInput);
  
  console.log(`\n✅ Halaman yang dipilih: [${pages.join(', ')}]`);
  console.log(`   Total: ${pages.length} halaman\n`);
  
  // Create output directories
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  if (!existsSync(join(CONFIG.outputDir, 'articles'))) {
    mkdirSync(join(CONFIG.outputDir, 'articles'), { recursive: true });
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
    
    for (const page of pages) {
      const url = formatUrl(page);
      
      console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
      console.log(`║  📄 PAGE ${page}`);
      console.log(`╚═══════════════════════════════════════════════════════════╝`);
      console.log(`   URL: ${url}`);
      
      const articles = await scrapeListing(scraper, url);
      console.log(`   📊 Found ${articles.length} articles`);
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        globalArticleCount++;
        
        if (!article.url) {
          console.log(`\n   ⚠️  [${globalArticleCount}] Skipping - No URL`);
          continue;
        }
        
        const result = await clickAndScrapeFullArticle(
          scraper.browser, 
          article.url, 
          article.title,
          globalArticleCount,
          pages.length * CONFIG.articlesPerPage
        );
        
        article.detail = result.detail;
        article.error = result.error;
        allArticles.push(article);
        
        if (result.detail) {
          const savedFile = saveArticleToFile(article, CONFIG.outputDir, globalArticleCount);
          console.log(`   💾 Saved: articles/${savedFile}`);
        }
        
        if (i < articles.length - 1) {
          console.log(`   ⏳ Waiting ${CONFIG.delayBetweenArticles/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenArticles));
        }
      }
      
      if (page !== pages[pages.length - 1]) {
        console.log(`\n   ⏳ Waiting 2s before next page...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ SCRAPING COMPLETED!`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Pages scraped: [${pages.join(', ')}]`);
    console.log(`   • Total articles: ${allArticles.length}`);
    console.log(`   • Successful: ${allArticles.filter(a => !a.error).length}`);
    console.log(`   • Failed: ${allArticles.filter(a => a.error).length}`);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const timeId = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1];
    
    const jsonFile = join(CONFIG.outputDir, `emitennews_pages-${pages.join('-')}_${timestamp}_${timeId}.json`);
    writeFileSync(jsonFile, JSON.stringify(allArticles, null, 2));
    console.log(`\n💾 Saved JSON: ${jsonFile}`);
    
    const csvFile = join(CONFIG.outputDir, `emitennews_pages-${pages.join('-')}_${timestamp}_${timeId}.csv`);
    writeFileSync(csvFile, toCSV(allArticles));
    console.log(`💾 Saved CSV: ${csvFile}`);
    
    console.log('\n📰 OUTPUT FILES:');
    console.log(`   • JSON: emitennews_pages-${pages.join('-')}_${timestamp}_${timeId}.json`);
    console.log(`   • CSV: emitennews_pages-${pages.join('-')}_${timestamp}_${timeId}.csv`);
    console.log(`   • Articles: output/articles/article_XXX_*.txt`);
    
    rl.close();
    return allArticles;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    throw error;
  } finally {
    await scraper.close();
  }
}

await scrapeEmitenNewsInteractive();
