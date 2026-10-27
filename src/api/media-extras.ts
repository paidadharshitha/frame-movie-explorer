import type {
  Episode,
  EpisodePage,
  MediaPeople,
  Movie,
  PersonCredit,
  Season,
} from '../types/movie';
import { ApiError } from './client';
import { fetchMovie, getId, providerRequest } from './movies';
import { normalizeTmdb, object, safeUrl, tmdbImage } from './normalize';

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const integer = (value: unknown, minimum = 1): number | undefined =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum ? value : undefined;
const rating = (value: unknown, scale = 10): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= scale
    ? value * (10 / scale)
    : null;

function list(value: unknown): unknown[] {
  if (!Array.isArray(value))
    throw new ApiError('The service returned incomplete title information. Please try again.', {
      kind: 'invalid-response',
    });
  return value;
}

function unique<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function animePerson(value: unknown, role: string): PersonCredit | null {
  const person = object(value);
  const id = integer(person.mal_id);
  const name = text(person.name);
  return id && name
    ? {
        id: `jikan-person-${id}`,
        name,
        role,
        imageUrl: safeUrl(object(object(person.images).jpg).image_url) ?? null,
      }
    : null;
}

/** Use actual voice-actor credits; characters are not presented as actors. */
export function normalizeAnimePeople(characters: unknown, staff: unknown): MediaPeople {
  const cast = list(object(characters).data).flatMap((value) => {
    const character = object(value);
    const voices = Array.isArray(character.voice_actors) ? character.voice_actors.map(object) : [];
    const voice = voices.find((item) => item.language === 'Japanese') ?? voices[0];
    if (!voice) return [];
    const name = text(object(character.character).name);
    const language = text(voice.language);
    const person = animePerson(
      voice.person,
      [name, language ? `${language} voice` : 'Voice'].filter(Boolean).join(' · '),
    );
    return person ? [person] : [];
  });
  const crew = list(object(staff).data)
    .flatMap((value) => {
      const entry = object(value);
      const positions = Array.isArray(entry.positions)
        ? entry.positions.map(text).filter(Boolean)
        : [];
      const relevant = positions.filter((position) =>
        /director|original creator|original story|screenplay|series composition/i.test(position),
      );
      if (!relevant.length) return [];
      const person = animePerson(entry.person, relevant.join(' · '));
      return person ? [person] : [];
    })
    .sort((a, b) => Number(/director/i.test(b.role)) - Number(/director/i.test(a.role)));
  return { cast: unique(cast).slice(0, 12), crew: unique(crew).slice(0, 4) };
}

export function normalizeTmdbPeople(input: unknown): MediaPeople {
  const response = object(input);
  const normalize = (value: unknown, crew: boolean): PersonCredit | null => {
    const person = object(value);
    const id = integer(person.id);
    const name = text(person.name);
    const aggregate = crew ? person.jobs : person.roles;
    const role =
      text(crew ? person.job : person.character) ||
      (Array.isArray(aggregate)
        ? aggregate
            .map((item) => text(object(item)[crew ? 'job' : 'character']))
            .filter(Boolean)
            .join(' · ')
        : '');
    return id && name
      ? { id: `tmdb-person-${id}`, name, role, imageUrl: tmdbImage(person.profile_path, 'w500') }
      : null;
  };
  const cast = list(response.cast)
    .map((item) => normalize(item, false))
    .filter((item): item is PersonCredit => !!item);
  const crew = list(response.crew)
    .map((item) => normalize(item, true))
    .filter((item): item is PersonCredit => !!item)
    .filter((item) => /director|creator|screenplay|writer/i.test(item.role))
    .sort((a, b) => Number(/director/i.test(b.role)) - Number(/director/i.test(a.role)));
  return { cast: unique(cast).slice(0, 12), crew: unique(crew).slice(0, 4) };
}

export async function fetchMediaPeople(id: string, signal?: AbortSignal): Promise<MediaPeople> {
  const parsed = getId(id);
  if (parsed.provider === 'tmdb') {
    const type = parsed.mediaType === 'series' ? 'tv' : 'movie';
    const endpoint = parsed.mediaType === 'series' ? 'aggregate_credits' : 'credits';
    return normalizeTmdbPeople(
      await providerRequest('tmdb', `/${type}/${parsed.value}/${endpoint}?language=en-US`, signal),
    );
  }
  // The shared client spaces these starts to respect the public service's rate limit.
  const [characters, staff] = await Promise.all([
    providerRequest('jikan', `/anime/${parsed.value}/characters`, signal),
    providerRequest('jikan', `/anime/${parsed.value}/staff`, signal),
  ]);
  return normalizeAnimePeople(characters, staff);
}

