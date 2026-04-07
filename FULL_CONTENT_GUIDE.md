# 📄 Full Content Scraping - EmitenNews.com

Script ini menampilkan **ISI LENGKAP ARTIKEL** dari setiap halaman yang diklik, termasuk:
- Full content text
- Author/writer
- Publish date
- Tags
- Headings structure
- Related links
- Images
- Statistics

## 🎯 Fitur Utama

### ✅ Yang Ditampilkan Per Artikel:

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
      📄 CONTENT (1427 characters):
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         1. IDXINDUST -2.23%
         2. IDXINFRA -3.96%
         3. ... [full content ditampilkan per kalimat]
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📊 STATS:
         • Total paragraphs: 23
         • Total headings: 3
         • Total links: 20
         • Total images: 145
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📑 HEADINGS:
         • H1: Rights Issue BAJA Disetujui...
         • H2: Related News
         • H2: Trending
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🔗 RELATED LINKS (first 10):
         1. Register → https://emitennews.com/register
         2. Login → https://emitennews.com/login
         3. Beranda → https://emitennews.com/
         ...
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🚀 Cara Menggunakan

### Basic Usage

```bash
node scrape-emitennews-with-content.js
```

### Customize Configuration

Edit bagian `CONFIG` di script:

```javascript
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  pagesToScrape: 2,           // Jumlah halaman
  articlesPerPage: 9,
  delayBetweenPages: 2000,    // Delay antar halaman (ms)
  delayBetweenArticles: 1000, // Delay antar artikel (ms)
  outputDir: './output',
  
  // ⭐ PENGATURAN CONTENT
  showFullContent: true,      // Tampilkan isi lengkap
  maxContentPreview: 2000     // Max karakter (0 = unlimited)
};
```

## 📁 Output Files

Script menghasilkan **3 jenis output**:

### 1. Full JSON Data
```
output/emitennews_FULL_CONTENT_2026-04-02_13-08-05.json
```

Berisi semua data lengkap termasuk full content, headings, links, images, dll.

### 2. Summary CSV
```
output/emitennews_summary_2026-04-02_13-08-05.csv
```

Ringkasan dalam format CSV untuk analisis cepat.

### 3. Individual Article Files ⭐
```
output/articles/article_001_Rights_Issue_BAJA_Disetujui.txt
output/articles/article_002_Perluas_Bisnis_BUAH_Bidik.txt
...
```

Setiap artikel disimpan sebagai file **TXT terpisah** dengan format:

```
═══════════════════════════════════════════════════════════
ARTIKEL #1
═══════════════════════════════════════════════════════════

📰 TITLE: Rights Issue BAJA Disetujui...
🔗 URL: https://emitennews.com/news/...
📅 TIME: 4 jam yang lalu

───────────────────────────────────────────────────────
DETAIL
───────────────────────────────────────────────────────
Title: Rights Issue BAJA Disetujui...
Publish Date: 02/04/2026, 15:30 WIB
Author: Irawan Hadip
Tags: #baja, #Saranacentral Bajatama, ...

───────────────────────────────────────────────────────
FULL CONTENT
───────────────────────────────────────────────────────
[Isi lengkap artikel ditampilkan di sini]

───────────────────────────────────────────────────────
STATS
───────────────────────────────────────────────────────
Paragraphs: 23
Headings: 3
Links: 20
Images: 145
```

## 🎨 Data yang Di-extract

Setiap artikel mengandung:

```javascript
{
  url: "https://...",
  title: "Judul artikel",
  publishDate: "02/04/2026, 15:30 WIB",
  author: "Irawan Hadip",
  content: "Full text content...",
  paragraphs: [...],      // List semua paragraf
  headings: [             // Structure headings
    { level: "H1", text: "..." },
    { level: "H2", text: "..." }
  ],
  links: [                // Related links
    { text: "...", href: "..." }
  ],
  images: [               // Images
    { src: "...", alt: "..." }
  ],
  meta: { ... },          // Meta tags
  tags: ["#baja", "..."]  // Tags
}
```

## ⚙️ Customization Options

### Tampilkan Content Tanpa Batas

```javascript
const CONFIG = {
  ...
  maxContentPreview: 0  // 0 = unlimited (tampilkan semua)
};
```

