import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeAnimeEpisodes,
  normalizeAnimePeople,
  normalizeAnimeRecommendations,
  normalizeTmdbPeople,
} from '../src/api/media-extras';

vi.mock('../src/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/api/client')>()),
  getJson: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function api(token = '') {
  vi.stubEnv('EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN', token);
  const extras = await import('../src/api/media-extras');
  const { getJson } = await import('../src/api/client');
  return { ...extras, request: vi.mocked(getJson) };
}

describe('cast and creator normalization', () => {
  it('shows real Japanese voice actors and prioritizes directors instead of treating characters as people', () => {
    const people = normalizeAnimePeople(
      {
        data: [
          {
            character: { name: 'Mitsuha' },
            voice_actors: [
              { language: 'English', person: { mal_id: 2, name: 'English actor' } },
              {
                language: 'Japanese',
                person: {
                  mal_id: 3,
                  name: 'Japanese actor',
                  images: { jpg: { image_url: 'https://example.com/person.jpg' } },
                },
              },
            ],
          },
        ],
      },
      {
        data: [
          { person: { mal_id: 4, name: 'Writer' }, positions: ['Screenplay'] },
          { person: { mal_id: 5, name: 'Director' }, positions: ['Director', 'Original Creator'] },
          { person: { mal_id: 6, name: 'Producer' }, positions: ['Producer'] },
        ],
      },
    );
    expect(people.cast).toEqual([
      {
        id: 'jikan-person-3',
        name: 'Japanese actor',
        role: 'Mitsuha · Japanese voice',
        imageUrl: 'https://example.com/person.jpg',
      },
    ]);
    expect(people.crew.map((person) => person.name)).toEqual(['Director', 'Writer']);
  });

  it('reads TMDB aggregate TV roles and rejects unsafe image paths', () => {
    expect(
      normalizeTmdbPeople({
        cast: [
          {
            id: 1,
            name: 'Actor',
            roles: [{ character: 'Detective' }],
            profile_path: '//unsafe.test/a.jpg',
          },
        ],
        crew: [{ id: 2, name: 'Creator', jobs: [{ job: 'Director' }] }],
      }),
    ).toEqual({
      cast: [{ id: 'tmdb-person-1', name: 'Actor', role: 'Detective', imageUrl: null }],
      crew: [{ id: 'tmdb-person-2', name: 'Creator', role: 'Director', imageUrl: null }],
    });
    expect(() => normalizeTmdbPeople({ error: 'upstream failed' })).toThrow('incomplete');
  });

  it('keeps missing recommendation metadata unknown and deduplicates IDs', () => {
    const item = {
      entry: {
        mal_id: 42,
        title: 'Suggested title',
        images: { jpg: { image_url: 'javascript:bad' } },
      },
    };
    const recommendations = normalizeAnimeRecommendations({ data: [item, item, { entry: {} }] });
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      id: 'jikan-42',
      title: 'Suggested title',
      rating: null,
      year: null,
      overview: '',
      posterUrl: null,
      genres: [],
    });
    expect(recommendations[0]?.mediaType).toBeUndefined();
    expect(() => normalizeAnimeRecommendations({ data: null })).toThrow('incomplete');
  });
});

