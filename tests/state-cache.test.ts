import { dehydrate, QueryClient } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { describe, expect, it } from 'vitest';
import {
  boundPersistedCache,
  MAX_PERSISTED_CHARACTERS,
  MAX_PERSISTED_PAGES,
  MAX_PERSISTED_QUERIES,
  serializeQueryCache,
  shrinkCacheAfterFailure,
} from '../src/state/query-persistence';

function cacheWith(count: number): { client: QueryClient; persisted: PersistedClient } {
  const client = new QueryClient();
  for (let index = 0; index < count; index += 1) {
    client.setQueryData(
      ['movies', 'search', index],
      {
        pages: Array.from({ length: 5 }, (_, page) => ({
          movies: [{ title: `Film ${index}`, overview: 'Story', id: index }],
          nextPage: page + 2,
        })),
        pageParams: [1, 2, 3, 4, 5],
      },
      { updatedAt: index + 1 },
    );
  }
  return {
    client,
    persisted: { timestamp: Date.now(), buster: 'test', clientState: dehydrate(client) },
  };
}

describe('bounded offline query cache', () => {
  it('persists recent queries and matching first pages without changing live infinite data', () => {
    const { client, persisted } = cacheWith(20);
    const bounded = boundPersistedCache(persisted);
    expect(bounded.clientState.queries).toHaveLength(MAX_PERSISTED_QUERIES);
    expect(bounded.clientState.queries[0]?.queryKey).toEqual(['movies', 'search', 19]);
    const data = bounded.clientState.queries[0]?.state.data as {
      pages: unknown[];
      pageParams: number[];
    };
    expect(data.pages).toHaveLength(MAX_PERSISTED_PAGES);
    expect(data.pageParams).toEqual([1, 2]);
    expect(client.getQueryData<{ pages: unknown[] }>(['movies', 'search', 19])?.pages).toHaveLength(
      5,
    );
    expect(persisted.clientState.queries).toHaveLength(20);
  });

  it('keeps serialized Unicode data below a conservative device-storage budget', () => {
    const { client } = cacheWith(4);
    client.setQueryData(['movie', 'huge'], { overview: '映'.repeat(MAX_PERSISTED_CHARACTERS + 1) });
    const serialized = serializeQueryCache({
      timestamp: Date.now(),
      buster: 'test',
      clientState: dehydrate(client),
    });
    expect(serialized.length).toBeLessThanOrEqual(MAX_PERSISTED_CHARACTERS);
    expect(new TextEncoder().encode(serialized).length).toBeLessThan(1_000_000);
    expect(JSON.parse(serialized).clientState.queries).toHaveLength(4);
  });

  it('evicts progressively after storage failure with a finite retry budget', () => {
    const { persisted } = cacheWith(12);
    const first = shrinkCacheAfterFailure(persisted, 1)!;
    expect(first.clientState.queries).toHaveLength(6);
    const second = shrinkCacheAfterFailure(first, 2)!;
    expect(second.clientState.queries).toHaveLength(0);
    expect(shrinkCacheAfterFailure(second, 3)).toBeUndefined();
    expect(persisted.clientState.queries).toHaveLength(12);
  });
});
