import { useMemo } from 'react';

export function useMemoizedFilter<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
               String(value).toLowerCase().includes(lowercaseSearch);
      })
    );
  }, [data, searchTerm, searchFields]);
}

export function useMemoizedSort<T>(
  data: T[],
  sortField: keyof T | null,
  sortDirection: 'asc' | 'desc'
): T[] {
  return useMemo(() => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);
}