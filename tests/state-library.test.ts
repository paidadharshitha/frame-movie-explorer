import { describe, expect, it, vi } from 'vitest';
import {
  decodeLibrary,
  LIBRARY_STORAGE_KEY,
  LibraryStore,
  MAX_COLLECTIONS,
  type LibraryData,
  type MovieCollection,
  type PersonalRating,
} from '../src/state/library-store';
import type { FavouriteStorage } from '../src/state/favourites-store';
import type { Movie } from '../src/types/movie';

const movie: Movie = {
  id: 'jikan-1',
  provider: 'jikan',
  title: 'A film to remember',
  posterUrl: 'https://example.com/poster.jpg',
  overview: 'Available offline.',
  year: '2025',
  rating: 8.3,
  genres: ['Drama'],
};
const series: Movie = {
  ...movie,
  id: 'tmdb-tv-2',
  provider: 'tmdb',
  mediaType: 'series',
  title: 'The next episode',
};
const rating: PersonalRating = { movie, value: 4, ratedAt: 1000 };
const collection: MovieCollection = {
  id: 'collection-one',
  name: 'Weekend watch',
  createdAt: 1000,
  movies: [movie],
};
const envelope = (data: LibraryData = { ratings: [rating], collections: [collection] }) =>
  JSON.stringify({ version: 1, ...data });
