import { describe, expect, it } from 'vitest';
import { queryRetryDelay, shouldRetryQuery } from '../src/state/query-policy';

describe('query retry policy', () => {
  it('caps transient failures to two retries', () => {
    expect(shouldRetryQuery(0, new Error('Network failed'))).toBe(true);
    expect(shouldRetryQuery(1, { status: 503 })).toBe(true);
    expect(shouldRetryQuery(2, { status: 503 })).toBe(false);
  });

  it('does not retry cancellations or client errors', () => {
    expect(shouldRetryQuery(0, { name: 'AbortError' })).toBe(false);
    expect(shouldRetryQuery(0, { kind: 'invalid-response' })).toBe(false);
    for (const status of [400, 401, 403, 404, 429]) {
      expect(shouldRetryQuery(0, { status })).toBe(false);
    }
  });

  it('backs off without an unbounded wait', () => {
    expect([0, 1, 2, 10].map(queryRetryDelay)).toEqual([1000, 2000, 4000, 4000]);
  });
});
