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
import { WatchlistStore } from './watchlist-store';

const WatchlistContext = createContext<WatchlistStore | null>(null);

export function WatchlistProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new WatchlistStore(AsyncStorage));

  useEffect(() => {
    void store.hydrate();
  }, [store]);

  return <WatchlistContext.Provider value={store}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const store = useContext(WatchlistContext);
  if (!store) throw new Error('useWatchlist must be used inside AppProviders');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const getStatus = useCallback(
    (id: string) => snapshot.entries.find((entry) => entry.movie.id === id)?.status,
    [snapshot.entries],
  );
  const retrySave = useCallback(() => {
    void store.retrySave();
  }, [store]);

  return {
    ...snapshot,
    getStatus,
    setStatus: store.setStatus,
    removeMovie: store.removeMovie,
    restoreEntry: store.restoreEntry,
    retrySave,
  };
}
