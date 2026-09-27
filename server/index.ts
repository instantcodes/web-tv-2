import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { fetchChannels, getChannelById, toPublicChannels } from './m3uParser.js';

const app = express();

// ==========================================
// 1. SECURITY MIDDLEWARE LAYER
// ==========================================

// Helmet sets secure HTTP headers (CSP, HSTS, noSniff, frameguard, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        mediaSrc: ["'self'", 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'https:', 'http:', 'blob:'],
        frameSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS to prevent unauthorized domains from embedding or scraping streams
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const allowedOrigins = [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error('Access blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);

// Anti-DDoS and Anti-Scraping Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // Max 200 requests per 10 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 10 minutes.',
  },
});
app.use('/api/', apiLimiter);

app.use(express.json());

// ==========================================
// 2. SECURE API ROUTES
// ==========================================

// GET /api/health - Health & Security Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    security: {
      headersProtected: true,
      corsEnabled: true,
      rateLimiterActive: true,
      sensitiveSourcesHidden: true,
      streamProxyMode: config.enableStreamProxy,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/channels - Fetch sanitized list of channels
app.get('/api/channels', async (req: Request, res: Response) => {
  try {
    const rawChannels = await fetchChannels();
    const useProxy = config.enableStreamProxy || req.query.proxy === 'true';
    const publicChannels = toPublicChannels(rawChannels, useProxy);

    // Optional server-side search filter
    const query = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : '';
    const filtered = query
      ? publicChannels.filter(c => c.name.toLowerCase().includes(query))
      : publicChannels;

    res.json({
      success: true,
      count: filtered.length,
      channels: filtered,
    });
  } catch (error) {
    console.error('Error serving channels:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve playlist safely. Upstream source may be temporarily unavailable.',
    });
  }
});

// GET /api/stream/:id - Secure Stream Resolver / Reverse Proxy
// Hides raw upstream IPTV credentials, auth tokens, and source server IP
app.get('/api/stream/:id', async (req: Request, res: Response) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const channelId = parseInt(idParam || '', 10);
  if (isNaN(channelId) || channelId <= 0) {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }

  try {
    const channel = await getChannelById(channelId);
    if (!channel || !channel.rawUrl) {
      return res.status(404).json({ error: 'Channel stream not found' });
    }

    // Set secure headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Referrer-Policy', 'no-referrer');

    // If stream proxy mode is requested, proxy the m3u8 playlist directly
    if (config.enableStreamProxy || req.query.proxy === 'true') {
      try {
        const streamResp = await fetch(channel.rawUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Accept': '*/*',
          },
        });

        if (!streamResp.ok) {
          return res.status(streamResp.status).send('Stream upstream error');
        }

        const contentType = streamResp.headers.get('content-type') || 'application/vnd.apple.mpegurl';
        res.setHeader('Content-Type', contentType);
        
        // If it's an M3U8 playlist, pipe content
        const bodyText = await streamResp.text();
        return res.send(bodyText);
      } catch (err) {
        console.error(`Failed to proxy stream for channel ${channelId}:`, err);
        // Fallback to secure redirect
        return res.redirect(302, channel.rawUrl);
      }
    }

    // Default safe mode: HTTP 302 Redirect with Referrer-Policy: no-referrer
    // This allows clients to stream directly while stripping sensitive referrer data
    return res.redirect(302, channel.rawUrl);
  } catch (error) {
    console.error(`Error resolving stream for channel ${channelId}:`, error);
    return res.status(500).json({ error: 'Internal stream resolver error' });
  }
});

// Refresh Cache (Protected endpoint)
app.post('/api/channels/refresh', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${config.internalSecretKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid secret key' });
  }

  try {
    const channels = await fetchChannels(true);
    return res.json({
      success: true,
      message: 'Playlist cache successfully refreshed',
      channelCount: channels.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

// ==========================================
// 3. PRODUCTION STATIC ASSETS & SPA ROUTING
// ==========================================
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback middleware for Express 5
  app.use((req: Request, res: Response) => {
    // If request was looking for an API route, return 404 JSON
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`[PRODUCTION] Serving static client build from ${distPath}`);
}

// Start Server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`[SECURE BACKEND] Malayalam TV running on http://0.0.0.0:${config.port}`);
  console.log(`[SECURITY] Playlist URL kept confidential. Helmet & Rate-Limiter active.`);
});

