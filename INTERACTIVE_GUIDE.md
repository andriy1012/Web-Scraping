# 🎯 Interactive Page Selector - Scraping EmitenNews

Script ini memungkinkan kamu untuk **memilih halaman secara interaktif** saat script dijalankan!

## 🚀 Cara Menggunakan

### 1. Jalankan Script

```bash
node scrape-emitennews-interactive.js
```

### 2. Pilih Halaman

Script akan menampilkan prompt:

```
╔═══════════════════════════════════════════════════════════╗
║   SCRAPING EMITENNEWS.COM - INTERACTIVE MODE            ║
╚═══════════════════════════════════════════════════════════╝

📋 PILIH HALAMAN YANG MAU DI-SCRAPE:
   • Ketik angka tunggal: 1  atau  2  atau  3
   • Ketik beberapa angka: 1,2,3
   • Ketik range: 1-5  (halaman 1 sampai 5)
   • Kombinasi: 1,2,5-7  (halaman 1, 2, 5, 6, 7)
   • Kosongkan = halaman 1 saja

🎯 Pilih halaman (contoh: 1,2,3 atau 1-5): _
```

### 3. Input Pilihanmu

**Contoh-contoh input:**

| Input | Hasil |
|-------|-------|
| `1` | Scraping halaman 1 saja |
| `2` | Scraping halaman 2 saja |
| `3` | Scraping halaman 3 saja |
| `1,2` | Scraping halaman 1 dan 2 |
| `1,2,3` | Scraping halaman 1, 2, dan 3 |
| `1-5` | Scraping halaman 1 sampai 5 |
| `1,3,5-7` | Scraping halaman 1, 3, 5, 6, 7 |
| *(kosong)* | Scraping halaman 1 saja (default) |

## 📹 Demo Output

```
🎯 Pilih halaman (contoh: 1,2,3 atau 1-5): 1,2

✅ Halaman yang dipilih: [1, 2]
   Total: 2 halaman

╔═══════════════════════════════════════════════════════════╗
║  📄 PAGE 1
╚═══════════════════════════════════════════════════════════╝
   URL: https://emitennews.com/category/emiten
   📊 Found 9 articles

   🔵 [1/18] Membuka artikel...
      📰 Rights Issue BAJA Disetujui...
      ✅ Success!
         📄 CONTENT:
            Pemegang saham PT Saranacentral Bajatama Tbk...
            
╔═══════════════════════════════════════════════════════════╗
║  📄 PAGE 2
╚═══════════════════════════════════════════════════════════╝
   URL: https://emitennews.com/category/emiten/9
   📊 Found 9 articles
   ...
```

## 💡 Contoh Penggunaan

### Scraping Hari Ini (Halaman 1)
```bash
node scrape-emitennews-interactive.js
# Input: 1
```

### Scraping 3 Hari Terakhir
```bash
node scrape-emitennews-interactive.js
# Input: 1,2,3
```

### Scraping Minggu Ini
```bash
node scrape-emitennews-interactive.js
# Input: 1-7
```

### Scraping Halaman Spesifik
```bash
node scrape-emitennews-interactive.js
# Input: 1,5,10
```

## 📁 Output Files

Script menghasilkan:

1. **JSON** - `output/emitennews_pages-1-2_YYYY-MM-DD_HH-MM-SS.json`
2. **CSV** - `output/emitennews_pages-1-2_YYYY-MM-DD_HH-MM-SS.csv`
3. **TXT per artikel** - `output/articles/article_001_*.txt`

## 🎮 Fitur Interaktif

✅ **Prompt saat dijalankan** - Pilih halaman langsung  
✅ **Flexible input** - Support single, multiple, range  
✅ **Auto parse** - Input otomatis diparse  
✅ **Preview pilihan** - Tampilkan halaman yang dipilih  
✅ **Clean output** - Tanpa ads dan elemen tidak perlu  

## 📊 Perbandingan Script

| Script | Interactive | Custom Pages | Full Content |
|--------|-----------|--------------|--------------|
| `scrape-emitennews-live.js` | ❌ | ❌ | ❌ |
| `scrape-emitennews-with-content.js` | ❌ | ❌ | ✅ |
| `scrape-emitennews-custom-pages.js` | ❌ | ✅ | ✅ |
| **`scrape-emitennews-interactive.js`** ⭐ | ✅ | ✅ | ✅ |

## 🔧 Tips

### Input Cepat
- Tekan **Enter** tanpa input = halaman 1 saja
- Input **1-10** = scraping 10 halaman pertama
- Input **1,3,5** = lompat halaman

### Cancel Scraping
Tekan `Ctrl+C` untuk membatalkan scraping kapan saja.

## 📝 Command Line Examples

```bash
# Scraping halaman 1 saja
node scrape-emitennews-interactive.js
# [Enter] atau ketik: 1

# Scraping halaman 1 dan 2
node scrape-emitennews-interactive.js
# Ketik: 1,2

# Scraping halaman 1-5
node scrape-emitennews-interactive.js
# Ketik: 1-5

# Scraping halaman 1, 3, 5-7
node scrape-emitennews-interactive.js
# Ketik: 1,3,5-7
```

## ⚙️ Configuration

Edit bagian `CONFIG` di script untuk customize:

```javascript
const CONFIG = {
  baseUrl: 'https://emitennews.com',
  category: 'emiten',
  articlesPerPage: 9,
  delayBetweenArticles: 1000,  // 1 detik
  outputDir: './output',
  maxContentPreview: 3000,     // Max karakter
};
```

---

**Happy Scraping! 🚀**
