import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2bd984cbfca04c5484240f9e9a26c0a4',
  appName: 'ordi-team-sync',
  webDir: 'dist',
  server: {
    url: 'https://2bd984cb-fca0-4c54-8424-0f9e9a26c0a4.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;