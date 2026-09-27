export interface Channel {
  id: number;
  name: string;
  logo: string;
  category: string;
  streamUrl: string;
}

export type PlayerStatus = 'idle' | 'tuning' | 'playing' | 'error';

export interface ChannelsResponse {
  success: boolean;
  count: number;
  channels: Channel[];
  error?: string;
}

export interface SecurityStatus {
  headersProtected: boolean;
  corsEnabled: boolean;
  rateLimiterActive: boolean;
  sensitiveSourcesHidden: boolean;
  streamProxyMode: boolean;
}

export interface HealthResponse {
  status: string;
  security: SecurityStatus;
  timestamp: string;
}
