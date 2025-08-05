import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '@/stores/useAppSettings';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const pageLoadingEnabled = useAppSettings((state) => state.pageLoadingEnabled);

  useEffect(() => {
    if (!pageLoadingEnabled) {
      setIsLoading(false);
      return;
    }

    // Start loading when route changes
    setIsLoading(true);
    
    // Reduced loading time for better performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, pageLoadingEnabled]);

  return pageLoadingEnabled ? isLoading : false;
}