describe('episodes and seasons', () => {
  it('keeps real anime pagination, deduplicates episode IDs and converts 5-point episode scores', () => {
    const episode = {
      mal_id: 1,
      title: 'The Journey’s End',
      score: 4.5,
      synopsis: 'The adventure begins.',
      aired: '2023-09-29',
    };
    expect(
      normalizeAnimeEpisodes(
        { data: [episode, episode], pagination: { has_next_page: true } },
        'jikan-52991',
        2,
      ),
    ).toEqual({
      episodes: [
        {
          id: 'jikan-52991-episode-1',
          number: 1,
          title: 'The Journey’s End',
          rating: 9,
          overview: 'The adventure begins.',
          airDate: '2023-09-29',
        },
      ],
      nextPage: 3,
    });
    expect(() => normalizeAnimeEpisodes({ data: [] }, 'jikan-1', 1)).toThrow('incomplete');
  });

  it('exposes one named MAL catalog entry rather than inventing franchise seasons', async () => {
    const { fetchSeriesSeasons, request } = await api();
    request.mockResolvedValue({
      data: { mal_id: 52991, title: 'Frieren', type: 'TV', episodes: 28 },
    });
    expect(await fetchSeriesSeasons('jikan-52991')).toEqual([
      { number: 1, name: 'Frieren', episodeCount: 28, posterUrl: null },
    ]);
    expect(request.mock.calls[0]?.[0]).toContain('/anime/52991/full');
  });

  it('uses actual TMDB seasons, including season zero specials, and a complete non-paginated episode list', async () => {
    const { fetchSeriesSeasons, fetchSeasonEpisodes, request } = await api('test-token');
    request.mockResolvedValueOnce({
      seasons: [
        { season_number: 1, name: 'Season 1', episode_count: 10 },
        { season_number: 0, name: 'Specials', episode_count: 2 },
      ],
    });
    expect((await fetchSeriesSeasons('tmdb-tv-10')).map((season) => season.number)).toEqual([0, 1]);
    request.mockResolvedValueOnce({
      episodes: [{ id: 30, episode_number: 1, name: 'Special', vote_average: 7.5 }],
    });
    expect(await fetchSeasonEpisodes('tmdb-tv-10', 0)).toMatchObject({
      episodes: [{ id: 'tmdb-episode-30', number: 1, title: 'Special', rating: 7.5 }],
    });
    expect(request.mock.calls[1]?.[0]).toContain('/tv/10/season/0?');
    expect(await fetchSeasonEpisodes('tmdb-tv-10', 0, 2)).toEqual({ episodes: [] });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('rejects bad season/page/route values without a network call', async () => {
    const { fetchSeasonEpisodes, fetchMediaPeople, request } = await api();
    await expect(fetchSeasonEpisodes('jikan-1', 2)).rejects.toMatchObject({ status: 400 });
    await expect(fetchSeasonEpisodes('jikan-1', 1, 0)).rejects.toMatchObject({ status: 400 });
    await expect(fetchSeasonEpisodes('tmdb-tv-1', -1)).rejects.toMatchObject({ status: 400 });
    await expect(fetchMediaPeople('tmdb-tv-1/../../secret')).rejects.toMatchObject({ status: 400 });
    expect(request).not.toHaveBeenCalled();
  });
});

describe('provider endpoints and cancellation', () => {
  it('requests movie credits and TV aggregate credits with the caller’s signal', async () => {
    const { fetchMediaPeople, request } = await api('test-token');
    request.mockResolvedValue({ cast: [], crew: [] });
    const signal = new AbortController().signal;
    await fetchMediaPeople('tmdb-10', signal);
    await fetchMediaPeople('tmdb-tv-10', signal);
    expect(request.mock.calls[0]).toEqual([
      'https://api.themoviedb.org/3/movie/10/credits?language=en-US',
      signal,
      'test-token',
    ]);
    expect(request.mock.calls[1]?.[0]).toContain('/tv/10/aggregate_credits?');
  });

  it('fetches both character voices and staff for anime and propagates failure', async () => {
    const { fetchMediaPeople, request } = await api();
    request.mockResolvedValue({ data: [] });
    const signal = new AbortController().signal;
    expect(await fetchMediaPeople('jikan-1', signal)).toEqual({ cast: [], crew: [] });
    expect(request.mock.calls.map(([url]) => url)).toEqual([
      'https://api.tenrai.org/v1/anime/1/characters',
      'https://api.tenrai.org/v1/anime/1/staff',
    ]);
    expect(request.mock.calls.every(([, requestSignal]) => requestSignal === signal)).toBe(true);
    request.mockRejectedValue(new Error('network dropped'));
    await expect(fetchMediaPeople('jikan-1')).rejects.toThrow('network dropped');
  });

  it('normalizes TV recommendations to TV IDs and omits the current title', async () => {
    const { fetchSimilarMedia, request } = await api('test-token');
    request.mockResolvedValue({
      results: [
        { id: 10, name: 'Current' },
        { id: 11, name: 'Similar' },
      ],
    });
    expect((await fetchSimilarMedia('tmdb-tv-10')).map((movie) => movie.id)).toEqual([
      'tmdb-tv-11',
    ]);
    expect(request.mock.calls[0]?.[0]).toContain('/tv/10/recommendations?');
  });

  it('uses paginated anime episodes and does not request TMDB saved titles without a token', async () => {
    const { fetchSeasonEpisodes, fetchSimilarMedia, request } = await api();
    request.mockResolvedValue({ data: [], pagination: { has_next_page: false } });
    const signal = new AbortController().signal;
    expect(await fetchSeasonEpisodes('jikan-1', 1, 3, signal)).toEqual({
      episodes: [],
      nextPage: undefined,
    });
    expect(request.mock.calls[0]).toEqual([
      'https://api.tenrai.org/v1/anime/1/episodes?page=3',
      signal,
    ]);
    await expect(fetchSimilarMedia('tmdb-tv-1')).rejects.toMatchObject({ status: 401 });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
