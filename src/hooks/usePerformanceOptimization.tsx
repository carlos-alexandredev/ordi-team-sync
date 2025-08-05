import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

export function useLazyLoad(threshold = 0.1) {
  const observerRef = useRef<IntersectionObserver>();

  const observeElement = useCallback(
    (element: Element, callback: () => void) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback();
              observerRef.current?.unobserve(element);
            }
          });
        },
        { threshold }
      );

      observerRef.current.observe(element);
    },
    [threshold]
  );

  return { observeElement };
}