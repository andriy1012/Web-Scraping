# ✅ Script Scraping dengan Full Content - div.article-body

Script ini mengambil dan menampilkan **ISI LENGKAP ARTIKEL** dari `div.article-body` di website emitennews.com.

## 🎯 Fitur Utama

### Yang Ditampilkan:

```
🔵 [1/18] Membuka artikel...
   📰 Rights Issue BAJA Disetujui, Mayoritas Dana untuk Lunasi Utang
   🔗 https://emitennews.com/news/rights-issue-baja-disetujui-mayoritas-dana-untuk-lunasi-utang
   ✅ Success!
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📌 TITLE:
         Rights Issue BAJA Disetujui, Mayoritas Dana untuk Lunasi Utang
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📅 Publish Date: 02/04/2026, 15:30 WIB
      ✍️  Author: Irawan Hadip
      🏷️  Tags: #baja, #Saranacentral Bajatama, #konversi utang, #right issue
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📄 CONTENT FROM div.article-body (1859 characters):
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         EmitenNews.com - Pemegang saham PT Saranacentral Bajatama Tbk (BAJA) 
         resmi menyetujui rencana penambahan modal melalui mekanisme Hak 
         Memesan Efek Terlebih Dahulu (HMETD) atau rights issue...
         
         [FULL CONTENT ARTIKEL DITAMPILKAN LENGKAP]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📊 STATS:
         • Total paragraphs in article-body: 9
         • Total headings: 3
         • Total links in article-body: 0
         • Total images in article-body: 0
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📑 HEADINGS:
         • H1: Rights Issue BAJA Disetujui...
         • H2: Related News
         • H2: Trending
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📝 PARAGRAPHS (from div.article-body):
         [1] EmitenNews.com - Pemegang saham PT Saranacentral...
         [2] Persetujuan tersebut diperoleh dalam Rapat Umum...
         [3] Dalam aksi korporasi ini, Perseroan akan...
         ... [semua paragraf ditampilkan]
```

## 🚀 Cara Menggunakan

```bash
node scrape-emitennews-with-content.js
```

## 📁 Output Files

1. **Full JSON** - `output/emitennews_article-body_YYYY-MM-DD_HH-MM-SS.json`
2. **Summary CSV** - `output/emitennews_summary_YYYY-MM-DD_HH-MM-SS.csv`
3. **Individual Articles** - `output/articles/article_XXX_*.txt`

## ⚙️ Configuration

Edit bagian CONFIG di script:

```javascript
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 2,           // Jumlah halaman
  articlesPerPage: 9,
  delayBetweenPages: 2000,    // Delay antar halaman (ms)
  delayBetweenArticles: 1000, // Delay antar artikel (ms)
  outputDir: './output',
  
  // Content settings
  showFullContent: true,
  maxContentPreview: 3000     // Max karakter (0 = unlimited)
};
```

## 📊 Struktur Content yang Di-extract

Setiap artikel mengandung data dari `div.article-body`:

```javascript
{
  url: "https://...",
  title: "Judul artikel",
  publishDate: "02/04/2026, 15:30 WIB",
  author: "Irawan Hadip",
  content: "Full text dari div.article-body",
  paragraphs: [...],      // Semua paragraf dari article-body
  headings: [...],        // H1, H2, H3, dst
  links: [...],           // Links dari article-body
  images: [...],          // Images dari article-body
  tags: ["#baja", "..."], // Tags
  hasArtikelBody: true    // Apakah article-body ditemukan
}
```

## 📝 Perbandingan Script

| Script | Content Source | Tampilkan Full Content |
|--------|---------------|----------------------|
| `scrape-emitennews-live.js` | Auto-detect | ❌ Summary saja |
| **`scrape-emitennews-with-content.js`** | **div.article-body** | ✅ **FULL CONTENT** |

## 💡 Tips

1. **Content terpotong?** Increase `maxContentPreview`:
   ```javascript
   maxContentPreview: 10000  // Atau 0 untuk unlimited
   ```

2. **Ingin lebih cepat?** Kurangi delay:
   ```javascript
   delayBetweenArticles: 500  // 0.5 detik
   ```

3. **Article-body tidak ditemukan?** Script akan otomatis fallback ke selector lain.

## 🎯 Use Cases

- **Content Analysis** - Analisis panjang artikel, struktur
- **NLP/ML** - Training data untuk text classification
- **Sentiment Analysis** - Analisis sentimen berita emiten
- **Content Archive** - Backup artikel untuk referensi
- **Research** - Studi pola pemberitaan emiten

---

**Happy Scraping! 🚀**
