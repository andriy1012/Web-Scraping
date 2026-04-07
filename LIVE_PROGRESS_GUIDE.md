# 🚀 Live Progress Scraping - EmitenNews.com

Script ini akan melakukan scraping dengan **live progress** - menampilkan setiap artikel yang diklik dan di-scrape secara real-time.

## 📹 Demo Output

```
╔═══════════════════════════════════════════════════════════╗
║     SCRAPING EMITENNEWS.COM - LIVE PROGRESS MODE         ║
╚═══════════════════════════════════════════════════════════╝

📄 PAGE 1/3
   URL: https://emitennews.com/category/emiten
   📊 Found 9 articles

   🔵 [1/27] Membuka artikel...
      📰 Rights Issue BAJA Disetujui, Mayoritas Dana untuk Lunasi Utang
      🔗 https://emitennews.com/news/rights-issue-baja-disetujui-mayoritas-dana-untuk-lunasi-utang
      ✅ Success!
         Title: Rights Issue BAJA Disetujui, Mayoritas Dana untuk Lunasi Uta...
         Content length: 3542 characters
         Publish date: 02/04/2026, 15:30 WIB
         Tags: #baja, #Saranacentral Bajatama, #konversi utang, #right issue
   ⏳ Waiting 1s before next article...

   🔵 [2/27] Membuka artikel...
      📰 Perluas Bisnis, BUAH Bidik Perdagangan Daging Ayam Olahan
      🔗 https://emitennews.com/news/perluas-bisnis-buah-bidik-perdagangan-daging-ayam-olahan
      ✅ Success!
         ...
```

## 🎯 Cara Menggunakan

### Basic Usage

```bash
node scrape-emitennews-live.js
```

### Customize Configuration

Edit bagian `CONFIG` di `scrape-emitennews-live.js`:

```javascript
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 3,          // Jumlah halaman yang discrape
  articlesPerPage: 9,        // Artikel per halaman
  delayBetweenPages: 2000,   // Delay antar halaman (ms)
  delayBetweenArticles: 1000, // Delay antar artikel (ms)
  outputDir: './output'      // Folder output
};
```

## 📁 Output Files

Script akan menghasilkan 2 file:

### 1. Detailed JSON
```json
[
  {
    "title": "Rights Issue BAJA Disetujui...",
    "url": "https://emitennews.com/news/...",
    "image": "https://...",
    "time": "4 jam yang lalu",
    "detail": {
      "title": "Rights Issue BAJA Disetujui...",
      "content": "...",
      "publishDate": "02/04/2026, 15:30 WIB",
      "author": "",
      "tags": ["#baja", "#Saranacentral Bajatama", ...]
    }
  }
]
```

### 2. Summary CSV
```csv
No,Title,URL,Time,Detail Title,Content Length,Publish Date
1,"Rights Issue BAJA...","https://...",...
```

## 🔧 Fitur

✅ **Live Progress** - Lihat progress real-time setiap artikel di-scrape  
✅ **Auto Click** - Otomatis mengklik setiap artikel untuk detail  
✅ **Multi-page** - Scraping beberapa halaman sekaligus  
✅ **Rate Limiting** - Delay otomatis untuk avoid blocking  
✅ **Stealth Mode** - Anti-detection scripts  
✅ **Dual Output** - JSON (detailed) + CSV (summary)  
✅ **Error Handling** - Tetap lanjut jika ada error  

## 📊 Flow Diagram

```
START
  │
  ├─► Initialize Browser
  │
  ├─► FOR each page (1 to N)
  │     │
  │     ├─► Scrape listing page
  │     │   └─► Get 9 articles
  │     │
  │     └─► FOR each article
  │           │
  │           ├─► Click/Navigate to article URL
  │           ├─► Extract detail (title, content, date, tags)
  │           ├─► Display progress
  │           └─► Wait 1 second
  │
  ├─► Save to JSON & CSV
  │
  └─► END
```

## ⚙️ Customization Examples

### Scrape More Pages

```javascript
const CONFIG = {
  pagesToScrape: 10,  // Scrape 10 halaman (90 artikel)
  ...
};
```

### Faster Scraping (Risky)

```javascript
const CONFIG = {
  delayBetweenPages: 1000,     // 1 second
  delayBetweenArticles: 500,   // 0.5 second
  ...
};
```

⚠️ **Warning**: Terlalu cepat bisa kena blocking!

### Slower but Safer

```javascript
const CONFIG = {
  delayBetweenPages: 5000,     // 5 seconds
  delayBetweenArticles: 2000,  // 2 seconds
  ...
};
```

## 🎨 Icon Legend

| Icon | Meaning |
|------|---------|
| 📄   | Page being scraped |
| 🔵   | Article being processed |
| 📰   | Article title |
| 🔗   | Article URL |
| ✅   | Success |
| ❌   | Error |
| ⏳   | Waiting/delay |
| 💾   | File saved |
| 📊   | Summary |

## 🛠️ Troubleshooting

### Browser tidak muncul
Script menggunakan `headless: true` - browser berjalan di background. Untuk melihat browser:

```javascript
const scraper = new Scrapling({
  useBrowser: true,
  headless: false,  // Show browser window
  ...
});
```

### Timeout error
Tingkatkan timeout di browser navigation:

```javascript
await browser.page.goto(articleUrl, {
  waitUntil: 'domcontentloaded',
  timeout: 60000  // Increase to 60 seconds
});
```

### Kena blocking
1. Increase delay
2. Gunakan proxy rotation
3. Enable stealth mode (sudah default)

### Content tidak ter-extract
Website mungkin update struktur HTML. Cek selector di:

```javascript
const detail = await browser.evaluate(() => {
  return {
    title: document.querySelector('h1')?.textContent?.trim() || '',
    content: document.querySelector('.news-content')?.textContent?.trim() || '',
    // ...
  };
});
```

## 📝 Tips

1. **Mulai dengan halaman sedikit** - Test dengan `pagesToScrape: 2` dulu
2. **Monitor output** - Pastikan data ter-extract dengan benar
3. **Simpan hasil** - File JSON bisa dipakai untuk analisis lanjutan
4. **Jadwalkan scraping** - Bisa dijalankan rutin untuk update data

## 🎓 Next Steps

Setelah scraping, kamu bisa:

1. **Analisis data** - Gunakan Python/pandas untuk analisis
2. **Visualisasi** - Buat chart tren berita
3. **Machine Learning** - Sentiment analysis, classification
4. **Database** - Simpan ke MongoDB/PostgreSQL

## 📄 License

MIT License - Feel free to modify and use!
