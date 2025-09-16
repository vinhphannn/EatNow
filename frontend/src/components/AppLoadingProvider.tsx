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
  const [hasShownInitialLoading, setHasShownInitialLoading] = useState(false);

  useEffect(() => {
    // Chỉ hiện loading screen 1 lần khi load app lần đầu
    if (!hasShownInitialLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setHasShownInitialLoading(true);
        // Lưu vào localStorage để biết đã load rồi
        localStorage.setItem('eatnow_initial_loading_completed', 'true');
      }, loadingDuration);

      return () => clearTimeout(timer);
    } else {
      // Nếu đã load rồi thì không hiện loading screen nữa
      setIsLoading(false);
    }
  }, [hasShownInitialLoading, loadingDuration]);

  // Kiểm tra xem đã load lần đầu chưa
  useEffect(() => {
    const hasCompleted = localStorage.getItem('eatnow_initial_loading_completed');
    if (hasCompleted === 'true') {
      setHasShownInitialLoading(true);
      setIsLoading(false);
    }
  }, []);

  const setLoading = (loading: boolean) => {
    // Chỉ cho phép set loading nếu chưa hoàn thành lần đầu
    if (!hasShownInitialLoading) {
      setIsLoading(loading);
    }
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setHasShownInitialLoading(true);
    localStorage.setItem('eatnow_initial_loading_completed', 'true');
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
