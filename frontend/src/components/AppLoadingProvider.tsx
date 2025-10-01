'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';

interface AppLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export function useAppLoading() {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error('useAppLoading must be used within AppLoadingProvider');
  }
  return context;
}

interface AppLoadingProviderProps {
  children: ReactNode;
  loadingDuration?: number;
}

export default function AppLoadingProvider({ 
  children, 
  loadingDuration = 3000 
}: AppLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hiện loading screen mỗi lần load trang
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDuration);

    return () => clearTimeout(timer);
  }, [loadingDuration]);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <AppLoadingContext.Provider value={{ isLoading, setLoading }}>
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} duration={loadingDuration} />
      ) : (
        children
      )}
    </AppLoadingContext.Provider>
  );
}
