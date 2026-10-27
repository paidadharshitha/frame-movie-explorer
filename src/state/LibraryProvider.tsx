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
import { LibraryStore } from './library-store';

const LibraryContext = createContext<LibraryStore | null>(null);

export function LibraryProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new LibraryStore(AsyncStorage));
  useEffect(() => {
    void store.hydrate();
  }, [store]);
  return <LibraryContext.Provider value={store}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const store = useContext(LibraryContext);
  if (!store) throw new Error('useLibrary must be used inside AppProviders');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const retrySave = useCallback(() => {
    void store.retrySave();
  }, [store]);
  return {
    ...snapshot,
    setRating: store.setRating,
    createCollection: store.createCollection,
    renameCollection: store.renameCollection,
    deleteCollection: store.deleteCollection,
    restoreCollection: store.restoreCollection,
    toggleCollectionMovie: store.toggleCollectionMovie,
    retrySave,
  };
}
