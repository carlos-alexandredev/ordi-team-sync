import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true);
    
    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return isLoading;
}