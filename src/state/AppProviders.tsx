import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type PropsWithChildren } from 'react';
import { FavouritesProvider } from './FavouritesProvider';
import { NetworkProvider } from './NetworkProvider';
import {
  QUERY_STORAGE_KEY,
  serializeQueryCache,
  shrinkCacheAfterFailure,
} from './query-persistence';
import {
  QUERY_CACHE_TIME,
  QUERY_STALE_TIME,
  queryRetryDelay,
  shouldRetryQuery,
} from './query-policy';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_STORAGE_KEY,
  throttleTime: 1_000,
  serialize: serializeQueryCache,
  retry: async ({ persistedClient, errorCount }) => {
    const smaller = shrinkCacheAfterFailure(persistedClient, errorCount);
    if (!smaller) {
      // Cached browsing is expendable; preserve space for the saved collection.
      await AsyncStorage.removeItem(QUERY_STORAGE_KEY).catch(() => undefined);
    }
    return smaller;
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME,
            gcTime: QUERY_CACHE_TIME,
            retry: shouldRetryQuery,
            retryDelay: queryRetryDelay,
            refetchOnReconnect: true,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <NetworkProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: QUERY_CACHE_TIME,
          buster: 'movies-v1',
          // A failed background refresh must not erase a previously usable cache.
          dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.data !== undefined },
        }}
      >
        <FavouritesProvider>{children}</FavouritesProvider>
      </PersistQueryClientProvider>
    </NetworkProvider>
  );
}
