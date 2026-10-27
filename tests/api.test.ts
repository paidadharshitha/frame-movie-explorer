import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeAnime,
  normalizeAnimePage,
  normalizeTmdb,
  normalizeTmdbPage,
  safeUrl,
} from '../src/api/normalize';
import { parseRetryAfter } from '../src/api/client';

const anime = {
  mal_id: 32281,
  type: 'Movie',
  title: 'Kimi no Na wa.',
  title_english: 'Your Name.',
  score: 8.82,
  scored_by: 123,
  synopsis: 'Two strangers discover a mysterious connection.',
  images: { jpg: { large_image_url: 'https://cdn.myanimelist.net/images/anime/5/87048l.jpg' } },
  aired: { from: '2016-08-26T00:00:00+00:00' },
  genres: [{ name: 'Drama' }],
  duration: '1 hr 46 min',
  trailer: { youtube_id: '3KR8_igDs1Y' },
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('provider normalization', () => {
  it('keeps real movie scores, metadata, and a stable provider-prefixed ID', () => {
    expect(normalizeAnime(anime)).toMatchObject({
      id: 'jikan-32281',
      title: 'Your Name.',
      originalTitle: 'Kimi no Na wa.',
      year: '2016',
      rating: 8.82,
      ratingCount: 123,
      genres: ['Drama'],
      runtime: '1 hr 46 min',
      sourceUrl: 'https://myanimelist.net/anime/32281',
      trailerUrl: 'https://www.youtube.com/watch?v=3KR8_igDs1Y',
    });
  });

  it('does not turn missing scores into invented ratings and excludes TV shows', () => {
    expect(normalizeAnime({ ...anime, score: null, images: null, aired: null })).toMatchObject({
      rating: null,
      posterUrl: null,
      year: null,
    });
    expect(normalizeAnime({ ...anime, score: 0 })?.rating).toBeNull();
    expect(normalizeAnime({ ...anime, type: 'TV' })).toBeNull();
    expect(normalizeAnime({ ...anime, mal_id: -1 })).toBeNull();
  });

  it('rejects unsafe and credential-bearing external URLs', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('http://example.com/poster.jpg')).toBeUndefined();
    expect(safeUrl('https://user:password@example.com/poster.jpg')).toBeUndefined();
    expect(safeUrl('//example.com/poster.jpg')).toBeUndefined();
  });

  it('deduplicates API results and follows the real pagination flag', () => {
    const result = normalizeAnimePage(
      { data: [anime, anime], pagination: { has_next_page: true, items: { total: 200 } } },
      3,
    );
    expect(result.movies).toHaveLength(1);
    expect(result.nextPage).toBe(4);
    expect(result.total).toBe(200);
    expect(normalizeAnimePage({ data: [], pagination: { has_next_page: false } }, 9)).toEqual({
      movies: [],
      nextPage: undefined,
      total: null,
    });
  });

  it('reports malformed service payloads instead of pretending they are empty results', () => {
    expect(() => normalizeAnimePage({ error: 'upstream unavailable' }, 1)).toThrow(
      'unexpected response',
    );
    expect(() =>
      normalizeAnimePage({ data: [{}], pagination: { has_next_page: false } }, 1),
    ).toThrow('unexpected response');
  });

  it('normalizes TMDB posters, genres and runtime without trusting image paths', () => {
    expect(
      normalizeTmdb({
        id: 11,
        title: 'Star Wars',
        poster_path: '/abc123.jpg',
        backdrop_path: '//evil.test/x.jpg',
        vote_average: 8.2,
        vote_count: 100,
        genre_ids: [878, 12],
        release_date: '1977-05-25',
        runtime: 121,
      }),
    ).toMatchObject({
      id: 'tmdb-11',
      rating: 8.2,
      year: '1977',
      runtime: '2h 1m',
      genres: ['Science Fiction', 'Adventure'],
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc123.jpg',
      backdropUrl: null,
    });
  });

  it('stops TMDB pagination at the documented 500-page ceiling', () => {
    expect(
      normalizeTmdbPage({ results: [], total_pages: 900, total_results: 18000 }, 500).nextPage,
    ).toBeUndefined();
    expect(normalizeTmdbPage({ results: [], total_pages: 3, total_results: 42 }, 2).nextPage).toBe(
      3,
    );
  });
});

