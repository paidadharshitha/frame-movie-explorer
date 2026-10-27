export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid-response';

/** Query retries live in the query client, so a single action cannot multiply retries. */
export class ApiError extends Error {
  readonly status?: number;
  /** Server-requested delay in milliseconds. */
  readonly retryAfter?: number;
  readonly kind: ApiErrorKind;

  constructor(
    message: string,
    options: { status?: number; retryAfter?: number; kind?: ApiErrorKind } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.retryAfter = options.retryAfter;
    this.kind = options.kind ?? 'http';
  }
}

const REQUEST_TIMEOUT_MS = 12_000;
// Tenrai permits 4 requests/second and 120/minute. Space starts to respect both.
const REQUEST_INTERVAL_MS = 500;
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

function abortError() {
  const error = new Error('The request was cancelled.');
  error.name = 'AbortError';
  return error;
}

function wait(delay: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function waitForTurn(signal?: AbortSignal): Promise<void> {
  const turn = requestQueue.then(async () => {
    if (signal?.aborted) throw abortError();
    const delay = Math.max(0, lastRequestAt + REQUEST_INTERVAL_MS - Date.now());
    if (delay) await wait(delay, signal);
    if (signal?.aborted) throw abortError();
    // Cancelled searches do not reserve future slots and slow down the next query.
    lastRequestAt = Date.now();
  });
  requestQueue = turn.catch(() => undefined);
  return turn;
}

export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : undefined;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}

export async function getJson(url: string, signal?: AbortSignal, token?: string): Promise<unknown> {
  await waitForTurn(signal);
  if (signal?.aborted) throw abortError();

  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const message =
        response.status === 429
          ? 'The movie service is busy. Please try again in a moment.'
          : response.status === 401 || response.status === 403
            ? 'The movie service could not verify the API access token.'
            : response.status === 404
              ? 'This movie is no longer available in the catalog.'
              : 'The movie service could not complete this request. Please try again.';
      throw new ApiError(message, {
        status: response.status,
        retryAfter: parseRetryAfter(response.headers.get('Retry-After')),
      });
    }
    try {
      return await response.json();
    } catch (error) {
      // An aborted body read is still a cancellation/timeout, not malformed JSON.
      if (controller.signal.aborted) throw error;
      throw new ApiError('The movie service returned an unreadable response.', {
        kind: 'invalid-response',
      });
    }
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut)
      throw new ApiError('The connection is taking too long. Please try again.', {
        kind: 'timeout',
      });
    if (error instanceof ApiError) throw error;
    throw new ApiError('Could not connect. Check your connection and try again.', {
      kind: 'network',
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}
