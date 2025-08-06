import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSettings } from '@/stores/useAppSettings';

export function usePageLoading() {
  const location = useLocation();
  const pageLoadingEnabled = useAppSettings((state) => state.pageLoadingEnabled);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // DEBUG: Adicione um console.log para verificar o estado
    console.log('PageLoading - Enabled:', pageLoadingEnabled, 'Path:', location.pathname);
    
    // Se estiver desabilitado, não faz nada
    if (!pageLoadingEnabled) {
      setIsLoading(false);
      return;
    }

    // Apenas executa se estiver habilitado
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname, pageLoadingEnabled]);

  // SEMPRE retorna false se estiver desabilitado
  if (!pageLoadingEnabled) return false;
  
  return isLoading;
}