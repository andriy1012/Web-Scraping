# 📄 Custom Page Selector - Scraping EmitenNews

Script ini memungkinkan kamu untuk **memilih halaman spesifik** yang ingin di-scrape.

## 🎯 Fitur Utama

✅ Pilih halaman tertentu saja (1, 2, 3, dst)  
✅ Pilih kombinasi halaman (1,2 atau 1,3,5 atau 1,2,3)  
✅ Tampilan clean tanpa ads  
✅ Full content extraction dari div.article-body  
✅ Save ke JSON, CSV, dan TXT per artikel  

## 🚀 Cara Menggunakan

### 1. Edit Configuration

Buka file `scrape-emitennews-custom-pages.js` dan edit bagian ini:

```javascript
const CONFIG = {
  // ... other config ...
  
  // ═══════════════════════════════════════════════════
  // 🎯 PILIH HALAMAN YANG MAU DI-SCRAPE DI SINI
  // ═══════════════════════════════════════════════════
  
  pagesToScrape: [1, 2],  // ⬅️ EDIT DI SINI!
  
  // ═══════════════════════════════════════════════════
};
```

### 2. Pilih Halaman

**Contoh-contoh:**

```javascript
// Halaman 1 saja
pagesToScrape: [1]

// Halaman 2 saja
pagesToScrape: [2]

// Halaman 3 saja
pagesToScrape: [3]

// Halaman 1 dan 2
pagesToScrape: [1, 2]

// Halaman 1, 2, dan 3
pagesToScrape: [1, 2, 3]

// Halaman 1, 3, dan 5 (lompat)
pagesToScrape: [1, 3, 5]

// Halaman 10, 11, 12
pagesToScrape: [10, 11, 12]
```

### 3. Jalankan Script

```bash
node scrape-emitennews-custom-pages.js
```

## 📹 Contoh Output

```
╔═══════════════════════════════════════════════════════════╗
║   SCRAPING EMITENNEWS.COM - CUSTOM PAGE SELECTOR         ║
╚═══════════════════════════════════════════════════════════╝

📋 Configuration:
   • Pages to scrape: [1, 2]
   • Total pages: 2

╔═══════════════════════════════════════════════════════════╗
║  📄 PAGE 1
╚═══════════════════════════════════════════════════════════╝
   URL: https://emitennews.com/category/emiten
   📊 Found 9 articles

   🔵 [1/18] Membuka artikel...
      📰 Rights Issue BAJA Disetujui...
      ✅ Success!
         📌 TITLE: Rights Issue BAJA Disetujui...
         📅 Publish Date: 02/04/2026, 15:30 WIB
         🏷️  Tags: #baja, #Saranacentral Bajatama, ...
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         📄 CONTENT:
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Pemegang saham PT Saranacentral Bajatama Tbk 
            (BAJA) resmi menyetujui rencana penambahan modal...
            
            Dalam aksi korporasi ini, Perseroan akan 
            menerbitkan sebanyak-banyaknya 1 miliar saham...
```

## 📁 Output Files

Script menghasilkan 3 jenis output:

### 1. JSON (Full Data)
```
output/emitennews_pages-1-2_2026-04-02_13-30-45.json
```

### 2. CSV (Summary)
```
output/emitennews_pages-1-2_2026-04-02_13-30-45.csv
```

### 3. Individual Articles (TXT)
```
output/articles/article_001_Rights_Issue_BAJA_Disetujui.txt
output/articles/article_002_Perluas_Bisnis_BUAH_Bidik.txt
...
```

## ⚙️ Configuration Options

```javascript
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  articlesPerPage: 9,
  delayBetweenArticles: 1000,  // 1 detik
  outputDir: './output',
  maxContentPreview: 3000,     // Max karakter (0 = unlimited)
  
  // ⬅️ PILIH HALAMAN DI SINI
  pagesToScrape: [1, 2],
};
```

## 💡 Tips Penggunaan

### Scrape Halaman Terbaru Saja
```javascript
pagesToScrape: [1]  // Halaman pertama (terbaru)
```

### Scrape Range Halaman
```javascript
pagesToScrape: [1, 2, 3, 4, 5]  // 5 halaman pertama
```

### Scrape Halaman Spesifik
```javascript
pagesToScrape: [10, 20, 30]  // Halaman tertentu saja
```

### Scrape Semua Halaman (1-10)
```javascript
pagesToScrape: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

## 📊 Perbandingan Script

| Script | Custom Pages | Full Content | Clean Output |
|--------|-------------|--------------|--------------|
| `scrape-emitennews-live.js` | ❌ | ❌ | ✅ |
| `scrape-emitennews-with-content.js` | ❌ | ✅ | ✅ |
| **`scrape-emitennews-custom-pages.js`** ⭐ | ✅ | ✅ | ✅ |

## 🎯 Use Cases

### 1. Scrape Hari Ini Saja
```javascript
pagesToScrape: [1]  // Halaman pertama = terbaru
```

### 2. Scrape Minggu Ini
```javascript
pagesToScrape: [1, 2, 3, 4, 5, 6, 7]  // 7 halaman pertama
```

### 3. Scrape Bulan Ini
```javascript
pagesToScrape: [1, 2, 3, ..., 30]  // 30 halaman pertama
```

### 4. Scrape Halaman Spesifik
```javascript
// Misalnya mau halaman 5, 10, 15 saja
pagesToScrape: [5, 10, 15]
```

## 🔧 Troubleshooting

### Script Tidak Jalan?
1. Pastikan Node.js terinstall
2. Install dependencies: `npm install`
3. Install Playwright: `npx playwright install`

### Content Kosong?
Website mungkin update struktur HTML. Script akan otomatis fallback ke selector lain.

### Kena Blocking?
Increase delay:
```javascript
delayBetweenArticles: 3000  // 3 detik
```

## 📝 Contoh Lengkap

```javascript
// ═══════════════════════════════════════════════════
// CONTOH 1: Scrape halaman 1 saja (terbaru)
// ═══════════════════════════════════════════════════
pagesToScrape: [1]

// ═══════════════════════════════════════════════════
// CONTOH 2: Scrape halaman 1 dan 2
// ═══════════════════════════════════════════════════
pagesToScrape: [1, 2]

// ═══════════════════════════════════════════════════
// CONTOH 3: Scrape halaman 1, 2, 3, 4, 5
// ═══════════════════════════════════════════════════
pagesToScrape: [1, 2, 3, 4, 5]

// ═══════════════════════════════════════════════════
// CONTOH 4: Scrape halaman 10, 20, 30 (lompat)
// ═══════════════════════════════════════════════════
pagesToScrape: [10, 20, 30]
```

---

**Happy Scraping! 🚀**