describe('request safety and errors', () => {
  it('parses Retry-After seconds and HTTP dates for the query retry policy', () => {
    expect(parseRetryAfter('3')).toBe(3000);
    expect(
      parseRetryAfter('Wed, 21 Oct 2015 07:28:00 GMT', Date.parse('Wed, 21 Oct 2015 07:27:58 GMT')),
    ).toBe(2000);
    expect(parseRetryAfter('invalid')).toBeUndefined();
    expect(parseRetryAfter('-1')).toBeUndefined();
  });

  it('preserves HTTP status and Retry-After without starting internal retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('', { status: 429, headers: { 'Retry-After': '2' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { getJson } = await import('../src/api/client');
    await expect(getJson('https://api.tenrai.org/v1/top/anime')).rejects.toMatchObject({
      status: 429,
      retryAfter: 2000,
      kind: 'http',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('distinguishes a dropped connection from service HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { getJson } = await import('../src/api/client');
    await expect(getJson('https://api.tenrai.org/v1/top/anime')).rejects.toMatchObject({
      kind: 'network',
      status: undefined,
    });
  });

  it('never sends an already-cancelled search request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    const { getJson } = await import('../src/api/client');
    await expect(
      getJson('https://api.tenrai.org/v1/anime', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels an in-flight search without turning cancellation into an offline error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const { getJson } = await import('../src/api/client');
    const assertion = expect(
      getJson('https://api.tenrai.org/v1/anime', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    controller.abort();
    await assertion;
  });

  it('rejects invalid JSON as a service response error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>Service unavailable</html>', { status: 200 })),
    );
    const { getJson } = await import('../src/api/client');
    await expect(getJson('https://api.tenrai.org/v1/top/anime')).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });

  it('does not let cancelled searches consume request pacing slots', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    const { getJson } = await import('../src/api/client');
    await getJson('https://api.tenrai.org/v1/anime?q=first');
    const controller = new AbortController();
    const cancelled = expect(
      getJson('https://api.tenrai.org/v1/anime?q=old', controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await cancelled;
    const latest = getJson('https://api.tenrai.org/v1/anime?q=new');
    await vi.advanceTimersByTimeAsync(500);
    await latest;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts a stalled request after 12 seconds and exposes a retryable timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      ),
    );
    const { getJson } = await import('../src/api/client');
    const assertion = expect(getJson('https://api.tenrai.org/v1/top/anime')).rejects.toMatchObject({
      kind: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(12_000);
    await assertion;
  });
});

describe('movie API contracts', () => {
  it('validates route IDs before issuing any network request', async () => {
    const { getId } = await import('../src/api/movies');
    expect(getId('jikan-32281')).toEqual({ provider: 'jikan', value: 32281 });
    for (const invalid of ['32281', 'jikan-0', 'tmdb-../secret', 'jikan-9007199254740992']) {
      expect(() => getId(invalid)).toThrow('invalid');
    }
  });

  it('uses the key-free movie-only catalog by default and encodes search terms', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', '');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [anime], pagination: { has_next_page: false } })),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { searchMovies, catalog } = await import('../src/api/movies');
    const result = await searchMovies('  Your Name & more  ', 1);
    expect(catalog.name).toBe('Animated cinema');
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      'q=Your%20Name%20%26%20more&type=movie&sfw=true',
    );
    expect(result.movies[0]?.id).toBe('jikan-32281');
  });

  it('can switch to TMDB without changing the UI contract', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', 'test-read-token');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ id: 11, title: 'Star Wars' }],
          total_pages: 4,
          total_results: 80,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { fetchMovies, catalog } = await import('../src/api/movies');
    const result = await fetchMovies(1, 'popular');
    expect(catalog.id).toBe('tmdb');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/movie/popular?');
    expect(fetchMock.mock.calls[0]?.[1].headers.Authorization).toBe('Bearer test-read-token');
    expect(result.movies[0]?.id).toBe('tmdb-11');
  });
});

