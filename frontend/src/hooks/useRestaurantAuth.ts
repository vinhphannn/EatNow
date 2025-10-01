import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/utils/authManager';

export const useRestaurantAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const { token, user, role } = AuthManager.getRestaurantAuth();
      
      if (!token || !user || role !== 'restaurant') {
        setIsAuthenticated(false);
        setUser(null);
        router.push('/restaurant/login');
        return;
      }

      try {
        setIsAuthenticated(true);
        setUser(user);
      } catch (error) {
        AuthManager.clearRestaurantAuth();
        setIsAuthenticated(false);
        setUser(null);
        router.push('/restaurant/login');
      }
    };

    checkAuth();
    setLoading(false);
  }, [router]);

  const logout = () => {
    AuthManager.clearRestaurantAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/restaurant/login');
  };

  return { isAuthenticated, user, loading, logout };
};
