import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/utils/authManager';

export const useCustomerAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const { token, user, role } = AuthManager.getCustomerAuth();
      
      if (!token || !user || role !== 'customer') {
        setIsAuthenticated(false);
        setUser(null);
        router.push('/customer/login');
        return;
      }

      try {
        setIsAuthenticated(true);
        setUser(user);
      } catch (error) {
        AuthManager.clearCustomerAuth();
        setIsAuthenticated(false);
        setUser(null);
        router.push('/customer/login');
      }
    };

    checkAuth();
    setLoading(false);
  }, [router]);

  const logout = () => {
    AuthManager.clearCustomerAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/customer/login');
  };

  return { isAuthenticated, user, loading, logout };
};
