import { memo, Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper = memo(function LazyWrapper({ 
  children, 
  fallback = <PageLoading isLoading={true} /> 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
});