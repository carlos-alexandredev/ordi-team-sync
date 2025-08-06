import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
  pageLoadingEnabled: boolean;
  setPageLoadingEnabled: (enabled: boolean) => void;
  customLoginNotification: {
    title: string;
    description: string;
  };
  setCustomLoginNotification: (notification: { title: string; description: string }) => void;
}

export const useAppSettings = create<AppSettings>()(
  persist(
    (set) => ({
      pageLoadingEnabled: false,
      setPageLoadingEnabled: (enabled: boolean) => set({ pageLoadingEnabled: enabled }),
      customLoginNotification: {
        title: "Login realizado com sucesso!",
        description: "Redirecionando..."
      },
      setCustomLoginNotification: (notification: { title: string; description: string }) => 
        set({ customLoginNotification: notification }),
    }),
    {
      name: 'app-settings',
    }
  )
);