import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Channel, PlayerStatus } from './types';
import { fetchChannelsList } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { VideoPlayer } from './components/VideoPlayer';
import { TVRemoteHelpModal } from './components/TVRemoteHelpModal';
import { useTopBarVisibility } from './hooks/useTopBarVisibility';
import { useTVNavigation } from './hooks/useTVNavigation';

export const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Initial sidebar open based on screen size (closed on mobile, open on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const { isVisible: isTopBarVisible, showTopBar } = useTopBarVisibility(playerStatus);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // TV D-Pad & Keyboard navigation hook
  useTVNavigation({
    isSidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    showTopBar,
  });

  // Filter channels based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const term = searchQuery.toLowerCase();
    return channels.filter(
      c => c.name.toLowerCase().includes(term) || c.category.toLowerCase().includes(term)
    );
  }, [channels, searchQuery]);

  // Load channels on mount and guarantee autoplay of 24 News
  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setIsLoadingChannels(true);
      try {
        const list = await fetchChannelsList();
        if (!isSubscribed) return;

        setChannels(list);
        setIsLoadingChannels(false);

        // Auto-play default channel "24 News", or fallback to the first channel (ID 1)
        if (list.length > 0) {
          const target = list.find(c => c.name.toLowerCase().includes('24 news')) || list[0];
          setActiveChannel(target);
          setPlayerStatus('tuning');
        }
      } catch (err) {
        console.error('Failed to load IPTV playlist:', err);
        if (isSubscribed) {
          setIsLoadingChannels(false);
        }
      }
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle Channel Selection
  const handleSelectChannel = (channel: Channel) => {
    setActiveChannel(channel);
    setPlayerStatus('tuning');

    // Auto-close sidebar on mobile or TV screens
    if (window.innerWidth < 768 || window.navigator.userAgent.toLowerCase().includes('tv')) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="text-slate-200 h-[100dvh] max-h-[100dvh] w-screen flex font-sans select-none overflow-hidden bg-black">
      {/* Sidebar: Drawer on Mobile, Collapsible on Desktop */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        channels={filteredChannels}
        activeChannel={activeChannel}
        onSelectChannel={handleSelectChannel}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoadingChannels}
      />

      {/* Main Content Area */}
      <main
        id="main-area"
        className="flex-1 bg-black relative flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden w-full shrink min-h-0"
      >
        {/* Mobile Backdrop Overlay for Sidebar */}
        {isSidebarOpen && (
          <div
            id="mobile-overlay"
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/70 z-40 md:hidden transition-opacity backdrop-blur-xs"
            aria-hidden="true"
          />
        )}

        {/* Top Bar with Now Playing & Status Indicators */}
        <TopBar
          isVisible={isTopBarVisible}
          channel={activeChannel}
          status={playerStatus}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* Video Player */}
        <VideoPlayer
          channel={activeChannel}
          status={playerStatus}
          onPlaying={() => setPlayerStatus('playing')}
          onPause={() => {
            showTopBar();
          }}
          onError={channelName => {
            console.warn(`Playback error for ${channelName}`);
            setPlayerStatus('error');
          }}
          onTuning={() => setPlayerStatus('tuning')}
        />
      </main>

      {/* Remote & Keyboard Help Modal */}
      <TVRemoteHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
