import { describe, expect, it, vi } from 'vitest';
import {
  decodeWatchlist,
  WATCHLIST_STORAGE_KEY,
  WatchlistStore,
  type WatchlistEntry,
} from '../src/state/watchlist-store';
import type { FavouriteStorage } from '../src/state/favourites-store';
import type { Movie } from '../src/types/movie';

const first: Movie = {
  id: 'jikan-1',
  provider: 'jikan',
  title: 'A film for tonight',
  posterUrl: 'https://example.com/poster.jpg',
  overview: 'An overview available without a connection.',
  year: '2024',
  rating: 8.4,
  genres: ['Adventure'],
};
const second: Movie = { ...first, id: 'tmdb-2', provider: 'tmdb', title: 'Another film' };
const planned: WatchlistEntry = { movie: first, status: 'planned', addedAt: 1000 };
const envelope = (entries: WatchlistEntry[]) => JSON.stringify({ version: 1, entries });

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

describe('durable watchlist', () => {
  it('restores complete snapshots and blocks both mutation paths until hydration succeeds', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new WatchlistStore(storage);
    const hydration = store.hydrate();
    store.setStatus(second, 'watched');
    store.removeMovie(first.id);
    expect(storage.setItem).not.toHaveBeenCalled();
    read.resolve(envelope([planned]));
    await hydration;
    expect(store.getSnapshot()).toEqual({
      entries: [planned],
      isHydrated: true,
      storageError: null,
    });
    expect(storage.getItem).toHaveBeenCalledWith(WATCHLIST_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('preserves added dates and order while moving films between planned and watched', async () => {
    const storage = storageWith(envelope([planned]));
    const now = vi.fn(() => 2000);
    const store = new WatchlistStore(storage, now);
    await store.hydrate();
    store.setStatus(second, 'planned');
    store.setStatus(first, 'watched');
    await store.retrySave();
    expect(store.getSnapshot().entries).toEqual([
      { movie: second, status: 'planned', addedAt: 2000 },
      { ...planned, status: 'watched', watchedAt: 2000 },
    ]);
    now.mockReturnValue(3000);
    store.setStatus(first, 'planned');
    await store.retrySave();
    expect(store.getSnapshot().entries[1]).toEqual(planned);
    store.setStatus(first, 'watched');
    await store.retrySave();
    expect(store.getSnapshot().entries[1]).toEqual({
      ...planned,
      status: 'watched',
      watchedAt: 3000,
    });
  });

  it('serializes fast edits and persists the final status without stale writes winning', async () => {
    const firstWrite = deferred<void>();
    const storage = storageWith();
    storage.setItem.mockImplementationOnce(() => firstWrite.promise);
    const store = new WatchlistStore(storage, () => 1000);
    await store.hydrate();
    store.setStatus(first, 'planned');
    store.setStatus(second, 'planned');
    store.setStatus(first, 'watched');
    store.removeMovie(second.id);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    firstWrite.resolve();
    await store.retrySave();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(storage.setItem).toHaveBeenLastCalledWith(
      WATCHLIST_STORAGE_KEY,
      envelope([{ ...planned, status: 'watched', watchedAt: 1000 }]),
    );
  });

  it('retains failed optimistic changes and retries the latest snapshot', async () => {
    const storage = storageWith();
    storage.setItem.mockRejectedValueOnce(new Error('Device full'));
    const store = new WatchlistStore(storage, () => 1000);
    await store.hydrate();
    store.setStatus(first, 'planned');
    await store.retrySave();
    expect(store.getSnapshot().entries).toEqual([planned]);
    expect(store.getSnapshot().storageError).toMatch(/Retry/);
    await store.retrySave();
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.setItem).toHaveBeenLastCalledWith(WATCHLIST_STORAGE_KEY, envelope([planned]));
  });

  it('never overwrites a damaged list and allows recovery from the original storage', async () => {
    const storage = storageWith('{broken JSON');
    const store = new WatchlistStore(storage);
    await store.hydrate();
    store.setStatus(second, 'planned');
    store.removeMovie(first.id);
    expect(store.getSnapshot().isHydrated).toBe(false);
    expect(store.getSnapshot().storageError).toMatch(/unchanged/);
    expect(storage.setItem).not.toHaveBeenCalled();
    storage.getItem.mockResolvedValue(envelope([planned]));
    await store.retrySave();
    expect(store.getSnapshot().entries).toEqual([planned]);
    expect(store.getSnapshot().storageError).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('retries a failed read without pretending hydration succeeded', async () => {
    const storage = storageWith(envelope([planned]));
    storage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
    const store = new WatchlistStore(storage);
    await store.hydrate();
    expect(store.getSnapshot().isHydrated).toBe(false);
    await store.retrySave();
    expect(store.getSnapshot().isHydrated).toBe(true);
    expect(store.getSnapshot().entries).toEqual([planned]);
  });

  it('deduplicates concurrent reads and does not reload a hydrated store', async () => {
    const read = deferred<string | null>();
    const storage = storageWith();
    storage.getItem.mockReturnValue(read.promise);
    const store = new WatchlistStore(storage);
    const one = store.hydrate();
    const two = store.hydrate();
    expect(one).toBe(two);
    read.resolve(null);
    await one;
    await store.hydrate();
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it('does not change watched dates or write for repeated selections and missing removals', async () => {
    const watched: WatchlistEntry = { ...planned, status: 'watched', watchedAt: 2000 };
    const storage = storageWith(envelope([watched]));
    const store = new WatchlistStore(storage, () => 3000);
    await store.hydrate();
    store.setStatus(first, 'watched');
    store.removeMovie(second.id);
    expect(store.getSnapshot().entries).toEqual([watched]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('undoes removal with original dates and never overwrites a film that was re-added', async () => {
    const watched: WatchlistEntry = { ...planned, status: 'watched', watchedAt: 2000 };
    const storage = storageWith(envelope([watched]));
    const store = new WatchlistStore(storage, () => 3000);
    store.restoreEntry(watched);
    expect(storage.setItem).not.toHaveBeenCalled();
    await store.hydrate();
    store.removeMovie(first.id);
    store.restoreEntry(watched);
    await store.retrySave();
    expect(store.getSnapshot().entries).toEqual([watched]);
    expect(storage.setItem).toHaveBeenLastCalledWith(WATCHLIST_STORAGE_KEY, envelope([watched]));

    store.removeMovie(first.id);
    store.setStatus(first, 'planned');
    store.restoreEntry(watched);
    await store.retrySave();
    const reAdded: WatchlistEntry = { ...planned, addedAt: 3000 };
    expect(store.getSnapshot().entries).toEqual([reAdded]);
    expect(storage.setItem).toHaveBeenLastCalledWith(WATCHLIST_STORAGE_KEY, envelope([reAdded]));
  });

  it('rejects unknown schemas or corrupt records without discarding a partial list', () => {
    expect(decodeWatchlist(null)).toEqual([]);
    expect(decodeWatchlist(envelope([planned, planned]))).toEqual([planned]);
    expect(() => decodeWatchlist('{"version":2,"entries":[]}')).toThrow();
    const invalidEntries = [
      { ...planned, status: 'unknown' },
      { ...planned, addedAt: -1 },
      { ...planned, addedAt: 'yesterday' },
      { ...planned, watchedAt: 2000 },
      { ...planned, status: 'watched' },
      { ...planned, status: 'watched', watchedAt: null },
      { ...planned, movie: { ...first, provider: 'tmdb' } },
      { ...planned, movie: { ...first, sourceUrl: 'javascript:alert(1)' } },
    ];
    for (const entry of invalidEntries) {
      expect(() =>
        decodeWatchlist(JSON.stringify({ version: 1, entries: [planned, entry] })),
      ).toThrow();
    }
  });
});
