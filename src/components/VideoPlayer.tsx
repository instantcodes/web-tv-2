import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Channel, PlayerStatus } from '../types';
import { AlertTriangle, RefreshCw, Tv, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  channel: Channel | null;
  status: PlayerStatus;
  onPlaying: () => void;
  onPause: () => void;
  onError: (channelName: string) => void;
  onTuning: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  status,
  onPlaying,
  onPause,
  onError,
  onTuning,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isMutedAutoplay, setIsMutedAutoplay] = useState(false);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Automatically unmute upon any first user interaction (click, key, touch)
  useEffect(() => {
    if (!isMutedAutoplay) return;

    const unmuteHandler = () => {
      if (playerRef.current) {
        playerRef.current.muted = false;
      }
      setIsMutedAutoplay(false);
    };

    window.addEventListener('click', unmuteHandler, { once: true });
    window.addEventListener('keydown', unmuteHandler, { once: true });
    window.addEventListener('touchstart', unmuteHandler, { once: true });

    return () => {
      window.removeEventListener('click', unmuteHandler);
      window.removeEventListener('keydown', unmuteHandler);
      window.removeEventListener('touchstart', unmuteHandler);
    };
  }, [isMutedAutoplay]);

  useEffect(() => {
    if (!channel || !channel.streamUrl || !containerRef.current) {
      return;
    }

    onTuning();
    setIsMutedAutoplay(false);

    // 1. Cleanup previous player and HLS instances cleanly
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying Plyr instance:', e);
      }
      playerRef.current = null;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying HLS instance:', e);
      }
      hlsRef.current = null;
    }

    // 2. Re-create video element inside container for a clean state
    containerRef.current.innerHTML = '';
    const videoElement = document.createElement('video');
    videoElement.id = 'video-player';
    videoElement.className = 'w-full h-full';
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.controls = true;
    containerRef.current.appendChild(videoElement);

    const streamUrl = channel.streamUrl;
    let isCancelled = false;

    // Helper to start playback with reliable autoplay fallback
    const triggerAutoplay = (plyrInstance: Plyr, videoEl: HTMLVideoElement) => {
      const playPromise = plyrInstance.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser blocks unmuted autoplay, immediately mute and play
          console.log('Unmuted autoplay blocked by browser policy. Falling back to muted autoplay...');
          plyrInstance.muted = true;
          videoEl.muted = true;
          setIsMutedAutoplay(true);
          const retryPromise = plyrInstance.play();
          if (retryPromise !== undefined) {
            retryPromise.catch(err => {
              console.warn('Muted autoplay also blocked:', err);
            });
          }
        });
      }
    };

    // 3. Initialize HLS or Safari Native HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxLiveSyncPlaybackRate: 1.5,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isCancelled) return;

        const availableQualities = hls.levels.map(l => l.height).filter(Boolean);
        availableQualities.unshift(-1); // Auto option

        const player = new Plyr(videoElement, {
          controls: [
            'play-large',
            'play',
            'mute',
            'volume',
            'settings',
            'pip',
            'airplay',
            'fullscreen',
          ],
          settings: ['quality'],
          quality: {
            default: -1,
            options: availableQualities,
            forced: true,
            onChange: (newQuality: number) => {
              if (hlsRef.current) {
                hlsRef.current.currentLevel =
                  newQuality === -1
                    ? -1
                    : hlsRef.current.levels.findIndex(l => l.height === newQuality);
              }
            },
          },
          i18n: {
            qualityLabel: {
              0: 'Auto',
              '-1': 'Auto',
            },
          },
        });
        playerRef.current = player;

        player.on('playing', () => {
          if (!isCancelled) onPlaying();
        });

        player.on('pause', () => {
          if (!isCancelled) onPause();
        });

        // Trigger autoplay immediately upon manifest parsed
        triggerAutoplay(player, videoElement);
      });

      // Handle stream errors
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (isCancelled) return;
        if (data.fatal) {
          console.warn(`HLS Fatal error [${data.type}]:`, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error. Stream might be offline, geo-blocked, or dead.');
              onError(channel.name);
              hls.destroy();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error encountered, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              onError(channel.name);
              hls.destroy();
              break;
          }
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari (iOS / macOS)
      videoElement.src = streamUrl;

      const player = new Plyr(videoElement, {
        controls: [
          'play-large',
          'play',
          'mute',
          'volume',
          'pip',
          'airplay',
          'fullscreen',
        ],
      });
      playerRef.current = player;

      player.on('playing', () => {
        if (!isCancelled) onPlaying();
      });

      player.on('pause', () => {
        if (!isCancelled) onPause();
      });

      videoElement.addEventListener('error', () => {
        if (!isCancelled) onError(channel.name);
      });

      triggerAutoplay(player, videoElement);
    } else {
      console.error('HLS playback is not supported on this device/browser.');
      onError(channel.name);
    }

    return () => {
      isCancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
        hlsRef.current = null;
      }
    };
  }, [channel?.id, channel?.streamUrl, retryCount]);

  return (
    <div className="relative w-full h-full flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Container holding the video and Plyr */}
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black" />

      {/* Floating Unmute Button if muted by browser autoplay policy */}
      {isMutedAutoplay && status === 'playing' && (
        <button
          onClick={() => {
            if (playerRef.current) {
              playerRef.current.muted = false;
            }
            setIsMutedAutoplay(false);
          }}
          className="absolute bottom-16 right-6 z-40 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer transition-all border border-white/20 animate-pulse"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span>Tap to Unmute Audio</span>
        </button>
      )}

      {/* No Channel Selected State */}
      {!channel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-gray-400 p-6 z-20">
          <Tv className="w-16 h-16 text-gray-600 mb-4 stroke-1 animate-pulse" />
          <h3 className="text-xl font-semibold text-gray-300">Select a Channel</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm text-center">
            Choose any live Malayalam channel from the channel list to start streaming.
          </p>
        </div>
      )}

      {/* Tuning / Loading State Overlay */}
      {status === 'tuning' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none transition-opacity duration-300">
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
              <Tv className="w-6 h-6 text-red-500 absolute" />
            </div>
            <span className="text-gray-100 font-medium tracking-wide text-lg sm:text-xl">
              Tuning to {channel?.name || 'Channel'}...
            </span>
          </div>
        </div>
      )}

      {/* Error / Offline Stream State Overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
            <p className="text-sm text-gray-300 mb-6">
              The live broadcast for <strong className="text-red-400">{channel?.name}</strong> is currently unreachable or experiencing upstream outages.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="tv-focusable px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
