import { config } from './config.js';

export interface InternalChannel {
  id: number;
  name: string;
  logo: string;
  category: string;
  rawUrl: string;
  proxyUrl: string;
}

export interface PublicChannel {
  id: number;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
}

interface PlaylistCache {
  channels: InternalChannel[];
  lastFetched: number;
}

let cache: PlaylistCache | null = null;

// Sanitize URL to prevent malicious schemes like javascript:
function sanitizeUrl(urlStr: string | null | undefined): string {
  if (!urlStr) return '';
  const trimmed = urlStr.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

// Strip potential dangerous HTML characters from channel names
function sanitizeText(text: string): string {
  if (!text) return '';
  return text.replace(/[<>]/g, '').trim();
}

export function parseM3U(m3uContent: string): InternalChannel[] {
  const lines = m3uContent.split(/\r?\n/);
  const channels: InternalChannel[] = [];
  let current: Partial<InternalChannel> = {};
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      current.logo = logoMatch ? sanitizeUrl(logoMatch[1]) : '';

      // Extract group-title/category if present
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      current.category = groupMatch ? sanitizeText(groupMatch[1]) : 'Live TV';

      // Extract channel name after the last comma
      const commaIndex = line.lastIndexOf(',');
      const rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Unknown Channel';
      current.name = sanitizeText(rawName);
    } else if (line.startsWith('http')) {
      const rawUrl = sanitizeUrl(line);
      if (current.name && rawUrl) {
        // Blocked channels filter
        const isBlocked = current.name.toLowerCase().includes('mazhavil manorama hd (1080p)');

        if (!isBlocked) {
          const id = counter++;
          channels.push({
            id,
            name: current.name,
            logo: current.logo || '',
            category: current.category || 'General',
            rawUrl,
            proxyUrl: `/api/stream/${id}`,
          });
        }
      }
      current = {};
    }
  }

  return channels;
}

export async function fetchChannels(forceRefresh = false): Promise<InternalChannel[]> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cache.lastFetched < config.cacheTtlMs) {
    return cache.channels;
  }

  try {
    // Fetch M3U strictly on the server; the upstream URL and credentials are NEVER exposed to client
    const response = await fetch(config.playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MalayalamTV-SecurePlayer/2.0',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream server responded with status: ${response.status}`);
    }

    const text = await response.text();
    const parsed = parseM3U(text);

    cache = {
      channels: parsed,
      lastFetched: now,
    };

    return parsed;
  } catch (error) {
    console.error('Failed to fetch/parse M3U playlist:', error);
    // If cache exists even if expired, return it as fallback
    if (cache && cache.channels.length > 0) {
      console.warn('Returning stale cached channels due to fetch error');
      return cache.channels;
    }
    throw error;
  }
}

export async function getChannelById(id: number): Promise<InternalChannel | undefined> {
  const channels = await fetchChannels();
  return channels.find(c => c.id === id);
}

export function toPublicChannels(channels: InternalChannel[], useProxy = false): PublicChannel[] {
  return channels.map(c => ({
    id: c.id,
    name: c.name,
    logo: c.logo,
    category: c.category,
    // When useProxy is enabled or by default, provide secure endpoint masking raw upstream stream
    streamUrl: useProxy ? c.proxyUrl : (c.rawUrl || c.proxyUrl),
  }));
}
