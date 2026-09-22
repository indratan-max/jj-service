@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title JJ SERVICE - Server + Cloudflare

color 0A
echo ================================================
echo           JJ SERVICE - MULAI OTOMATIS
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js belum terpasang.
  echo Install Node.js LTS/24 terlebih dahulu, lalu jalankan file ini lagi.
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo [1/4] Memasang dependency JJ SERVICE...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install gagal.
    pause
    exit /b 1
  )
) else (
  echo [1/4] Dependency sudah siap.
)

if not exist "cloudflared.exe" (
  echo [2/4] cloudflared belum ada. Mengunduh versi resmi Cloudflare...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'; Invoke-WebRequest -Uri $u -OutFile 'cloudflared.exe'"
  if errorlevel 1 (
    echo [ERROR] Gagal mengunduh cloudflared.
    echo Periksa koneksi internet, lalu jalankan lagi.
    pause
    exit /b 1
  )
) else (
  echo [2/4] cloudflared sudah ada.
)

"cloudflared.exe" --version

echo.
echo [3/4] Menjalankan server JJ SERVICE...
start "JJ SERVICE Server" /min cmd /c "cd /d "%~dp0" && npm start"

echo Menunggu server siap...
set READY=0
for /l %%i in (1,1,30) do (
  powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000' -TimeoutSec 1; if($r.StatusCode -ge 200){exit 0}else{exit 1} } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set READY=1
    goto :server_ready
  )
  timeout /t 1 /nobreak >nul
)

:server_ready
if "%READY%"=="0" (
  echo [ERROR] Server belum merespons di http://localhost:3000
  echo Cek jendela "JJ SERVICE Server".
  pause
  exit /b 1
)

echo Server siap.
echo.
echo [4/4] Membuka akses pelanggan melalui Cloudflare...
echo.
echo ================================================================
echo URL PELANGGAN AKAN MUNCUL DI BAWAH INI:
echo ================================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:3000

echo.
echo Cloudflare berhenti. Server JJ SERVICE masih dapat berjalan di PC.
pause
