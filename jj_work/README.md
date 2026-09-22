# JJ SERVICE — Simple + Logo + Cloudflare Otomatis

Versi ini memakai Node.js + Express + SQLite. Logo JJ SERVICE sudah dipasang pada tampilan aplikasi.

## Cara paling mudah di Windows

Klik dua kali `MULAI_JJ_SERVICE.bat`.

File tersebut akan:
1. Memastikan dependency Node.js tersedia.
2. Menjalankan `npm install` bila diperlukan.
3. Mengunduh `cloudflared.exe` resmi Cloudflare bila belum ada di folder.
4. Menjalankan server JJ SERVICE di port 3000.
5. Menunggu server siap.
6. Membuka Cloudflare Quick Tunnel.
7. Menampilkan URL HTTPS yang bisa dibuka pelanggan dari HP.

Contoh URL pelanggan:
`https://xxxxx.trycloudflare.com`

### Penting
Quick Tunnel cocok untuk testing/demo. URL acak dapat berubah ketika tunnel berhenti dan dijalankan kembali. PC harus tetap hidup dan online. Untuk alamat tetap, gunakan Named Cloudflare Tunnel dengan domain.

Cloudflare menyatakan `cloudflared` di Windows tidak otomatis update, jadi pembaruan perlu dilakukan manual.

## Lokal
`http://localhost:3000`

## Admin
`/admin.html`

Default username: `admin`
Default password: `jjservice`

Ubah kredensial sebelum penggunaan nyata.
