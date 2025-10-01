'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SocketCleanup } from '../utils/socketCleanup';

export function SocketCleanupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cleanup = SocketCleanup.getInstance();
  const previousPathname = useRef<string>();

  useEffect(() => {
    // Only cleanup if pathname actually changed (not on initial load)
    if (previousPathname.current && previousPathname.current !== pathname) {
      // console.log('Pathname changed, cleaning up sockets:', pathname);
      cleanup.cleanupAll();
    }
    previousPathname.current = pathname;
  }, [pathname, cleanup]);

  useEffect(() => {
    // Clean up on page unload
    const handleBeforeUnload = () => {
      cleanup.cleanupAll();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanup]);

  return <>{children}</>;
}