### Tampilkan Preview Saja

```javascript
const CONFIG = {
  ...
  maxContentPreview: 500  // Tampilkan 500 karakter pertama
};
```

### Scrape Lebih Banyak Halaman

```javascript
const CONFIG = {
  pagesToScrape: 10,  // Scrape 10 halaman (90 artikel)
  ...
};
```

### Slower tapi Lebih Aman

```javascript
const CONFIG = {
  delayBetweenPages: 5000,     // 5 detik
  delayBetweenArticles: 3000,  // 3 detik
  ...
};
```

## 📊 Perbandingan Script

| Fitur | `scrape-emitennews-live.js` | `scrape-emitennews-with-content.js` ⭐ |
|-------|----------------------------|---------------------------------------|
| Live progress | ✅ | ✅ |
| Click artikel | ✅ | ✅ |
| **Tampilkan isi lengkap** | ❌ | ✅ |
| **Tampilkan headings** | ❌ | ✅ |
| **Tampilkan related links** | ❌ | ✅ |
| **Save per artikel** | ❌ | ✅ |
| Author info | ❌ | ✅ |
| Content stats | ❌ | ✅ |
| JSON output | ✅ | ✅ |
| CSV output | ✅ | ✅ |

## 💡 Use Cases

### 1. Content Analysis
```bash
# Analisis panjang artikel
node scrape-emitennews-with-content.js

# Lihat output/stats untuk melihat:
# - Average content length
# - Number of paragraphs
# - Number of images per article
```

### 2. Link Analysis
```bash
# Analisis related links
# Lihat output/related links untuk melihat:
# - Internal linking pattern
# - Related articles
# - Cross-references
```

### 3. Content Extraction
```bash
# Dapatkan full text untuk NLP/ML
# File individual di output/articles/
# siap untuk:
# - Sentiment analysis
# - Text classification
# - Topic modeling
```

### 4. Author Tracking
```bash
# Track author/writer
# Lihat author field untuk analisis:
# - Artikel per author
# - Writing style
# - Topic specialization
```

## 🔧 Troubleshooting

### Content Kosong (0 characters)

Website mungkin update struktur HTML. Update selector di:

```javascript
const contentAreas = [
  '.news-content',    // Coba selector lain
  '.content',
  '.article-content',
  'article'
];
```

### Content Terpotong

Increase `maxContentPreview`:

```javascript
const CONFIG = {
  maxContentPreview: 5000  // Increase limit
};
```

### Terlalu Banyak Data

Focus pada content saja:

```javascript
const CONFIG = {
  showFullContent: true,
  maxContentPreview: 1000,  // Preview saja
  pagesToScrape: 1          // Test 1 halaman dulu
};
```

## 📝 Tips

1. **Backup data** - File JSON bisa besar, backup secara berkala
2. **Gunakan individual files** - File TXT per artikel lebih mudah di-process
3. **Monitor console output** - Stats memberikan insight cepat
4. **Customize output** - Sesuaikan `maxContentPreview` dengan kebutuhan

## 🎓 Next Steps

Setelah scraping:

1. **Text Processing** - Bersihkan text untuk analisis
2. **NLP Analysis** - Sentiment analysis, keyword extraction
3. **Visualization** - Word clouds, topic modeling
4. **Database** - Import ke MongoDB/Elasticsearch untuk search

## 📄 Files Reference

| File | Purpose |
|------|---------|
| `scrape-emitennews-with-content.js` ⭐ | **Script utama dengan full content** |
| `scrape-emitennews-live.js` | Live progress tanpa full content |
| `scrape-emitennews.js` | Basic scraping (quick) |
| `scrape-emitennews-full.js` | Advanced dengan opsi custom |

## 🎯 Recommended Usage

Untuk penggunaan terbaik:

```bash
# 1. Test dulu dengan 1 halaman
# Edit CONFIG:
pagesToScrape: 1

# 2. Jalankan test
node scrape-emitennews-with-content.js

# 3. Cek output
ls -la output/
cat output/articles/article_001_*.txt

# 4. Jika OK, increase ke halaman lebih banyak
pagesToScrape: 5
```

## 📚 Example Output

Lihat file di `output/articles/` untuk contoh lengkap format output.

---

**Happy Scraping! 🚀**
