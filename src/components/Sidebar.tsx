import React, { useRef, useEffect, useState } from 'react';
import { Channel } from '../types';
import { Search, X, Tv, Radio } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  channels: Channel[];
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  channels,
  activeChannel,
  onSelectChannel,
  searchQuery,
  onSearchChange,
  isLoading,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Auto-scroll to active channel when selected
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeChannel?.id]);

  const handleImageError = (channelId: number) => {
    setImageErrors(prev => ({ ...prev, [channelId]: true }));
  };

  return (
    <aside
      id="sidebar"
      className={`fixed md:relative z-50 h-full w-[20rem] bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 shadow-2xl md:shadow-none transition-all duration-300 ease-in-out ${
        isOpen
          ? 'translate-x-0 md:ml-0'
          : '-translate-x-full md:-ml-[20rem]'
      }`}
      aria-label="Channels Navigation"
    >
      {/* Search Header */}
      <div className="p-4 bg-gray-900/95 border-b border-gray-800 shadow-sm shrink-0 h-[76px] flex items-center justify-between gap-2">
        <div className="relative w-full">
          <input
            ref={searchInputRef}
            type="text"
            id="search-input"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search channels..."
            className="tv-focusable w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-lg py-2.5 pl-10 pr-9 focus:outline-none focus:border-red-500 transition-colors text-base"
            tabIndex={0}
            autoComplete="off"
            spellCheck="false"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-gray-700 transition-colors"
              title="Clear search"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Channel Stats Bar */}
      <div className="px-4 py-2 bg-gray-950/60 border-b border-gray-800/60 flex items-center justify-between text-xs text-gray-400 shrink-0">
        <div className="flex items-center gap-1.5 font-medium">
          <Radio className="w-3.5 h-3.5 text-red-500" />
          <span>{channels.length} {channels.length === 1 ? 'Channel' : 'Channels'} Available</span>
        </div>
      </div>

      {/* Channel List */}
      <div
        id="channel-list"
        className="flex-1 overflow-y-auto p-2 space-y-1 pb-24 md:pb-3"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-base">
            <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin mb-3" />
            <div className="animate-pulse">Loading playlist safely...</div>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <Tv className="w-10 h-10 text-gray-600 mb-2" />
            <span className="text-gray-400 font-medium">No channels found</span>
            <span className="text-xs text-gray-500 mt-1">Try adjusting your search query</span>
          </div>
        ) : (
          channels.map((channel) => {
            const isSelected = activeChannel?.id === channel.id;
            const hasLogo = Boolean(channel.logo) && !imageErrors[channel.id];

            return (
              <button
                key={channel.id}
                ref={isSelected ? activeBtnRef : null}
                onClick={() => onSelectChannel(channel)}
                data-id={channel.id}
                tabIndex={0}
                className={`tv-focusable channel-btn w-full flex items-center gap-3 p-2.5 text-left rounded-xl transition-all duration-150 focus:outline-none group border cursor-pointer ${
                  isSelected
                    ? 'bg-red-600/20 border-red-500/60 shadow-md shadow-red-950/40'
                    : 'bg-transparent border-transparent hover:bg-gray-800/80 text-gray-300'
                }`}
              >
                {/* Sequential Channel Number */}
                <span className={`text-xs font-mono w-6 shrink-0 text-right select-none ${
                  isSelected ? 'text-red-400 font-bold' : 'text-gray-500 group-hover:text-gray-400'
                }`}>
                  {channel.id}
                </span>

                {/* Channel Logo / Fallback Badge */}
                <div className="w-11 h-11 shrink-0 rounded-lg bg-gray-800/90 border border-white/5 flex items-center justify-center overflow-hidden p-1 shadow-inner">
                  {hasLogo ? (
                    <img
                      src={channel.logo}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-contain filter drop-shadow-sm"
                      onError={() => handleImageError(channel.id)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Tv className="w-4 h-4 text-gray-500 mb-0.5" />
                      <span className="text-[9px] font-bold tracking-tight text-gray-400 uppercase">TV</span>
                    </div>
                  )}
                </div>

                {/* Channel Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4
                    className={`font-medium truncate text-base transition-colors ${
                      isSelected
                        ? 'text-white font-semibold'
                        : 'text-gray-200 group-hover:text-white'
                    }`}
                  >
                    {channel.name}
                  </h4>
                  <span className="text-xs text-gray-500 truncate block">
                    {channel.category || 'Malayalam'}
                  </span>
                </div>

                {/* Active Indicator Pip */}
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 mr-1" />
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
