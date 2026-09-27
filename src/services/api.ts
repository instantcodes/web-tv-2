import { Channel, ChannelsResponse, HealthResponse } from '../types';

export async function fetchChannelsList(searchTerm = ''): Promise<Channel[]> {
  const url = searchTerm 
    ? `/api/channels?search=${encodeURIComponent(searchTerm)}`
    : '/api/channels';

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load channels: HTTP ${res.status}`);
  }

  const data: ChannelsResponse = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to parse channel playlist');
  }

  return data.channels;
}

export async function fetchSecurityHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Failed to fetch health: HTTP ${res.status}`);
  }
  return res.json();
}
