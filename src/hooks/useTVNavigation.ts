import { useEffect } from 'react';

interface TVNavigationProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  showTopBar: () => void;
}

export function useTVNavigation({
  isSidebarOpen,
  openSidebar,
  closeSidebar,
  showTopBar,
}: TVNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input unless it's Up/Down/Escape
      const active = document.activeElement as HTMLElement | null;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

      showTopBar();

      if (e.key === 'Escape') {
        if (isSidebarOpen) {
          closeSidebar();
          const toggleBtn = document.getElementById('toggle-sidebar');
          toggleBtn?.focus();
        }
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If in search input and pressing left/right, let normal cursor navigation work
        if (isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          return;
        }

        e.preventDefault();

        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>('.tv-focusable:not([disabled])')
        ).filter(el => {
          // Only include visible elements
          return el.offsetParent !== null;
        });

        const currentIndex = active ? focusables.indexOf(active) : -1;

        if (currentIndex === -1) {
          if (isSidebarOpen) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
            else if (focusables.length > 0) focusables[0].focus();
          } else {
            const toggleBtn = document.getElementById('toggle-sidebar');
            toggleBtn?.focus();
          }
          return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const nextIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < focusables.length) {
            const nextEl = focusables[nextIndex];
            nextEl.focus();
            nextEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        } else if (e.key === 'ArrowLeft') {
          if (!isSidebarOpen) {
            openSidebar();
          }
        } else if (e.key === 'ArrowRight') {
          if (isSidebarOpen) {
            closeSidebar();
            const toggleBtn = document.getElementById('toggle-sidebar');
            toggleBtn?.focus();
          }
        }
      } else if (e.key === 'Enter') {
        if (active && active.tagName !== 'INPUT') {
          e.preventDefault();
          active.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, openSidebar, closeSidebar, showTopBar]);
}
