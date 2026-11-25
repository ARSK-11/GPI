#!/usr/bin/env bash
# Build dan jalankan seluruh layanan (database + web + bot WhatsApp).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker belum terpasang. Pasang Docker Engine/Desktop lalu jalankan ulang." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Plugin 'docker compose' tidak tersedia. Perbarui Docker." >&2
  exit 1
fi

if [ ! -f .env.docker ]; then
  rand() { node -e "console.log(require('node:crypto').randomBytes(${1:-32}).toString('hex'))"; }
  pass=$(node -e "console.log(require('node:crypto').randomBytes(18).toString('base64url'))")
  secret=$(rand 32)
  sed -e "s|^MARIADB_ROOT_PASSWORD=.*|MARIADB_ROOT_PASSWORD=${pass}|" \
      -e "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=${pass}|" \
      -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${pass}|" \
      -e "s|^SESSION_SECRET=.*|SESSION_SECRET=${secret}|" \
      .env.docker.example > .env.docker
  chmod 600 .env.docker
  echo "Dibuat .env.docker dengan password database dan SESSION_SECRET acak."
fi

docker compose up -d --build --wait --wait-timeout 240
docker compose ps
echo
echo "Aplikasi berjalan di http://localhost:${APP_PORT:-3000}/login"
echo "Login awal memakai akun dari skema database; ganti password dengan:"
echo "  docker compose exec app npm run reset-password -- admin"
