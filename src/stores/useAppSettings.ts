import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
  pageLoadingEnabled: boolean;
  setPageLoadingEnabled: (enabled: boolean) => void;
}

export const useAppSettings = create<AppSettings>()(
  persist(
    (set) => ({
      pageLoadingEnabled: true,
      setPageLoadingEnabled: (enabled: boolean) => set({ pageLoadingEnabled: enabled }),
    }),
    {
      name: 'app-settings',
    }
  )
);