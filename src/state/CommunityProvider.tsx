import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { CommunityStore } from './community-store';

const CommunityContext = createContext<CommunityStore | null>(null);

export function CommunityProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new CommunityStore(AsyncStorage));
  useEffect(() => {
    void store.hydrate();
  }, [store]);
  return <CommunityContext.Provider value={store}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const store = useContext(CommunityContext);
  if (!store) throw new Error('useCommunity must be used inside AppProviders');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const retrySave = useCallback(() => {
    void store.retrySave();
  }, [store]);
  return {
    ...snapshot,
    signIn: store.signIn,
    signOut: store.signOut,
    addComment: store.addComment,
    deleteComment: store.deleteComment,
    restoreComment: store.restoreComment,
    retrySave,
  };
}
