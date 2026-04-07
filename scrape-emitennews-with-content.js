/**
 * Script scraping emitennews.com dengan menampilkan ISI LENGKAP ARTIKEL
 * Mengambil content dari div.artikel-body
 * 
 * Usage: node scrape-emitennews-with-content.js
 */
import { Scrapling } from './src/index.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 2,
  articlesPerPage: 9,
  delayBetweenPages: 2000,
  delayBetweenArticles: 1000,
  outputDir: './output',
  showFullContent: true,
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
  text = text.replace(/[\u00A0]+/g, ' '); // Replace non-breaking spaces
  
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
 * Klik dan scrape isi lengkap artikel dari div.artikel-body
 */
async function clickAndScrapeFullArticle(browser, articleUrl, articleTitle, index, total) {
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
    
    // Extract content dari div.artikel-body
    const articleData = await browser.evaluate(() => {
      // Helper untuk extract text
      const extractText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };
      
      // ⭐ UTAMA: Extract dari div.article-body (selector yang benar)
      const articleBody = document.querySelector('div.article-body');
      let mainContent = '';
      let paragraphs = [];
      
      if (articleBody) {
        // Ambil full text dari article-body
        mainContent = articleBody.textContent.trim();
        
        // Ambil semua paragraf di dalam article-body
        paragraphs = Array.from(articleBody.querySelectorAll('p'))
          .map(p => p.textContent.trim())
          .filter(text => text.length > 0);
      }
      
      // Fallback jika article-body tidak ada
      if (!mainContent) {
        const contentAreas = [
          '.body-content',
          '.content-container',
          '.news-content',
          '.content',
          '.article-content',
          'article'
        ];
        
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
      
      // Extract headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => ({
          level: h.tagName,
          text: h.textContent.trim()
        }));

      // Extract links HANYA dari article-body
      const links = articleBody
        ? Array.from(articleBody.querySelectorAll('a[href]'))
            .map(a => ({
              text: a.textContent.trim(),
              href: a.href
            }))
            .filter(l => l.text.length > 0 && l.href.startsWith('http'))
        : [];

      // Extract images HANYA dari article-body
      const images = articleBody
        ? Array.from(articleBody.querySelectorAll('img[src]'))
            .map(img => ({
              src: img.src,
              alt: img.alt || ''
            }))
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
    
    // Tampilkan hasil scraping
    console.log(`      ✅ Success!`);
    
    // Cek apakah article-body ditemukan
    if (!articleData.hasArtikelBody) {
      console.log(`      ⚠️  WARNING: div.article-body tidak ditemukan!`);
      console.log(`         Menggunakan fallback selector...`);
    }
    
    // Bersihkan content dari ads dan elemen tidak perlu
    articleData.content = cleanContent(articleData.content);
    articleData.paragraphs = articleData.paragraphs.map(p => cleanContent(p));
    
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`         📌 TITLE:`);
    console.log(`            ${articleData.title}`);
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
    
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`         📄 CONTENT:`);
    console.log(`         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    // Tampilkan isi konten lengkap dengan formatting yang lebih baik
    let contentToShow = articleData.content;
    if (CONFIG.maxContentPreview > 0 && contentToShow.length > CONFIG.maxContentPreview) {
      contentToShow = contentToShow.substring(0, CONFIG.maxContentPreview) + '\n\n... [truncated]';
    }
    
    // Format content dengan line breaks yang lebih readable
    // Split pada titik yang diikuti huruf kapital (awal kalimat baru)
    const sentences = contentToShow
      .replace(/\.\s+/g, '.\n')  // Split on period + space
      .split('\n')
      .filter(s => s.trim().length > 0);
    
    // Tampilkan dengan indentasi dan numbering
    sentences.forEach((sentence, i) => {
      const cleanSentence = sentence.trim()
        .replace(/^[0-9]+\.\s*/, '')  // Remove leading numbers
        .replace(/^(adsbygoogle|Temukan lebih banyak).*/i, '')  // Skip ads lines
        .trim();
      
      if (cleanSentence.length > 20) {  // Only show meaningful sentences
        console.log(`            ${cleanSentence}`);
        console.log();  // Empty line between sentences for readability
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
  const headers = ['No', 'Title', 'URL', 'Time', 'Content Length', 'Publish Date', 'Tags', 'Paragraphs'];
  const rows = articles.map((a, i) => [
    i + 1,
    `"${a.title?.replace(/"/g, '""') || ''}"`,
    a.url || '',
    a.time || '',
    a.detail?.content?.length || 0,
    a.detail?.publishDate || '',
    `"${a.detail?.tags?.join('; ') || ''}"`,
    a.detail?.paragraphs?.length || 0
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Save artikel lengkap ke file terpisah
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
    content += `Tags: ${article.detail.tags?.join(', ') || 'N/A'}\n`;
    content += `Has Article Body: ${article.detail.hasArtikelBody ? 'Yes ✓' : 'No ✗'}\n\n`;
    
    content += `───────────────────────────────────────────────────────\n`;
    content += `FULL CONTENT (from div.article-body)\n`;
    content += `───────────────────────────────────────────────────────\n`;
    content += `${article.detail.content}\n\n`;
    
    content += `───────────────────────────────────────────────────────\n`;
    content += `PARAGRAPHS (${article.detail.paragraphs?.length || 0})\n`;
    content += `───────────────────────────────────────────────────────\n`;
    if (article.detail.paragraphs && article.detail.paragraphs.length > 0) {
      article.detail.paragraphs.forEach((p, i) => {
        content += `\n[${i+1}] ${p}\n`;
      });
    }
  }
  
  writeFileSync(filepath, content, 'utf-8');
  return filename;
}

