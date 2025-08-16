import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2bd984cbfca04c5484240f9e9a26c0a4',
  appName: 'Ordi Team Sync',
  webDir: 'dist',
  server: {
    url: 'https://2bd984cb-fca0-4c54-8424-0f9e9a26c0a4.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#1e293b'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    App: {
      skipUrlParsing: false
    },
    Haptics: {}
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'OrdiTeamSync/1.0.0',
    overrideUserAgent: 'OrdiTeamSync/1.0.0 (Android)',
    backgroundColor: '#1e293b',
    loggingBehavior: 'none'
  },
  ios: {
    scheme: 'OrdiTeamSync',
    allowsLinkPreview: false,
    handleApplicationURL: false,
    contentInset: 'automatic',
    backgroundColor: '#1e293b',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;