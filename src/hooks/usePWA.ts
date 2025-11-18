import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAHookReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installApp: () => Promise<boolean>;
  updateAvailable: boolean;
  updateApp: () => void;
}

export const usePWA = (): PWAHookReturn => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only enable SW in production to avoid interfering with Vite HMR in dev
    const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env && !(import.meta as any).env.DEV;

    // Check if Service Workers are supported and not in StackBlitz
    const isSupported = isProd && 'serviceWorker' in navigator && 
                       !window.location.hostname.includes('stackblitz') &&
                       !window.location.hostname.includes('webcontainer');
    
    setIsServiceWorkerSupported(isSupported);

    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setIsInstallable(true);
      console.log('[PWA] Install prompt available');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('[PWA] App installed successfully');
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Register service worker
    const registerServiceWorker = async () => {
      if (isSupported) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          setRegistration(reg);
          console.log('[PWA] Service worker registered');

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  console.log('[PWA] Update available');
                }
              });
            }
          });
        } catch (error) {
          console.error('[PWA] Service worker registration failed:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }
  // Additional check to prevent registration in unsupported environments
  if ('serviceWorker' in navigator && 
      !window.location.hostname.includes('stackblitz') &&
      !window.location.hostname.includes('webcontainer')) {
    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  } else {
    console.log('Service Worker not supported in this environment');
    return false;
  }
  };

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isInstallable,
    isServiceWorkerSupported,
    isInstalled,
    isOnline,
    installApp,
    updateAvailable,
    updateApp
  };
};
