import { useEffect, useCallback } from 'react';

// Utility to clean up socket connections when switching between roles/pages
export class SocketCleanup {
  private static instance: SocketCleanup;
  private activeSockets: Map<string, any> = new Map();

  static getInstance(): SocketCleanup {
    if (!SocketCleanup.instance) {
      SocketCleanup.instance = new SocketCleanup();
    }
    return SocketCleanup.instance;
  }

  // Register a socket connection
  registerSocket(key: string, socket: any) {
    // Clean up existing socket with same key
    if (this.activeSockets.has(key)) {
      const existingSocket = this.activeSockets.get(key);
      if (existingSocket && existingSocket.disconnect) {
        // console.log(`Cleaning up existing socket for key: ${key}`);
        existingSocket.disconnect();
      }
    }
    
    this.activeSockets.set(key, socket);
    // console.log(`Registered socket for key: ${key}`);
  }

  // Clean up specific socket
  cleanupSocket(key: string) {
    if (this.activeSockets.has(key)) {
      const socket = this.activeSockets.get(key);
      if (socket && socket.disconnect) {
        // console.log(`Cleaning up socket for key: ${key}`);
        socket.disconnect();
      }
      this.activeSockets.delete(key);
    }
  }

  // Clean up all sockets
  cleanupAll() {
    // console.log('Cleaning up all socket connections');
    this.activeSockets.forEach((socket, key) => {
      if (socket && socket.disconnect) {
        // console.log(`Cleaning up socket for key: ${key}`);
        socket.disconnect();
      }
    });
    this.activeSockets.clear();
  }

  // Clean up sockets for a specific role
  cleanupByRole(role: string) {
    // console.log(`Cleaning up sockets for role: ${role}`);
    this.activeSockets.forEach((socket, key) => {
      if (key.includes(role) && socket && socket.disconnect) {
        // console.log(`Cleaning up socket for key: ${key}`);
        socket.disconnect();
        this.activeSockets.delete(key);
      }
    });
  }
}

// Hook to automatically cleanup on page unload
export function useSocketCleanup() {
  useEffect(() => {
    const cleanup = () => {
      SocketCleanup.getInstance().cleanupAll();
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Cleanup on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cleanup();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      document.removeEventListener('visibilitychange', cleanup);
    };
  }, []);
}

// Hook to cleanup when switching roles
export function useRoleSwitchCleanup() {
  const cleanup = useCallback((newRole: string) => {
    // console.log(`Switching to role: ${newRole}`);
    
    // Clean up opposite role sockets
    if (newRole === 'restaurant') {
      SocketCleanup.getInstance().cleanupByRole('customer');
    } else if (newRole === 'customer') {
      SocketCleanup.getInstance().cleanupByRole('restaurant');
    }
  }, []);

  return cleanup;
}
