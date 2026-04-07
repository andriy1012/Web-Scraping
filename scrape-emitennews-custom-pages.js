/**
 * Script scraping emitennews.com dengan custom page selection
 * Bisa pilih halaman spesifik: 1 saja, 2 saja, 3 saja, atau kombinasi (1,2,3)
 * 
 * Usage: node scrape-emitennews-custom-pages.js
 */
import { Scrapling } from './src/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION - CUSTOM DI SINI
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  articlesPerPage: 9,
  delayBetweenArticles: 1000,
  outputDir: './output',
  maxContentPreview: 3000,
  
  // ═══════════════════════════════════════════════════════════
  // 🎯 PILIH HALAMAN YANG MAU DI-SCRAPE DI SINI
  // ═══════════════════════════════════════════════════════════
  
  // Opsi 1: Scraping halaman tertentu saja
  // Contoh: [1] = halaman 1 saja
  // Contoh: [2] = halaman 2 saja
  // Contoh: [3] = halaman 3 saja
  // Contoh: [1, 2] = halaman 1 dan 2
  // Contoh: [1, 2, 3] = halaman 1, 2, dan 3
  // Contoh: [1, 3, 5] = halaman 1, 3, dan 5
  pagesToScrape: [1, 2],  // ⬅️ EDIT DI SINI!
  
  // ═══════════════════════════════════════════════════════════
};

// ═══════════════════════════════════════════════════════════════
// JANGAN UBAH KODE DI BAWAH INI (KECUALI PAHAM)
// ═══════════════════════════════════════════════════════════════

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
 * Bersihkan content dari ads dan elemen tidak perlu
 */
function cleanContent(text) {
  if (!text) return '';
  
  // Hapus (adsbygoogle = window.adsbygoogle || []).push({});
  text = text.replace(/\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);/g, '');
  
  // Hapus "EmitenNews.com -" di awal
  text = text.replace(/^EmitenNews\.com\s*-\s*/g, '');
  
  // Hapus "Temukan lebih banyak..." dan variasi
  text = text.replace(/Temukan lebih banyak[^\n]{0,100}/g, '');
  
  // Hapus text "Author:" yang berulang
  text = text.replace(/Author:\s*Author:/g, 'Author:');
  
  // Hapus multiple newlines dan extra spaces
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.replace(/\s+/g, ' ');
  
  // Trim dan hapus karakter aneh
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
      
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({ level: h.tagName, text: h.textContent.trim() }));
      
      const links = articleBody 
        ? Array.from(articleBody.querySelectorAll('a[href]'))
            .map(a => ({ text: a.textContent.trim(), href: a.href }))
            .filter(l => l.text.length > 0 && l.href.startsWith('http'))
        : [];
      
      const images = articleBody
        ? Array.from(articleBody.querySelectorAll('img[src]'))
            .map(img => ({ src: img.src, alt: img.alt || '' }))
            .filter(img => img.src.includes('http'))
        : [];
      
      return {
        url: window.location.href,
        title: extractText('h1') || document.title,
        publishDate: extractText('[class*="date"], [class*="time"], span.small, .date'),
        author: extractText('[class*="author"], .author, [class*="writer"]'),
        content: mainContent,
        paragraphs: paragraphs,
        headings: headings,
        links: links,
        images: images,
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
    
    // Bersihkan content
    articleData.content = cleanContent(articleData.content);
    articleData.paragraphs = articleData.paragraphs.map(p => cleanContent(p));
    
    // Tampilkan info artikel
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`         📌 TITLE: ${articleData.title}`);
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (articleData.publishDate) {
      console.log(`         📅 Publish Date: ${articleData.publishDate}`);
    }
    
    if (articleData.author) {
      console.log(`         ✍️  Author: ${articleData.author}`);
    }
    
    if (articleData.tags.length > 0) {
      console.log(`         🏷️  Tags: ${articleData.tags.join(', ')}`);
    }
    
    // Tampilkan content
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
    content += `DETAIL\n`;
    content += `───────────────────────────────────────────────────────\n`;
    content += `Title: ${article.detail.title}\n`;
    content += `Publish Date: ${article.detail.publishDate || 'N/A'}\n`;
    content += `Author: ${article.detail.author || 'N/A'}\n`;
    content += `Tags: ${article.detail.tags?.join(', ') || 'N/A'}\n\n`;
    
    content += `───────────────────────────────────────────────────────\n`;
    content += `FULL CONTENT\n`;
    content += `───────────────────────────────────────────────────────\n`;
    content += `${article.detail.content}\n\n`;
  }
  
  writeFileSync(filepath, content, 'utf-8');
  return filename;
}

/**
 * Main scraping function
 */
async function scrapeEmitenNewsCustomPages() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   SCRAPING EMITENNEWS.COM - CUSTOM PAGE SELECTOR         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  // Sort pages
  const pages = CONFIG.pagesToScrape.sort((a, b) => a - b);
  
  console.log(`📋 Configuration:`);
  console.log(`   • Pages to scrape: [${pages.join(', ')}]`);
  console.log(`   • Total pages: ${pages.length}`);
  console.log(`   • Articles per page: ${CONFIG.articlesPerPage}`);
  console.log(`   • Delay between articles: ${CONFIG.delayBetweenArticles/1000}s`);
  console.log();
  
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
    
    return allArticles;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await scraper.close();
  }
}

await scrapeEmitenNewsCustomPages();
