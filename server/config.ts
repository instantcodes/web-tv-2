import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  // Sensitive playlist URL hidden strictly on the server
  playlistUrl: process.env.PLAYLIST_URL || ' >>> SECRET_URL <<< ',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cacheTtlMs: (parseInt(process.env.PLAYLIST_CACHE_TTL || '3600', 10)) * 1000,
  enableStreamProxy: process.env.ENABLE_STREAM_PROXY === 'true',
  internalSecretKey: process.env.INTERNAL_SECRET_KEY || 'default_secure_key_123',
};
