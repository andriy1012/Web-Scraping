/**
 * Debug untuk cek struktur HTML halaman artikel emitennews
 */
import { BrowserEngine } from './src/index.js';

const browser = new BrowserEngine({ headless: true, stealth: true });
await browser.launch();

try {
  const articleUrl = 'https://emitennews.com/news/rights-issue-baja-disetujui-mayoritas-dana-untuk-lunasi-utang';
  console.log('Navigating to:', articleUrl);
  
  await browser.page.goto(articleUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  await browser.page.waitForTimeout(3000);
  
  // Cek semua div dengan class yang mengandung "body" atau "content" atau "artikel"
  const divs = await browser.evaluate(() => {
    return Array.from(document.querySelectorAll('div[class*="body"], div[class*="content"], div[class*="artikel"], div[class*="article"], div[class*="news"]'))
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        textLength: el.textContent.length,
        textPreview: el.textContent.trim().substring(0, 100)
      }))
      .filter(el => el.textLength > 100); // Hanya yang punya content
  });
  
  console.log('\n=== DIVS DENGAN CONTENT ===\n');
  divs.forEach((div, i) => {
    console.log(`${i+1}. <div class="${div.class}">`);
    console.log(`   Text length: ${div.textLength}`);
    console.log(`   Preview: ${div.textPreview}...\n`);
  });
  
  // Cek struktur lengkap
  const structure = await browser.evaluate(() => {
    // Cari main content area
    const main = document.querySelector('main');
    const article = document.querySelector('article');
    const newsContent = document.querySelector('.news-content');
    const content = document.querySelector('.content');
    const artikelBody = document.querySelector('.artikel-body');
    const articleBody = document.querySelector('.article-body');
    
    return {
      hasMain: !!main,
      hasArticle: !!article,
      hasNewsContent: !!newsContent,
      hasContent: !!content,
      hasArtikelBody: !!artikelBody,
      hasArticleBody: !!articleBody,
      
      // Text content dari masing-masing
      mainText: main?.textContent?.length || 0,
      articleText: article?.textContent?.length || 0,
      newsContentText: newsContent?.textContent?.length || 0,
      contentText: content?.textContent?.length || 0
    };
  });
  
  console.log('\n=== STRUCTURE CHECK ===\n');
  console.log(JSON.stringify(structure, null, 2));
  
  // Tampilkan HTML dari content utama
  const mainContent = await browser.evaluate(() => {
    // Coba berbagai selector
    const selectors = ['.news-content', '.content', 'article', 'main'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.length > 100) {
        return {
          selector: sel,
          html: el.outerHTML.substring(0, 2000)
        };
      }
    }
    return null;
  });
  
  if (mainContent) {
    console.log('\n=== MAIN CONTENT HTML ===\n');
    console.log(`Selector: ${mainContent.selector}`);
    console.log(mainContent.html);
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}
