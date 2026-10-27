export const QUERY_STALE_TIME = 10 * 60 * 1_000;
export const QUERY_CACHE_TIME = 24 * 60 * 60 * 1_000;

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('name' in error && error.name === 'AbortError') return false;
    if ('kind' in error && error.kind === 'invalid-response') return false;
    if (
      'status' in error &&
      typeof error.status === 'number' &&
      error.status >= 400 &&
      error.status < 500
    ) {
      return false;
    }
  }
  return failureCount < 2;
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1_000 * 2 ** attemptIndex, 4_000);
}
