# GPI Cipayung - web server + bot WhatsApp (whatsapp-web.js / Puppeteer)
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Asia/Jakarta \
    PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer

# Library yang dibutuhkan Chrome headless (Puppeteer) di Debian bookworm.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates fontconfig fonts-liberation tzdata \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
      libdrm2 libexpat1 libgbm1 libglib2.0-0 libnspr4 libnss3 libpango-1.0-0 \
      libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
      libxkbcommon0 libxrandr2 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin manifes lebih dulu agar layer dependensi dipakai ulang selama kode berubah.
COPY package.json package-lock.json ./
COPY app/package.json app/package-lock.json ./app/

RUN mkdir -p /data/wa-session \
 && chown -R node:node /app /data

# Jalankan instalasi sebagai node supaya cache Chrome masuk ke HOME milik node.
USER node
RUN npm ci --omit=dev \
 && npm ci --omit=dev --prefix app

COPY --chown=node:node . .

RUN mkdir -p uploads/media/warta uploads/media/website uploads/media/service-docs uploads/media/team uploads/media/pendalaman

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
