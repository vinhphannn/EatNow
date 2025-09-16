import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/utils/authManager';

export const useDriverAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const { token, user, role } = AuthManager.getDriverAuth();
      console.log('Checking driver auth:', { token, user, role });
      
      if (!token || !user || role !== 'driver') {
        console.log('Driver not authenticated');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Verify token if needed
        console.log('Driver authenticated successfully');
        setIsAuthenticated(true);
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.log('Auth verification failed:', error);
        AuthManager.clearDriverAuth();
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    AuthManager.clearDriverAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/driver/login');
  };

  return { isAuthenticated, user, loading, logout };
};