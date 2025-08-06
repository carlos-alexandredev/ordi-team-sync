import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '@/stores/useAppSettings';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const pageLoadingEnabled = useAppSettings((state) => state.pageLoadingEnabled);

  const startLoading = useCallback(() => {
    if (pageLoadingEnabled) {
      setIsLoading(true);
    }
  }, [pageLoadingEnabled]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!pageLoadingEnabled) {
      setIsLoading(false);
      return;
    }

    startLoading();
    
    const timer = setTimeout(stopLoading, 150);
    return () => clearTimeout(timer);
  }, [location.pathname, pageLoadingEnabled, startLoading, stopLoading]);

  return pageLoadingEnabled ? isLoading : false;
}