describe('movies and series browsing', () => {
  it('normalizes series with distinct TMDB IDs and real episode metadata', () => {
    expect(
      normalizeTmdb(
        {
          id: 11,
          name: 'Example series',
          original_name: 'Original name',
          first_air_date: '2024-06-01',
          number_of_episodes: 16,
          number_of_seasons: 2,
          episode_run_time: [45],
          genre_ids: [10765],
          status: 'Returning Series',
        },
        'series',
      ),
    ).toMatchObject({
      id: 'tmdb-tv-11',
      title: 'Example series',
      originalTitle: 'Original name',
      mediaType: 'series',
      year: '2024',
      episodeCount: 16,
      seasonCount: 2,
      runtime: '45m',
      genres: ['Sci-Fi & Fantasy'],
      status: 'Returning Series',
      sourceUrl: 'https://www.themoviedb.org/tv/11',
    });
    expect(normalizeTmdb({ id: 11, title: 'Same numeric ID' })?.id).toBe('tmdb-11');
  });

  it('accepts TV anime only in a series or detail context', () => {
    const tv = { ...anime, type: 'TV', episodes: 28, status: 'Finished Airing' };
    expect(normalizeAnime(tv)).toBeNull();
    expect(normalizeAnime(tv, 'series')).toMatchObject({
      id: 'jikan-32281',
      mediaType: 'series',
      episodeCount: 28,
      status: 'Finished Airing',
    });
    expect(normalizeAnime(tv, 'all')?.mediaType).toBe('series');
    expect(normalizeAnime(anime, 'series')).toBeNull();
    expect(
      normalizeAnimePage({ data: [tv], pagination: { has_next_page: true } }, 1, 'series').nextPage,
    ).toBe(2);
  });

  it('opens alternate anime recommendation types without adding them to Movie/TV browse feeds', () => {
    for (const type of ['ONA', 'OVA']) {
      const episodic = { ...anime, type, episodes: 10 };
      expect(normalizeAnime(episodic, 'all')).toMatchObject({
        mediaType: 'series',
        episodeCount: 10,
      });
      expect(normalizeAnime(episodic, 'movie')).toBeNull();
      expect(normalizeAnime(episodic, 'series')).toBeNull();
    }
    for (const type of ['ONA', 'OVA', 'Special', 'TV Special', 'Music']) {
      const title = normalizeAnime({ ...anime, type, episodes: 1 }, 'all');
      expect(title?.id).toBe('jikan-32281');
      expect(title?.mediaType).toBeUndefined();
    }
    expect(normalizeAnime({ ...anime, type: 'Unexpected' }, 'all')).toBeNull();
  });

  it('loads a recommended ONA through the detail route', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', '');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            mal_id: 42310,
            title: 'Cyberpunk: Edgerunners',
            type: 'ONA',
            episodes: 10,
          },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { fetchMovie } = await import('../src/api/movies');
    expect(await fetchMovie('jikan-42310')).toMatchObject({
      id: 'jikan-42310',
      title: 'Cyberpunk: Edgerunners',
      mediaType: 'series',
      episodeCount: 10,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/anime/42310/full');
  });

  it('accepts TV route IDs without accepting path traversal or ambiguous provider prefixes', async () => {
    const { getId } = await import('../src/api/movies');
    expect(getId('tmdb-tv-1399')).toEqual({ provider: 'tmdb', value: 1399, mediaType: 'series' });
    for (const id of [
      'jikan-tv-1',
      'tmdb-tv-0',
      'tmdb-tv-01',
      'tmdb-tv-1/credits',
      'tmdb-tv-9007199254740992',
    ])
      expect(() => getId(id)).toThrow('invalid');
  });

  it('requests the real free TV catalog and keeps metadata for details', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', '');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.includes('/full')
                ? { data: { ...anime, type: 'TV', episodes: 12 } }
                : {
                    data: [{ ...anime, type: 'TV', episodes: 12 }],
                    pagination: { has_next_page: false },
                  },
            ),
          ),
      ),
    );
    const { fetchMovies, fetchMovie } = await import('../src/api/movies');
    expect(
      (await fetchMovies(1, 'popular', undefined, { mediaType: 'series', language: 'all' }))
        .movies[0]?.mediaType,
    ).toBe('series');
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toContain('/top/anime?type=tv&sfw=true');
    expect((await fetchMovie('jikan-32281')).episodeCount).toBe(12);
  });

  it('uses TMDB discover language filters and TV search without confusing translation with original language', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', 'test-token');
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            results: [
              { id: 10, name: 'Hindi series', original_language: 'hi' },
              { id: 11, name: 'English series', original_language: 'en' },
            ],
            total_pages: 3,
            total_results: 50,
          }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { fetchMovies, searchMovies } = await import('../src/api/movies');
    await fetchMovies(1, 'top-rated', undefined, { mediaType: 'series', language: 'hi' });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/discover/tv?');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('with_original_language=hi');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('vote_count.gte=50');
    const search = await searchMovies('Example', 1, undefined, {
      mediaType: 'series',
      language: 'te',
    });
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/search/tv?');
    expect(search).toEqual({ movies: [], nextPage: 2, total: null });
  });

  it('rejects unsupported language browsing on the free catalog before making requests', async () => {
    vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { fetchMovies } = await import('../src/api/movies');
    await expect(
      fetchMovies(1, 'popular', undefined, { mediaType: 'movie', language: 'te' }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
