import { useEffect, useState } from 'react';

interface PageLoadingProps {
  isLoading: boolean;
}

export function PageLoading({ isLoading }: PageLoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      // Delay hiding to ensure smooth transition
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6">
        {/* Loading "O" Shape - Inspired by "ORDI" */}
        <div className="relative">
          {/* Outer O Ring */}
          <div className="w-20 h-20 rounded-full border-[6px] border-muted/30 relative animate-spin"
               style={{ animationDuration: '2s' }}>
            {/* Spinning gradient border for outer ring */}
            <div className="absolute inset-0 rounded-full border-[6px] border-transparent 
                          border-t-primary border-r-primary/50 animate-spin"
                 style={{ animationDuration: '1.5s' }} />
          </div>
          
          {/* Inner O Ring */}
          <div className="absolute inset-[12px] w-14 h-14 rounded-full border-[4px] border-muted/20 animate-spin"
               style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}>
            {/* Spinning gradient border for inner ring */}
            <div className="absolute inset-0 rounded-full border-[4px] border-transparent 
                          border-b-primary/70 border-l-primary/30 animate-spin"
                 style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
          </div>
          
          {/* Center dot for "O" hole effect */}
          <div className="absolute inset-[26px] w-6 h-6 rounded-full bg-muted/10 animate-pulse"
               style={{ animationDuration: '1s' }} />
        </div>
        
        {/* Brand text */}
        <div className="text-center space-y-1">
          <div className="text-lg font-semibold text-foreground tracking-wider animate-pulse">
            ORDI
          </div>
          <div className="text-sm text-muted-foreground">
            Carregando...
          </div>
        </div>
      </div>
    </div>
  );
}