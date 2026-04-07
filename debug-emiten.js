/**
 * Debug parser extract
 */
import { Scrapling } from './src/index.js';

const scraper = new Scrapling({
  useBrowser: true,
  headless: true,
  stealth: true
});

await scraper.init();

try {
  console.log('Scraping emitennews.com...\n');
  
  const extractRules = {
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
          selector: '.news-card-2', 
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
  };
  
  const result = await scraper.scrape('https://emitennews.com/category/emiten', extractRules);
  
  console.log('Result data keys:', Object.keys(result.data));
  console.log('Articles:', result.data.articles);
  console.log('Articles length:', result.data.articles?.length);
  console.log('First article:', result.data.articles?.[0]);
  
  // Cek isi articles
  if (result.data.articles && result.data.articles.length > 0) {
    console.log('\n=== FIRST ARTICLE ===');
    console.log(JSON.stringify(result.data.articles[0], null, 2));
  }
  
  // Cek filter
  if (result.data.articles) {
    const validArticles = result.data.articles.filter(a => a.title && a.url);
    console.log('\n=== VALID ARTICLES ===');
    console.log('Valid count:', validArticles.length);
    console.log('First valid:', validArticles[0]);
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await scraper.close();
}
