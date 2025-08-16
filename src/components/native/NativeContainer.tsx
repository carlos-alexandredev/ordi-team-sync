import { useEffect } from 'react';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

interface NativeContainerProps {
  children: React.ReactNode;
}

export function NativeContainer({ children }: NativeContainerProps) {
  const { isNative, platform } = useNativeFeatures();

  useEffect(() => {
    if (isNative) {
      // Add native platform class to body
      document.body.classList.add(`platform-${platform}`);
      
      // Disable text selection on native platforms for better UX
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // Add native app styling
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'pan-x pan-y';
      
      // Prevent zoom on inputs
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }

    return () => {
      if (isNative) {
        document.body.classList.remove(`platform-${platform}`);
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.overscrollBehavior = '';
        document.body.style.touchAction = '';
      }
    };
  }, [isNative, platform]);

  return (
    <div className={`native-container ${isNative ? 'is-native' : 'is-web'} platform-${platform}`}>
      {children}
    </div>
  );
}