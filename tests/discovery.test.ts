import { describe, expect, it } from 'vitest';
import { availableGenres, chooseSurprise, filterMovies } from '../src/lib/discovery';
import type { Movie } from '../src/types/movie';

function movie(id: number, genres: string[] = [], rating: number | null = null): Movie {
  return {
    id: `jikan-${id}`,
    provider: 'jikan',
    title: `Film ${id}`,
    posterUrl: null,
    overview: 'A story.',
    year: null,
    rating,
    genres,
  };
}

describe('loaded film filters', () => {
  it('lists distinct, non-empty genres in alphabetical order', () => {
    expect(
      availableGenres([
        movie(1, ['Fantasy', ' Drama ', '']),
        movie(2, ['fantasy', 'Adventure', 'DRAMA', ' ']),
      ]),
    ).toEqual(['Adventure', 'Drama', 'Fantasy']);
  });

  it('combines case-insensitive genre and minimum-rating filters', () => {
    const films = [movie(1, ['Fantasy'], 8), movie(2, ['Fantasy'], 6), movie(3, ['Drama'], 9)];
    expect(filterMovies(films, { genre: ' FANTASY ', minimumRating: 7 })).toEqual([films[0]]);
  });

  it('keeps unrated films without a rating filter and excludes them with one', () => {
    const films = [movie(1, [], null), movie(2, [], 0), movie(3, [], 7)];
    expect(filterMovies(films, { genre: null, minimumRating: null })).toEqual(films);
    expect(filterMovies(films, { genre: null, minimumRating: 0 })).toEqual(films.slice(1));
    expect(filterMovies(films, { genre: null, minimumRating: 7 })).toEqual([films[2]]);
  });

  it('returns an empty collection for unmatched filters', () => {
    expect(filterMovies([movie(1, ['Drama'], 9)], { genre: 'Fantasy', minimumRating: 7 })).toEqual(
      [],
    );
    expect(availableGenres([])).toEqual([]);
  });
});

describe('personalised surprise picks', () => {
  const fantasy = movie(1, ['Fantasy'], 8);
  const drama = movie(2, ['Drama'], 8);
  const anotherFantasy = movie(3, ['fantasy'], 8);

  it('returns no pick for an empty catalog or when every film is watched', () => {
    expect(chooseSurprise({ movies: [], favourites: [], watchedIds: [] })).toBeNull();
    expect(
      chooseSurprise({ movies: [fantasy], favourites: [], watchedIds: new Set([fantasy.id]) }),
    ).toBeNull();
  });

  it('excludes watched and already-favourite films when discoveries are available', () => {
    expect(
      chooseSurprise({
        movies: [fantasy, drama, anotherFantasy],
        favourites: [fantasy],
        watchedIds: [drama.id],
        random: () => 0,
      }),
    ).toEqual({
      movie: anotherFantasy,
      reason: 'A little more fantasy, inspired by your favourites.',
    });
  });

  it('weights shared favourite genres more strongly without claiming every pick is personal', () => {
    const input = { movies: [drama, anotherFantasy], watchedIds: [], random: () => 0.3 };
    expect(chooseSurprise({ ...input, favourites: [] })).toEqual({
      movie: drama,
      reason: 'A fresh pick from the films you have loaded.',
    });
    expect(chooseSurprise({ ...input, favourites: [fantasy] })?.movie).toEqual(anotherFantasy);
  });

  it('avoids the previous pick when another discovery is available', () => {
    expect(
      chooseSurprise({
        movies: [fantasy, drama],
        favourites: [],
        watchedIds: [],
        previousId: fantasy.id,
        random: () => 0,
      })?.movie,
    ).toEqual(drama);
  });

  it('still returns the only available film when it was the previous pick', () => {
    expect(
      chooseSurprise({
        movies: [fantasy],
        favourites: [],
        watchedIds: [],
        previousId: fantasy.id,
      })?.movie,
    ).toEqual(fantasy);
  });

  it('falls back to a favourite honestly, but never to a watched favourite', () => {
    const pick = chooseSurprise({
      movies: [fantasy, drama],
      favourites: [fantasy, drama],
      watchedIds: [drama.id],
    });
    expect(pick).toEqual({
      movie: fantasy,
      reason: 'From your favourites. A saved story worth making time for.',
    });
  });

  it('deduplicates candidates so repeated pages do not bias a pick', () => {
    expect(
      chooseSurprise({
        movies: [fantasy, fantasy, drama],
        favourites: [],
        watchedIds: [],
        random: () => 0.6,
      })?.movie,
    ).toEqual(drama);
  });

  it('supports unrated films and random boundary values without returning undefined', () => {
    const films = [movie(1), movie(2)];
    for (const sample of [-1, 0, 0.5, 1, 2, Number.NaN]) {
      expect(
        films.some(
          (film) =>
            film.id ===
            chooseSurprise({ movies: films, favourites: [], watchedIds: [], random: () => sample })
              ?.movie.id,
        ),
      ).toBe(true);
    }
  });
});