/**
 * Main scraping function
 */
async function scrapeEmitenNewsWithFullContent() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   SCRAPING EMITENNEWS.COM - div.article-body EXTRACTOR   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  console.log(`📋 Configuration:`);
  console.log(`   • Pages to scrape: ${CONFIG.pagesToScrape}`);
  console.log(`   • Articles per page: ${CONFIG.articlesPerPage}`);
  console.log(`   • Content source: div.article-body`);
  console.log(`   • Show full content: ${CONFIG.showFullContent}`);
  console.log(`   • Max content preview: ${CONFIG.maxContentPreview === 0 ? 'unlimited' : CONFIG.maxContentPreview + ' chars'}`);
  console.log(`   • Delay between pages: ${CONFIG.delayBetweenPages/1000}s`);
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
    
    for (let page = 1; page <= CONFIG.pagesToScrape; page++) {
      const url = formatUrl(page);
      
      console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
      console.log(`║  📄 PAGE ${page}/${CONFIG.pagesToScrape}`);
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
          CONFIG.pagesToScrape * CONFIG.articlesPerPage
        );
        
        article.detail = result.detail;
        article.error = result.error;
        allArticles.push(article);
        
        if (result.detail) {
          const savedFile = saveArticleToFile(article, CONFIG.outputDir, globalArticleCount);
          console.log(`   💾 Saved article to: articles/${savedFile}`);
        }
        
        if (i < articles.length - 1) {
          console.log(`   ⏳ Waiting ${CONFIG.delayBetweenArticles/1000}s before next article...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenArticles));
        }
      }
      
      if (page < CONFIG.pagesToScrape) {
        console.log(`\n   ⏳ Waiting ${CONFIG.delayBetweenPages/1000}s before next page...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenPages));
      }
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ SCRAPING COMPLETED!`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total articles: ${allArticles.length}`);
    console.log(`   • Successful: ${allArticles.filter(a => !a.error).length}`);
    console.log(`   • Failed: ${allArticles.filter(a => a.error).length}`);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const timeId = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1];
    
    const jsonFile = join(CONFIG.outputDir, `emitennews_article-body_${timestamp}_${timeId}.json`);
    writeFileSync(jsonFile, JSON.stringify(allArticles, null, 2));
    console.log(`\n💾 Saved detailed JSON to ${jsonFile}`);
    
    const csvFile = join(CONFIG.outputDir, `emitennews_summary_${timestamp}_${timeId}.csv`);
    writeFileSync(csvFile, toCSV(allArticles));
    console.log(`💾 Saved summary CSV to ${csvFile}`);
    
    console.log('\n📰 OUTPUT FILES:');
    console.log(`   • JSON: emitennews_article-body_${timestamp}_${timeId}.json`);
    console.log(`   • CSV: emitennews_summary_${timestamp}_${timeId}.csv`);
    console.log(`   • Individual articles: output/articles/article_XXX_*.txt`);
    
    return allArticles;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await scraper.close();
  }
}

await scrapeEmitenNewsWithFullContent();
