# Cara Scraping EmitenNews.com

## Quick Start

```bash
# Scraping dasar (3 halaman pertama)
node scrape-emitennews.js

# Scraping lengkap dengan opsi custom
node scrape-emitennews-full.js
```

## Struktur Website

EmitenNews.com menggunakan struktur berikut:
- **Container artikel**: `.news-card-2`
- **Judul**: `p.fs-16`
- **URL**: Ada di attribute `href` dari `.news-card-2` (element `<a>`)
- **Gambar**: `.news-card-2-img img`
- **Waktu**: `span.small`

## Selector CSS

```javascript
{
  articles: {
    selector: '.news-card-2',
    multiple: true,
    children: {
      title: { selector: 'p.fs-16', attr: 'text' },
      url: { selector: ':scope', attr: 'href' },
      image: { selector: '.news-card-2-img img', attr: 'src' },
      time: { selector: 'span.small', attr: 'text' }
    }
  }
}
```

## Pagination

Website menggunakan offset-based pagination:
- Halaman 1: `https://emitennews.com/category/emiten`
- Halaman 2: `https://emitennews.com/category/emiten/9`
- Halaman 3: `https://emitennews.com/category/emiten/18`
- dst (offset = (page-1) * 9)

## Contoh Penggunaan

### Basic Scraping

```javascript
import { Scrapling } from './src/index.js';

const scraper = new Scrapling({
  useBrowser: true,
  headless: true,
  stealth: true
});

await scraper.init();

const result = await scraper.scrape('https://emitennews.com/category/emiten', {
  articles: {
    selector: '.news-card-2',
    multiple: true,
    children: {
      title: { selector: 'p.fs-16', attr: 'text' },
      url: { selector: ':scope', attr: 'href' },
      image: { selector: '.news-card-2-img img', attr: 'src' },
      time: { selector: 'span.small', attr: 'text' }
    }
  }
});

console.log(result.data.articles);

await scraper.close();
```

### Multi-Page Scraping

```javascript
const allArticles = [];

for (let page = 1; page <= 5; page++) {
  const url = page === 1 
    ? 'https://emitennews.com/category/emiten'
    : `https://emitennews.com/category/emiten/${(page - 1) * 9}`;
  
  const result = await scraper.scrape(url, extractRules);
  allArticles.push(...result.data.articles);
  
  // Delay untuk avoid blocking
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### Scrape Detail Artikel

```javascript
// Setelah mendapat list artikel
for (const article of articles) {
  if (article.url) {
    const detail = await scraper.scrape(article.url, {
      title: { selector: 'h1', attr: 'text' },
      content: { selector: '.news-content', attr: 'text' },
      date: { selector: '[class*="date"]', attr: 'text' },
      tags: { selector: '.tag a', attr: 'text', multiple: true }
    });
    
    article.detail = detail.data;
  }
}
```

## Tips

1. **Gunakan Browser Automation** - Website menggunakan JavaScript untuk loading content
2. **Enable Stealth Mode** - Untuk menghindari deteksi bot
3. **Add Delay** - Tunggu 2-3 detik antar request
4. **Handle Pagination** - URL pagination menggunakan offset
5. **Use :scope Selector** - Untuk mengambil attribute dari parent element

## Output

Script akan menghasilkan JSON dengan struktur:

```json
[
  {
    "title": "Judul Artikel",
    "url": "https://emitennews.com/news/...",
    "image": "https://...",
    "time": "4 jam yang lalu"
  }
]
```

## Troubleshooting

### Artikel tidak ter-extract
- Pastikan menggunakan `:scope` selector untuk URL
- Cek apakah selector masih valid (website bisa update)

### Timeout error
- Tingkatkan timeout di options
- Gunakan `waitUntil: 'domcontentloaded'`

### Blocking/Deteksi
- Enable `stealth: true`
- Gunakan proxy rotation
- Increase delay antar request
