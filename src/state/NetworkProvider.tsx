import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import { subscribeToBrowserNetwork } from './browser-network';

const NetworkContext = createContext({ isOnline: true });

export function NetworkProvider({ children }: PropsWithChildren) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = (next: boolean) => {
      onlineManager.setOnline(next);
      setIsOnline(next);
    };
    if (Platform.OS === 'web') return subscribeToBrowserNetwork(update);
    return NetInfo.addEventListener((state) => {
      // null means connectivity is still being determined, not a confirmed outage.
      const next = state.isConnected !== false && state.isInternetReachable !== false;
      update(next);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return <NetworkContext.Provider value={{ isOnline }}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus() {
  return useContext(NetworkContext);
}
