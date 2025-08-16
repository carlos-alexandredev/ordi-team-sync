import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { useToast } from '@/hooks/use-toast';

export function useNativeFeatures() {
  const { toast } = useToast();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize native features
    initializeNativeFeatures();
    
    return () => {
      // Cleanup listeners
      App.removeAllListeners();
      PushNotifications.removeAllListeners();
      Network.removeAllListeners();
      Keyboard.removeAllListeners();
    };
  }, []);

  const initializeNativeFeatures = async () => {
    try {
      // Hide splash screen after app is ready
      await SplashScreen.hide();

      // Configure status bar
      if (Capacitor.getPlatform() === 'ios') {
        await StatusBar.setStyle({ style: Style.Light });
      } else {
        await StatusBar.setBackgroundColor({ color: '#1e293b' });
      }

      // Get device info
      const deviceInfo = await Device.getInfo();
      console.log('Device Info:', deviceInfo);

      // Setup app state listeners
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event);
      });

      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      // Setup keyboard listeners
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.transform = `translateY(-${info.keyboardHeight}px)`;
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.transform = 'translateY(0px)';
      });

      // Setup network status
      const status = await Network.getStatus();
      console.log('Network status:', status);

      Network.addListener('networkStatusChange', (status) => {
        if (!status.connected) {
          toast({
            title: "Sem conexão",
            description: "Verifique sua conexão com a internet",
            variant: "destructive"
          });
        }
      });

      // Setup push notifications
      await setupPushNotifications();

    } catch (error) {
      console.error('Error initializing native features:', error);
    }
  };

  const setupPushNotifications = async () => {
    try {
      // Request permission
      await PushNotifications.requestPermissions();

      // Register for push notifications
      await PushNotifications.register();

      // Setup listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        toast({
          title: notification.title || "Nova notificação",
          description: notification.body || "",
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
      });

    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // Haptic feedback functions
  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const triggerNotificationHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  };

  const triggerSelectionHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionStart();
    }
  };

  return {
    triggerHaptic,
    triggerNotificationHaptic,
    triggerSelectionHaptic,
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };
}