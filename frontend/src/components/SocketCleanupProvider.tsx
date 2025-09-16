'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SocketCleanup } from '../utils/socketCleanup';

export function SocketCleanupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cleanup = SocketCleanup.getInstance();

  useEffect(() => {
    // Clean up all sockets when pathname changes
    console.log('Pathname changed, cleaning up sockets:', pathname);
    cleanup.cleanupAll();
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