function storageWith(raw: string | null = null) {
  return {
    getItem: vi.fn(async () => raw),
    setItem: vi.fn(async (_key: string, _value: string) => {}),
  } satisfies FavouriteStorage;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('personal library persistence', () => {
  it('blocks all edits until the complete saved library has hydrated', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new LibraryStore(storage);
    const hydration = store.hydrate();
    expect(store.hydrate()).toBe(hydration);
    store.setRating(movie, 5);
    expect(store.createCollection('New list').error).toBeTruthy();
    expect(store.renameCollection(collection.id, 'Renamed')).toBeTruthy();
    expect(store.deleteCollection(collection.id)).toBeNull();
    expect(store.restoreCollection(collection)).toBeTruthy();
    store.toggleCollectionMovie(collection.id, series);
    expect(storage.setItem).not.toHaveBeenCalled();
    read.resolve(envelope());
    await hydration;
    expect(store.getSnapshot()).toEqual({
      ratings: [rating],
      collections: [collection],
      isHydrated: true,
      storageError: null,
    });
    await store.hydrate();
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem).toHaveBeenCalledWith(LIBRARY_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps damaged storage intact and recovers with a fresh read', async () => {
    const storage = storageWith('{broken');
    const store = new LibraryStore(storage);
    await store.hydrate();
    store.setRating(movie, 5);
    store.createCollection('Weekend');
    expect(store.getSnapshot().isHydrated).toBe(false);
    expect(store.getSnapshot().storageError).toMatch(/unchanged/);
    expect(storage.setItem).not.toHaveBeenCalled();
    storage.getItem.mockResolvedValue(envelope());
    await store.retrySave();
    expect(store.getSnapshot().isHydrated).toBe(true);
    expect(store.getSnapshot().collections).toEqual([collection]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('retries failed reads without inventing an empty library', async () => {
    const storage = storageWith(envelope());
    storage.getItem.mockRejectedValueOnce(new Error('Unavailable'));
    const store = new LibraryStore(storage);
    await store.hydrate();
    expect(store.getSnapshot().isHydrated).toBe(false);
    await store.retrySave();
    expect(store.getSnapshot().ratings).toEqual([rating]);
    expect(store.getSnapshot().storageError).toBeNull();
  });

  it('stores one rating per title, rejects invalid stars, and permits clearing', async () => {
    const storage = storageWith(envelope());
    const store = new LibraryStore(storage, () => 2000);
    await store.hydrate();
    for (const invalid of [0, 6, 3.5, NaN, Infinity, -1]) store.setRating(movie, invalid);
    store.setRating(movie, 4);
    expect(storage.setItem).not.toHaveBeenCalled();
    store.setRating(movie, 5);
    store.setRating(series, 3);
    await store.retrySave();
    expect(store.getSnapshot().ratings).toEqual([
      { movie: series, value: 3, ratedAt: 2000 },
      { movie, value: 5, ratedAt: 2000 },
    ]);
    store.setRating(movie, null);
    await store.retrySave();
    expect(store.getSnapshot().ratings.map(({ movie: item }) => item.id)).toEqual([series.id]);
    expect(store.getSnapshot().collections).toEqual([collection]);
  });

  it('normalizes names, enforces uniqueness and rejects invalid collection names', async () => {
    let id = 0;
    const store = new LibraryStore(
      storageWith(),
      () => 1000,
      () => `collection-${++id}`,
    );
    await store.hydrate();
    expect(store.createCollection('  Weekend   watch  ')).toEqual({ id: 'collection-1' });
    expect(store.getSnapshot().collections[0]?.name).toBe('Weekend watch');
    expect(store.createCollection('WEEKEND WATCH').error).toMatch(/already/);
    expect(store.createCollection('  ').error).toBeTruthy();
    expect(store.createCollection('x'.repeat(41)).error).toBeTruthy();
    expect(store.createCollection('Friends')).toEqual({ id: 'collection-2' });
    expect(store.renameCollection('collection-2', 'weekend watch')).toMatch(/already/);
    expect(store.renameCollection('missing', 'Name')).toMatch(/no longer/);
    expect(store.renameCollection('collection-2', '  Friday   nights  ')).toBeNull();
    expect(store.getSnapshot().collections[0]?.name).toBe('Friday nights');
  });

  it('bounds collection count and detects identifier collisions without overwriting', async () => {
    const storage = storageWith(envelope());
    const store = new LibraryStore(
      storage,
      () => 1000,
      () => collection.id,
    );
    await store.hydrate();
    expect(store.createCollection('Another').error).toBeTruthy();
    expect(store.getSnapshot().collections).toEqual([collection]);
    const full = new LibraryStore(
      storageWith(
        envelope({
          ratings: [],
          collections: Array.from({ length: MAX_COLLECTIONS }, (_, index) => ({
            ...collection,
            id: `collection-${index}`,
            name: `List ${index}`,
          })),
        }),
      ),
    );
    await full.hydrate();
    expect(full.createCollection('One too many').error).toMatch(/50/);
  });

  it('serializes rapid rating, membership and naming edits and saves their final snapshot', async () => {
    const write = deferred<void>();
    const storage = storageWith(envelope());
    storage.setItem.mockImplementationOnce(() => write.promise);
    const store = new LibraryStore(storage, () => 2000);
    await store.hydrate();
    store.setRating(movie, 5);
    store.toggleCollectionMovie(collection.id, series);
    store.toggleCollectionMovie(collection.id, movie);
    store.renameCollection(collection.id, 'Series night');
    store.setRating(movie, 2);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    write.resolve();
    await store.retrySave();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    const expected = {
      ratings: [{ movie, value: 2, ratedAt: 2000 }],
      collections: [{ ...collection, name: 'Series night', movies: [series] }],
    };
    expect(storage.setItem).toHaveBeenLastCalledWith(LIBRARY_STORAGE_KEY, envelope(expected));
  });

  it('retains optimistic changes on write failure and retries the latest data', async () => {
    const storage = storageWith(envelope());
    storage.setItem.mockRejectedValueOnce(new Error('Device full'));
    const store = new LibraryStore(storage, () => 2000);
    await store.hydrate();
    store.setRating(movie, 5);
    await store.retrySave();
    expect(store.getSnapshot().ratings[0]?.value).toBe(5);
    expect(store.getSnapshot().storageError).toMatch(/Retry/);
    await store.retrySave();
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.setItem).toHaveBeenLastCalledWith(
      LIBRARY_STORAGE_KEY,
      envelope({ ratings: [{ movie, value: 5, ratedAt: 2000 }], collections: [collection] }),
    );
  });

  it('undoes collection deletion with its titles and dates, without overwriting newer collections', async () => {
    const store = new LibraryStore(
      storageWith(envelope()),
      () => 2000,
      () => 'collection-new',
    );
    await store.hydrate();
    const removed = store.deleteCollection(collection.id);
    expect(removed).toEqual(collection);
    expect(store.getSnapshot().collections).toEqual([]);
    expect(store.restoreCollection(removed!)).toBeNull();
    expect(store.restoreCollection(removed!)).toBeNull();
    expect(store.getSnapshot().collections).toEqual([collection]);
    store.deleteCollection(collection.id);
    store.createCollection(collection.name);
    expect(store.restoreCollection(removed!)).toMatch(/already/);
    expect(store.getSnapshot().collections[0]?.id).toBe('collection-new');
    expect(store.deleteCollection('missing')).toBeNull();
  });

  it('rejects a damaged record as a whole, including unsafe movie snapshots', () => {
    expect(decodeLibrary(null)).toEqual({ ratings: [], collections: [] });
    const corrupt = [
      { version: 2, ratings: [], collections: [] },
      { version: 1, ratings: [{ ...rating, value: 7 }], collections: [collection] },
      { version: 1, ratings: [{ ...rating, ratedAt: -1 }], collections: [collection] },
      { version: 1, ratings: [rating], collections: [{ ...collection, name: '  ' }] },
      { version: 1, ratings: [rating], collections: [{ ...collection, id: 'bad' }] },
      { version: 1, ratings: [rating], collections: [{ ...collection, createdAt: 'today' }] },
      { version: 1, ratings: [rating], collections: [collection, collection] },
      {
        version: 1,
        ratings: [rating],
        collections: [collection, { ...collection, id: 'collection-two', name: 'WEEKEND WATCH' }],
      },
      {
        version: 1,
        ratings: [rating],
        collections: [
          { ...collection, movies: [movie, { ...series, sourceUrl: 'javascript:alert(1)' }] },
        ],
      },
    ];
    for (const data of corrupt) expect(() => decodeLibrary(JSON.stringify(data))).toThrow();
  });

  it('deduplicates saved title membership and ratings while keeping valid media types', () => {
    const decoded = decodeLibrary(
      envelope({
        ratings: [rating, { movie: series, value: 5, ratedAt: 2000 }, rating],
        collections: [{ ...collection, movies: [movie, movie, series] }],
      }),
    );
    expect(decoded.ratings).toHaveLength(2);
    expect(decoded.collections[0]?.movies).toEqual([movie, series]);
  });
});