export function normalizeAnimeRecommendations(input: unknown): Movie[] {
  const titles = list(object(input).data).flatMap((value): Movie[] => {
    const entry = object(object(value).entry);
    const id = integer(entry.mal_id);
    const title = text(entry.title);
    if (!id || !title) return [];
    const image = object(object(entry.images).jpg);
    return [
      {
        id: `jikan-${id}`,
        provider: 'jikan',
        title,
        posterUrl: safeUrl(image.large_image_url) ?? safeUrl(image.image_url) ?? null,
        // Recommendations do not supply these fields. Details resolve them on open.
        overview: '',
        year: null,
        rating: null,
        genres: [],
        sourceUrl: `https://myanimelist.net/anime/${id}`,
      },
    ];
  });
  return unique(titles).slice(0, 12);
}

export async function fetchSimilarMedia(id: string, signal?: AbortSignal): Promise<Movie[]> {
  const parsed = getId(id);
  if (parsed.provider === 'jikan')
    return normalizeAnimeRecommendations(
      await providerRequest('jikan', `/anime/${parsed.value}/recommendations`, signal),
    ).filter((movie) => movie.id !== id);
  const type = parsed.mediaType === 'series' ? 'tv' : 'movie';
  const response = await providerRequest(
    'tmdb',
    `/${type}/${parsed.value}/recommendations?language=en-US&page=1`,
    signal,
  );
  return unique(
    list(object(response).results)
      .map((item) => normalizeTmdb(item, parsed.mediaType ?? 'movie'))
      .filter((movie): movie is Movie => !!movie && movie.id !== id),
  ).slice(0, 12);
}

export async function fetchSeriesSeasons(id: string, signal?: AbortSignal): Promise<Season[]> {
  const parsed = getId(id);
  if (parsed.provider === 'jikan') {
    const entry = await fetchMovie(id, signal);
    // MAL catalogs sequels as separate entries. Never invent franchise seasons.
    return entry.mediaType === 'series'
      ? [
          {
            number: 1,
            name: entry.title,
            episodeCount: entry.episodeCount,
            posterUrl: entry.posterUrl,
          },
        ]
      : [];
  }
  if (parsed.mediaType !== 'series') return [];
  const response = await providerRequest('tmdb', `/tv/${parsed.value}?language=en-US`, signal);
  const seasons = list(object(response).seasons).flatMap((value): Season[] => {
    const item = object(value);
    const number = integer(item.season_number, 0);
    const name = text(item.name);
    if (number === undefined || !name) return [];
    return [
      {
        number,
        name,
        episodeCount: integer(item.episode_count, 0),
        overview: text(item.overview) || undefined,
        posterUrl: tmdbImage(item.poster_path, 'w500'),
      },
    ];
  });
  return [...new Map(seasons.map((season) => [season.number, season])).values()].sort(
    (a, b) => a.number - b.number,
  );
}

export function normalizeAnimeEpisodes(
  input: unknown,
  id: string,
  requestedPage: number,
): EpisodePage {
  const response = object(input);
  const pagination = object(response.pagination);
  if (typeof pagination.has_next_page !== 'boolean')
    throw new ApiError('The service returned incomplete episode information.', {
      kind: 'invalid-response',
    });
  const episodes = list(response.data).flatMap((value): Episode[] => {
    const item = object(value);
    const number = integer(item.mal_id);
    const title = text(item.title);
    if (!number || !title) return [];
    return [
      {
        id: `${id}-episode-${number}`,
        number,
        title,
        overview: text(item.synopsis) || undefined,
        airDate: text(item.aired) || undefined,
        rating: rating(item.score, 5),
      },
    ];
  });
  return {
    episodes: unique(episodes),
    nextPage: pagination.has_next_page ? requestedPage + 1 : undefined,
  };
}

export async function fetchSeasonEpisodes(
  id: string,
  seasonNumber: number,
  page = 1,
  signal?: AbortSignal,
): Promise<EpisodePage> {
  const parsed = getId(id);
  if (integer(seasonNumber, 0) === undefined || integer(page) === undefined)
    throw new ApiError('This season or page is invalid.', { status: 400 });
  if (parsed.provider === 'jikan') {
    if (seasonNumber !== 1)
      throw new ApiError('This catalog entry has no separate seasons.', { status: 400 });
    return normalizeAnimeEpisodes(
      await providerRequest('jikan', `/anime/${parsed.value}/episodes?page=${page}`, signal),
      id,
      page,
    );
  }
  if (parsed.mediaType !== 'series') return { episodes: [] };
  if (page !== 1) return { episodes: [] };
  const response = await providerRequest(
    'tmdb',
    `/tv/${parsed.value}/season/${seasonNumber}?language=en-US`,
    signal,
  );
  const episodes = list(object(response).episodes).flatMap((value): Episode[] => {
    const item = object(value);
    const number = integer(item.episode_number);
    const episodeId = integer(item.id);
    const title = text(item.name);
    if (!number || !episodeId || !title) return [];
    return [
      {
        id: `tmdb-episode-${episodeId}`,
        number,
        title,
        overview: text(item.overview) || undefined,
        airDate: text(item.air_date) || undefined,
        rating: rating(item.vote_average),
      },
    ];
  });
  return { episodes: unique(episodes) };
}
