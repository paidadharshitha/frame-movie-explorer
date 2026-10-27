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
import { FavouritesStore } from './favourites-store';

const FavouritesContext = createContext<FavouritesStore | null>(null);

export function FavouritesProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new FavouritesStore(AsyncStorage));

  useEffect(() => {
    void store.hydrate();
  }, [store]);

  return <FavouritesContext.Provider value={store}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const store = useContext(FavouritesContext);
  if (!store) throw new Error('useFavourites must be used inside AppProviders');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const isFavourite = useCallback(
    (id: string) => snapshot.favourites.some((movie) => movie.id === id),
    [snapshot.favourites],
  );
  const retrySave = useCallback(() => {
    void store.retrySave();
  }, [store]);

  return { ...snapshot, isFavourite, toggleFavourite: store.toggleFavourite, retrySave };
}
