import { describe, expect, it } from 'vitest';
import { getCinemaStats } from '../src/lib/cinema-stats';
import type { Movie } from '../src/types/movie';
import type { WatchlistEntry } from '../src/state/watchlist-store';
import type { PersonalRating } from '../src/state/library-store';

const movie: Movie = {
  id: 'jikan-1',
  provider: 'jikan',
  title: 'A story',
  posterUrl: null,
  overview: 'A story.',
  year: null,
  rating: null,
  genres: ['Drama', 'Adventure', 'Drama'],
};
const series: Movie = {
  ...movie,
  id: 'tmdb-tv-2',
  provider: 'tmdb',
  mediaType: 'series',
  genres: ['Drama', 'Comedy'],
};
const planned: Movie = { ...movie, id: 'tmdb-3', provider: 'tmdb', genres: ['Horror'] };

describe('cinema stats from actual personal activity', () => {
  it('keeps an unrated empty library honest without an invented average', () => {
    expect(getCinemaStats([], [])).toEqual({
      watchedCount: 0,
      plannedCount: 0,
      watchedMovies: 0,
      watchedSeries: 0,
      ratedCount: 0,
      averageRating: null,
      topGenres: [],
      highestRated: [],
    });
  });

  it('counts watched movies and series, excluding planned genres and duplicates', () => {
    const first: WatchlistEntry = { movie, status: 'watched', addedAt: 1, watchedAt: 2 };
    const entries: WatchlistEntry[] = [
      first,
      { movie: series, status: 'watched', addedAt: 1, watchedAt: 3 },
      { movie: planned, status: 'planned', addedAt: 4 },
      first,
    ];
    const stats = getCinemaStats(entries, []);
    expect(stats).toMatchObject({
      watchedCount: 2,
      plannedCount: 1,
      watchedMovies: 1,
      watchedSeries: 1,
      averageRating: null,
    });
    expect(stats.topGenres).toEqual([
      { name: 'Drama', count: 2 },
      { name: 'Adventure', count: 1 },
      { name: 'Comedy', count: 1 },
    ]);
  });

  it('uses personal stars, sorts tied scores by newest date, and never mutates input', () => {
    const ratings: PersonalRating[] = [
      { movie, value: 5, ratedAt: 1 },
      { movie: series, value: 5, ratedAt: 3 },
      { movie: planned, value: 2, ratedAt: 4 },
    ];
    const stats = getCinemaStats([], ratings);
    expect(stats.averageRating).toBe(4);
    expect(stats.ratedCount).toBe(3);
    expect(stats.highestRated.map(({ movie: title }) => title.id)).toEqual([
      series.id,
      movie.id,
      planned.id,
    ]);
    expect(ratings[0]?.movie.id).toBe(movie.id);
    expect(stats.watchedCount).toBe(0);
  });

  it('limits top lists to five and does not count blank genres', () => {
    const ratings = Array.from({ length: 7 }, (_, index) => ({
      movie: { ...movie, id: `jikan-${index + 1}` },
      value: 5,
      ratedAt: index,
    }));
    const entries: WatchlistEntry[] = ratings.map(({ movie: title }, index) => ({
      movie: { ...title, genres: [`Genre ${index}`, ' ', ''] },
      status: 'watched',
      addedAt: 1,
      watchedAt: 2,
    }));
    const stats = getCinemaStats(entries, ratings);
    expect(stats.highestRated).toHaveLength(5);
    expect(stats.highestRated[0]?.movie.id).toBe('jikan-7');
    expect(stats.topGenres).toHaveLength(5);
    expect(stats.topGenres.every(({ name, count }) => Boolean(name.trim()) && count === 1)).toBe(
      true,
    );
  });
});
