import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapacitorSplashScreen } from '@capacitor/splash-screen';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Hide after 3 seconds
      const timer = setTimeout(async () => {
        await CapacitorSplashScreen.hide();
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // For web, hide immediately
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800">
      <div className="text-center">
        <div className="mb-8">
          {/* Logo/Icon placeholder */}
          <div className="w-24 h-24 mx-auto bg-primary rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">OTS</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Ordi Team Sync</h1>
        <p className="text-slate-300 mb-8">Sistema de Gestão Empresarial</p>
        
        {/* Loading indicator */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}