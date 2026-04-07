# Web Scraping Emiten News

Web scraping tool untuk mengambil berita emiten saham dari berbagai sumber berita keuangan Indonesia.

## 📋 Prerequisites

Pastikan sistem Anda sudah terinstall:

- **Node.js** (versi 18 atau lebih baru)
- **npm** (package manager, biasanya sudah termasuk dengan Node.js)

### Install Node.js

**Windows:**
- Download installer dari [nodejs.org](https://nodejs.org/)
- Jalankan installer dan ikuti wizard setup
- Verifikasi installation:
  ```bash
  node --version
  npm --version
  ```

**macOS:**
```bash
# Menggunakan Homebrew (recommended)
brew install node

# Atau download dari nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
# Menggunakan NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node --version
npm --version
```

**Linux (Arch-based):**
```bash
sudo pacman -S nodejs npm
```

## 🚀 Installation

1. **Clone atau extract project** ke directory pilihan Anda

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (untuk browser automation):
   ```bash
   npx playwright install
   ```

   **Catatan untuk Linux:**
   - Mungkin perlu install dependencies tambahan:
     ```bash
     npx playwright install-deps
     ```

   **Catatan untuk Windows:**
   - Playwright akan otomatis download browser binaries
   - Pastikan tidak ada firewall yang memblokir

## 📁 Project Structure

```
web Scrpeling Emiten News/
├── scrape-emitennews.js              # Script dasar scraping
├── scrape-emitennews-full.js        # Scraping dengan full content
├── scrape-emitennews-interactive.js # Interactive mode
├── scrape-emitennews-live.js        # Live progress tracking
├── scrape-emitennews-custom-pages.js # Custom pages scraping
├── analyze-emiten.js                # Analisis data emiten
├── debug-emiten.js                  # Debug script untuk emiten
├── debug-artikel.js                 # Debug script untuk artikel
└── *.json                           # Output files (hasil scraping)
```

## 💻 Usage

### Basic Scraping

```bash
node scrape-emitennews.js
```

Script ini akan:
- Mengambil daftar emiten dari sumber berita
- Menyimpan hasil ke file JSON dengan timestamp
- Menampilkan progress di console

### Full Content Scraping

```bash
node scrape-emitennews-full.js
```

Mengambil artikel dengan konten lengkap (judul, isi, tanggal, URL, dll)

### Interactive Mode

```bash
node scrape-emitennews-interactive.js
```

Mode interaktif yang memungkinkan Anda memilih:
- Emiten spesifik yang ingin di-scrape
- Jumlah halaman yang akan diambil
- Filter berdasarkan tanggal atau kategori

### Live Progress Tracking

```bash
node scrape-emitennews-live.js
```

Menampilkan progress scraping secara real-time dengan progress bar

### Custom Pages

```bash
node scrape-emitennews-custom-pages.js
```

Untuk scraping halaman custom dengan konfigurasi khusus

### Analisis Data

```bash
node analyze-emiten.js
```

Menganalisis data emiten yang sudah di-scrape (frekuensi berita, sentimen, dll)

### Debug Mode

```bash
# Debug emiten page
node debug-emiten.js

# Debug artikel
node debug-artikel.js
```

Untuk troubleshooting dan melihat detail response

## 📊 Output Files

Hasil scraping disimpan dalam format JSON:

- `emitennews_articles_YYYY-MM-DD.json` - Data artikel dengan timestamp
- File output lainnya sesuai script yang digunakan

### Format JSON Output

```json
{
  "articles": [
    {
      "title": "Judul Artikel",
      "url": "https://example.com/article",
      "date": "2026-04-07",
      "content": "Konten lengkap artikel...",
      "emiten": "EMIT",
      "source": "Nama Sumber"
    }
  ],
  "metadata": {
    "totalArticles": 100,
    "scrapedAt": "2026-04-07T10:30:00Z",
    "status": "success"
  }
}
```

## ⚙️ Configuration

### Modify Scraping Parameters

Edit file script sesuai kebutuhan:

```javascript
// Contoh konfigurasi di dalam script
const CONFIG = {
  maxPages: 10,          // Jumlah halaman maksimal
  delayBetweenRequests: 1000, // Delay antar request (ms)
  outputDirectory: './', // Directory untuk output files
  dateFormat: 'YYYY-MM-DD'
};
```

### Custom User-Agent & Headers

Beberapa script sudah include user-agent rotation untuk menghindari blocking

## 🔧 Troubleshooting

### Common Issues

**Error: "Cannot find module"**
```bash
npm install
```

**Error: "Playwright browser not found"**
```bash
npx playwright install
```

**Error: "ECONNREFUSED" atau timeout**
- Periksa koneksi internet
- Coba jalankan ulang script
- Increase timeout di konfigurasi script

**Error di Linux: "Missing dependencies"**
```bash
npx playwright install-deps
```

**Permission denied (Linux/macOS)**
```bash
chmod +x scrape-emitennews.js
# atau
sudo chown -R $USER node_modules
```

**Script tidak berjalan (Windows)**
- Pastikan menjalankan dari directory yang benar
- Gunakan Git Bash, PowerShell, atau Command Prompt
```bash
node scrape-emitennews.js
```

### Performance Tips

1. **Reduce `maxPages`** jika scraping terlalu lama
2. **Increase delay** jika terkena rate limiting
3. **Run during off-peak hours** untuk koneksi lebih stabil
4. **Close other applications** untuk free up RAM

## 📝 Platform-Specific Notes

### Windows
- Gunakan **PowerShell** atau **Git Bash** untuk pengalaman terbaik
- Hindari path dengan spasi atau karakter spesial
- Jika ada error path, gunakan double quotes:
  ```bash
  node "scrape-emitennews.js"
  ```

### macOS
- Terminal default sudah cukup
- Untuk long-running scripts, pastikan Mac tidak sleep:
  ```bash
  caffeinate -i node scrape-emitennews.js
  ```

### Linux
- Gunakan `screen` atau `tmux` untuk background execution:
  ```bash
  screen -S scraping
  node scrape-emitennews.js
  # Detach dengan Ctrl+A, D
  ```
- Atau run di background:
  ```bash
  node scrape-emitennews.js &
  ```

## 📜 License

MIT

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## ⚠️ Disclaimer

- Tool ini dibuat untuk tujuan edukasi dan research
- Pastikan untuk menghormati `robots.txt` dan terms of service website target
- Gunakan dengan bijak dan jangan overload server target
- Author tidak bertanggung jawab atas penyalahgunaan tool ini
