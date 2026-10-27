import type { PersistedClient } from '@tanstack/react-query-persist-client';

export const QUERY_STORAGE_KEY = '@frame/query-cache/v1';
export const MAX_PERSISTED_QUERIES = 12;
export const MAX_PERSISTED_PAGES = 2;
// JSON UTF-16 code units need at most 3 UTF-8 bytes each: under 750 KB.
export const MAX_PERSISTED_CHARACTERS = 250_000;

function trimPages(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const infinite = data as Record<string, unknown>;
  if (!Array.isArray(infinite.pages) || !Array.isArray(infinite.pageParams)) return data;
  return {
    ...infinite,
    pages: infinite.pages.slice(0, MAX_PERSISTED_PAGES),
    pageParams: infinite.pageParams.slice(0, MAX_PERSISTED_PAGES),
  };
}

/** Keep recent offline browsing useful without competing with durable favourites. */
export function boundPersistedCache(client: PersistedClient): PersistedClient {
  const candidates = [...client.clientState.queries]
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
    .slice(0, MAX_PERSISTED_QUERIES)
    .map((query) => ({ ...query, state: { ...query.state, data: trimPages(query.state.data) } }));
  const queries: PersistedClient['clientState']['queries'] = [];
  const bounded: PersistedClient = {
    ...client,
    clientState: { ...client.clientState, queries, mutations: [] },
  };
  for (const query of candidates) {
    queries.push(query);
    if (JSON.stringify(bounded).length > MAX_PERSISTED_CHARACTERS) queries.pop();
  }
  return bounded;
}

export function serializeQueryCache(client: PersistedClient): string {
  return JSON.stringify(boundPersistedCache(client));
}

/** A full device gets at most two progressively smaller cache writes. */
export function shrinkCacheAfterFailure(
  client: PersistedClient,
  errorCount: number,
): PersistedClient | undefined {
  const bounded = boundPersistedCache(client);
  const queries = bounded.clientState.queries;
  if (!queries.length || errorCount > 2) return undefined;
  return {
    ...bounded,
    clientState: {
      ...bounded.clientState,
      queries: queries.slice(0, errorCount === 1 ? Math.floor(queries.length / 2) : 0),
    },
  };
}
