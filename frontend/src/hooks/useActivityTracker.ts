import { useEffect, useCallback, useRef } from 'react';
import { useAdvancedAuth } from '@/contexts/AdvancedAuthContext';

interface ActivityTrackerOptions {
  updateInterval?: number; // milliseconds
  events?: string[];
  onActivity?: () => void;
  onInactivity?: () => void;
  inactivityTimeout?: number; // milliseconds
}

export function useActivityTracker({
  updateInterval = 30000, // 30 seconds
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  onActivity,
  onInactivity,
  inactivityTimeout = 30 * 60 * 1000, // 30 minutes
}: ActivityTrackerOptions = {}) {
  const { updateLastActivity } = useAdvancedAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const updateTimerRef = useRef<NodeJS.Timeout>();

  const handleActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Clear existing inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      onInactivity?.();
    }, inactivityTimeout);
    
    // Call activity callback
    onActivity?.();
  }, [onActivity, onInactivity, inactivityTimeout]);

  const updateActivity = useCallback(() => {
    const now = Date.now();
    
    // Only update if there's been recent activity
    if (now - lastActivityRef.current < updateInterval) {
      updateLastActivity();
    }
  }, [updateLastActivity, updateInterval]);

  useEffect(() => {
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Set up periodic activity updates
    updateTimerRef.current = setInterval(updateActivity, updateInterval);

    // Set initial inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      onInactivity?.();
    }, inactivityTimeout);

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });

      // Clean up timers
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [events, handleActivity, updateActivity, updateInterval, onInactivity, inactivityTimeout]);

  return {
    lastActivity: lastActivityRef.current,
    resetActivity: handleActivity,
  };
}
