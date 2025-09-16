import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/utils/authManager';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const { token, user, role } = AuthManager.getAdminAuth();
      
      if (!token || !user || role !== 'admin') {
        setIsAuthenticated(false);
        setUser(null);
        router.push('/admin/login');
        return;
      }

      try {
        setIsAuthenticated(true);
        setUser(user);
      } catch (error) {
        AuthManager.clearAdminAuth();
        setIsAuthenticated(false);
        setUser(null);
        router.push('/admin/login');
      }
    };

    checkAuth();
    setLoading(false);
  }, [router]);

  const logout = () => {
    AuthManager.clearAdminAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/admin/login');
  };

  return { isAuthenticated, user, loading, logout };
};
