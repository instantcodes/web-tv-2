import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Request, Response } from 'express';
import { app } from './app.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// If static dist exists (production build on Node/Docker/Render), serve it
if (fs.existsSync(distPath)) {
  app.use(app.get('express')?.static ? app.get('express').static(distPath) : (await import('express')).default.static(distPath));
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

// Start Server when not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[SECURE BACKEND] Malayalam TV running on http://0.0.0.0:${config.port}`);
    console.log(`[SECURITY] Playlist URL kept confidential. Helmet & Rate-Limiter active.`);
  });
}

export default app;
