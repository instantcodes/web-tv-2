# Malayalam TV - Multi-Platform Streaming Web App (React + Secure Backend)

A modern, high-performance **IPTV Live Streaming Web App** converted to **React 19 + TypeScript + Tailwind CSS** with Android TV / Smart TV remote D-Pad navigation, responsive drawer, Plyr + HLS.js video player, and an enterprise-grade **Security Proxy Architecture** to completely hide and protect sensitive IPTV feeds, provider tokens, and upstream sources.

---

## 🔒 Security Architecture: How Sensitive Data is Protected

In typical IPTV web clients, stream URLs and playlist endpoints are hardcoded in the frontend JavaScript, exposing private credentials, upstream IPs, and sensitive feeds to network sniffers and scrapers. 

This project isolates all sensitive data behind a secure backend:

1. **Confidential Playlist Source (`.env`)**:
   - The upstream M3U playlist URL (`PLAYLIST_URL`) and any authorization credentials live exclusively on the backend server.
   - The browser client only talks to the sanitized `/api/channels` endpoint.
2. **Stream URL Masking / Reverse Proxy (`/api/stream/:id`)**:
   - Raw stream links are hidden behind `/api/stream/:channelId` with `Referrer-Policy: no-referrer`, preventing leaking the origin or tokens.
   - Setting `ENABLE_STREAM_PROXY=true` pipes the stream directly through the server, completely concealing the upstream IPTV server IP from the client.
3. **Anti-Scraping Rate Limiting**:
   - `express-rate-limit` prevents bots from scraping or brute-forcing stream endpoints (max 200 requests / 10 minutes per IP).
4. **Helmet HTTP Security Headers**:
   - Content-Security-Policy (CSP), `X-Frame-Options: SAMEORIGIN` (anti-clickjacking), and `X-Content-Type-Options: nosniff`.
5. **CORS Isolation**:
   - Restricts API access exclusively to your frontend domain.
6. **XSS Protection**:
   - Channel names and logo URLs are sanitized against injection exploits (disallowing `javascript:` or malicious payloads).

---

## 🚀 Features

- **📺 Full TV Remote & Keyboard D-Pad Navigation**:
  - `↑` / `↓`: Seamlessly scroll and focus channels.
  - `Enter` / `OK`: Select and tune channel.
  - `←` Left Arrow: Open channel drawer.
  - `→` Right Arrow: Close channel drawer.
  - `F`: Toggle Fullscreen.
  - `M`: Mute / Unmute.
- **⚡ Dual Playback Engine**:
  - HLS.js with adaptive quality selection (Auto, 1080p, 720p, etc.).
  - Native Safari / iOS HLS fallback (`application/vnd.apple.mpegurl`).
  - Automatic error recovery for media disruptions.
- **📱 Multi-Platform UI**:
  - Responsive slide-out drawer on Mobile & Tablet.
  - Collapsible sidebar on Desktop.
  - Auto-hiding top bar during active video playback.
  - Live broadcast status pill (pulsing live indicator).
- **🔎 Instant Search**: Real-time channel search with instant clearing.
- **🎯 Auto-Play Tuning**: Automatically tunes "24 News" (or first available channel) upon launch.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ (tested on Node 22 / 24)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your playlist URL:
```env
PORT=3001
PLAYLIST_URL=https://iptv-org.github.io/iptv/languages/mal.m3u
CORS_ORIGIN=http://localhost:5173
ENABLE_STREAM_PROXY=false
INTERNAL_SECRET_KEY=your_secret_key_here
```

### 3. Start Development Server
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 🌐 How to Deploy to the Web

The project is built as a **unified fullstack app** — the Express server serves both the secure API and the compiled React frontend from `dist/` on a single port!

### Option 1: Render (Easiest Free Hosting - 1-Click)
1. Push this project to GitHub.
2. Sign up at [Render.com](https://render.com).
3. Click **New +** -> **Web Service** -> Connect your GitHub repository.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `PLAYLIST_URL`: `https://iptv-org.github.io/iptv/languages/mal.m3u` (or your private M3U URL)
   - `NODE_ENV`: `production`
   - `INTERNAL_SECRET_KEY`: `generate_a_random_password`
6. Click **Deploy Web Service**. You will receive a live URL (`https://your-app.onrender.com`).

---

### Option 2: Railway
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects Node.js.
4. In Railway **Variables**, add:
   - `PLAYLIST_URL`: `https://iptv-org.github.io/iptv/languages/mal.m3u`
   - `NODE_ENV`: `production`
5. Railway will automatically build and deploy.

---

### Option 3: Docker / VPS (DigitalOcean / AWS / Hetzner)
Build and run using Docker:
```bash
# Build the production container
docker build -t malayalam-tv .

# Run container on port 3001
docker run -d -p 3001:3001 --name malayalam-tv-live \
  -e PLAYLIST_URL="https://iptv-org.github.io/iptv/languages/mal.m3u" \
  malayalam-tv
```

Or with Docker Compose:
```bash
docker compose up -d
```
Access at `http://your-server-ip:3001`.

---

## 📁 Project Structure

```
malayalam-tv-react/
├── .env.example           # Safe environment template
├── .gitignore             # Prevents leaking credentials
├── Dockerfile             # Multi-stage production container
├── docker-compose.yml     # Compose orchestrator
├── render.yaml            # Render deployment blueprint
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite bundler & reverse proxy config
├── tsconfig.json          # TypeScript configuration
├── server/                # Secure Backend Proxy Layer
│   ├── config.ts          # Environment configuration loader
│   ├── index.ts           # Express server, Helmet, Rate limiter, Static SPA server
│   └── m3uParser.ts       # M3U parser, cache, & channel sanitizer
└── src/                   # React Frontend
    ├── components/
    │   ├── Sidebar.tsx            # Channel list & search drawer
    │   ├── TopBar.tsx             # Header, now playing status, branding
    │   ├── VideoPlayer.tsx        # Plyr + HLS.js streaming engine
    │   ├── TVRemoteHelpModal.tsx  # Remote control shortcuts guide
    │   └── SecurityModal.tsx      # Live security status modal
    ├── hooks/
    │   ├── useTVNavigation.ts     # D-Pad / Arrow keys navigation
    │   └── useTopBarVisibility.ts # Auto-hide header timer
    ├── services/
    │   └── api.ts                 # Secure API client
    ├── types/
    │   └── index.ts               # TypeScript interfaces
    ├── App.tsx                    # Main App orchestrator
    ├── main.tsx                   # React root entry
    └── index.css                  # Tailwind CSS 4 & Plyr styling
```
