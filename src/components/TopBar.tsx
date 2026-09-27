import React from 'react';
import { Channel, PlayerStatus } from '../types';
import { Menu, Tv, HelpCircle } from 'lucide-react';

interface TopBarProps {
  isVisible: boolean;
  channel: Channel | null;
  status: PlayerStatus;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenHelp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isVisible,
  channel,
  status,
  isSidebarOpen,
  onToggleSidebar,
  onOpenHelp,
}) => {
  return (
    <header
      id="top-bar"
      className={`absolute top-0 left-0 w-full bg-gradient-to-b from-black/95 via-black/75 to-transparent p-3 sm:p-5 flex items-center justify-between z-[60] transition-all duration-300 pointer-events-auto ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      {/* Left: Sidebar Toggle & App Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          id="toggle-sidebar"
          onClick={onToggleSidebar}
          className="tv-focusable p-2.5 sm:p-3 bg-black/60 hover:bg-white/20 active:bg-white/30 rounded-xl text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg cursor-pointer"
          title={isSidebarOpen ? 'Close Channel List' : 'Open Channel List'}
          tabIndex={0}
          aria-label="Toggle Channel Navigation"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Tv className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              Malayalam <span className="text-red-500">TV</span>
            </h1>
            <span className="hidden sm:block text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              Live IPTV Streaming
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live / Now Playing Status Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3 bg-black/60 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-md border border-white/10 max-w-[50%] sm:max-w-[45%] shadow-lg">
        <span className="relative flex h-3 w-3 shrink-0">
          {status === 'playing' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </>
          )}
          {status === 'tuning' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
            </>
          )}
          {status === 'error' && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 ring-2 ring-red-400/50" />
          )}
          {status === 'idle' && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500" />
          )}
        </span>

        <span className="text-xs sm:text-sm font-semibold text-white truncate">
          {status === 'idle' && 'Select a channel'}
          {status === 'tuning' && (channel ? `Tuning ${channel.name}...` : 'Connecting...')}
          {status === 'playing' && (channel?.name || 'Live Broadcast')}
          {status === 'error' && (channel ? `${channel.name} (Offline)` : 'Stream Error')}
        </span>
      </div>

      {/* Right: Remote Navigation Guide */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenHelp}
          className="tv-focusable p-2 sm:p-2.5 bg-black/60 hover:bg-white/20 rounded-xl text-gray-300 hover:text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg cursor-pointer flex items-center gap-1.5"
          title="TV Remote & Keyboard Shortcuts"
          tabIndex={0}
          aria-label="Remote Control Help"
        >
          <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden lg:inline text-xs text-gray-300">Remote Guide</span>
        </button>
      </div>
    </header>
  );
};
