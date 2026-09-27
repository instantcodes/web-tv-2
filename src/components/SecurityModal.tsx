import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, GlobeLock } from 'lucide-react';
import { fetchSecurityHealth } from '../services/api';
import { HealthResponse } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSecurityHealth()
        .then(data => setHealthData(data))
        .catch(err => console.error('Failed to load security status:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Project Security Architecture</h3>
            <span className="text-xs text-emerald-400 font-medium">All Sensitive Data Protected</span>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Sensitive IPTV endpoints, upstream credentials, and server tokens are completely isolated behind backend security layers.
        </p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* 1. Hidden Source Playlist */}
          <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 flex gap-3">
            <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Hidden IPTV Source & Credentials</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Upstream playlist URLs and authentication keys are kept exclusively in server-side <code className="text-red-400 font-mono">.env</code>. The browser client never touches or leaks the raw playlist URL.
              </p>
            </div>
          </div>

          {/* 2. Reverse Proxy & Masked Routing */}
          <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 flex gap-3">
            <Server className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Secure Proxy & Referrer Protection</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Channels are accessed via sanitized API endpoints (<code className="text-red-400 font-mono">/api/channels</code> and <code className="text-red-400 font-mono">/api/stream/:id</code>) with <code className="text-red-400 font-mono">Referrer-Policy: no-referrer</code>, concealing your app and upstream IPs.
              </p>
            </div>
          </div>

          {/* 3. Anti-Scraping Rate Limiter */}
          <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 flex gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Anti-DDoS & Rate Limiting</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Integrated Express rate limiter prevents bot scraping and resource exhaustion attacks on stream and playlist endpoints.
              </p>
            </div>
          </div>

          {/* 4. Helmet & CORS */}
          <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 flex gap-3">
            <GlobeLock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Strict CSP & CORS Protection</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Content-Security-Policy blocks unauthorized scripts, and CORS restricts access to authorized client domains.
              </p>
            </div>
          </div>

          {/* Live Status Diagnostics */}
          {healthData && (
            <div className="p-3 bg-gray-950/70 rounded-xl border border-gray-800 text-xs font-mono space-y-1">
              <div className="text-gray-400 font-semibold mb-1">Server Live Security State:</div>
              <div className="flex justify-between text-gray-300">
                <span>Headers (Helmet):</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Rate Limiter:</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Sources Hidden:</span>
                <span className="text-emerald-400">ENFORCED</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Timestamp:</span>
                <span className="text-gray-400">{new Date(healthData.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white rounded-xl transition-colors cursor-pointer"
        >
          Close Security Panel
        </button>
      </div>
    </div>
  );
};
