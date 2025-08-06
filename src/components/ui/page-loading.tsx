import { useEffect, useState, memo } from 'react';

interface PageLoadingProps {
  isLoading: boolean;
}

export const PageLoading = memo(function PageLoading({ isLoading }: PageLoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground animate-pulse">ORDI</h3>
          <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    </div>
  );
});