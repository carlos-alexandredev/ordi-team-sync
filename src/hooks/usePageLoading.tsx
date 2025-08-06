import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '@/stores/useAppSettings';

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const pageLoadingEnabled = useAppSettings((state) => state.pageLoadingEnabled);

  useEffect(() => {
    // Se o loading estiver desabilitado, nunca ativa
    if (!pageLoadingEnabled) {
      setIsLoading(false);
      return;
    }

    // Apenas mostra loading se estiver habilitado
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, pageLoadingEnabled]);

  // Força retorno false se estiver desabilitado
  return !pageLoadingEnabled ? false : isLoading;
}