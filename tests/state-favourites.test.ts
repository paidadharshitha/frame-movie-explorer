import { describe, expect, it, vi } from 'vitest';
import {
  decodeFavourites,
  FAVOURITES_STORAGE_KEY,
  FavouritesStore,
} from '../src/state/favourites-store';
import type { FavouriteStorage } from '../src/state/favourites-store';
import type { Movie } from '../src/types/movie';

const first: Movie = {
  id: 'jikan-1',
  provider: 'jikan',
  title: 'A film worth saving',
  posterUrl: 'https://example.com/poster.jpg',
  overview: 'An overview available even without a connection.',
  year: '2024',
  rating: 8.4,
  genres: ['Adventure'],
};
const second: Movie = { ...first, id: 'tmdb-2', provider: 'tmdb', title: 'Another film' };
const envelope = (movies: Movie[]) => JSON.stringify({ version: 1, movies });

function storageWith(raw: string | null = null) {
  return {
    getItem: vi.fn(async () => raw),
    setItem: vi.fn(async (_key: string, _value: string) => {}),
  } satisfies FavouriteStorage;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('durable favourites', () => {
  it('restores complete snapshots without writing over them during hydration', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new FavouritesStore(storage);
    const hydrate = store.hydrate();
    store.toggleFavourite(second);
    expect(storage.setItem).not.toHaveBeenCalled();
    read.resolve(envelope([first]));
    await hydrate;
    expect(store.getSnapshot()).toEqual({
      favourites: [first],
      isHydrated: true,
      storageError: null,
    });
    expect(storage.getItem).toHaveBeenCalledWith(FAVOURITES_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('serializes fast changes and finishes with the latest state on disk', async () => {
    const firstWrite = deferred<void>();
    const storage = storageWith();
    storage.setItem.mockImplementationOnce(() => firstWrite.promise);
    const store = new FavouritesStore(storage);
    await store.hydrate();

    store.toggleFavourite(first);
    store.toggleFavourite(second);
    store.toggleFavourite(first);
    expect(store.getSnapshot().favourites).toEqual([second]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    firstWrite.resolve();
    await store.retrySave();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(storage.setItem).toHaveBeenLastCalledWith(FAVOURITES_STORAGE_KEY, envelope([second]));
  });

  it('preserves optimistic changes on a failed write and saves them on retry', async () => {
    const storage = storageWith();
    storage.setItem.mockRejectedValueOnce(new Error('Device full'));
    const store = new FavouritesStore(storage);
    await store.hydrate();
    store.toggleFavourite(first);
    await store.retrySave();
    expect(store.getSnapshot().favourites).toEqual([first]);
    expect(store.getSnapshot().storageError).toMatch(/Retry/);

    await store.retrySave();
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.setItem).toHaveBeenLastCalledWith(FAVOURITES_STORAGE_KEY, envelope([first]));
  });

  it('never overwrites an unreadable collection and retries the original read', async () => {
    const storage = storageWith('{broken JSON');
    const store = new FavouritesStore(storage);
    await store.hydrate();
    store.toggleFavourite(second);
    expect(store.getSnapshot().isHydrated).toBe(false);
    expect(store.getSnapshot().storageError).toMatch(/unchanged/);
    expect(storage.setItem).not.toHaveBeenCalled();

    storage.getItem.mockResolvedValue(envelope([first]));
    await store.retrySave();
    expect(store.getSnapshot().favourites).toEqual([first]);
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.getItem).toHaveBeenCalledTimes(2);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('retries an unavailable device store without pretending the collection is empty', async () => {
    const storage = storageWith(envelope([first]));
    storage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
    const store = new FavouritesStore(storage);
    await store.hydrate();
    expect(store.getSnapshot().isHydrated).toBe(false);
    await store.retrySave();
    expect(store.getSnapshot().isHydrated).toBe(true);
    expect(store.getSnapshot().favourites).toEqual([first]);
  });

  it('shares an in-progress hydration read', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new FavouritesStore(storage);
    const one = store.hydrate();
    const two = store.hydrate();
    expect(one).toBe(two);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    read.resolve(null);
    await one;
    expect(store.getSnapshot().isHydrated).toBe(true);
  });

  it('rejects partial or unknown schemas instead of silently discarding records', () => {
    expect(() => decodeFavourites('{"version":2,"movies":[]}')).toThrow();
    expect(() => decodeFavourites('{"version":1,"movies":[{"id":"jikan-1"}]}')).toThrow();
    expect(decodeFavourites(envelope([first, first]))).toEqual([first]);
  });

  it('rejects corrupt optional fields, unsafe URLs, and mismatched provider IDs', () => {
    const invalidFields = [
      { runtime: { minutes: 90 } },
      { originalTitle: [] },
      { releaseDate: 2024 },
      { ratingCount: 'many' },
      { backdropUrl: 'javascript:alert(1)' },
      { sourceUrl: 'file:///private/data' },
      { trailerUrl: 'http://example.com/trailer' },
      { posterUrl: 'https://user:password@example.com/poster.jpg' },
      { provider: 'tmdb' },
      { id: 'jikan-9007199254740993' },
      { id: 'jikan-tv-1' },
      { mediaType: 'podcast' },
      { episodeCount: -1 },
      { seasonCount: 2.5 },
    ];
    for (const fields of invalidFields) {
      expect(() =>
        decodeFavourites(JSON.stringify({ version: 1, movies: [{ ...first, ...fields }] })),
      ).toThrow();
    }
  });

  it('restores legacy movies together with series without changing saved IDs', () => {
    const series: Movie = {
      ...second,
      id: 'tmdb-tv-2',
      mediaType: 'series',
      episodeCount: 12,
      seasonCount: 1,
    };
    expect(decodeFavourites(envelope([first, second, series]))).toEqual([first, second, series]);
    expect(() => decodeFavourites(envelope([{ ...series, mediaType: 'movie' }]))).toThrow();
  });
});
