import { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerStatus } from '../types';

export function useTopBarVisibility(status: PlayerStatus) {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsVisible(true);

    // Only auto-hide if currently actively playing
    if (status === 'playing') {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    }
  }, [status]);

  useEffect(() => {
    // When playback status changes:
    // If playing, start countdown to hide
    // If paused, tuning, or error, keep it visible
    if (status === 'playing') {
      resetTimer();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(true);
    }
  }, [status, resetTimer]);

  useEffect(() => {
    const handleUserActivity = () => {
      resetTimer();
    };

    const events = ['mousemove', 'touchstart', 'click', 'keydown'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  return { isVisible, showTopBar: resetTimer };
}
