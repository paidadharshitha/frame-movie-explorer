# Frame

A React Native movie explorer for discovering, searching, and saving films on a phone, including on unreliable mobile connections.

## Audience and purpose
Movie lovers choosing something to watch, and reviewers evaluating a working app. The user prioritizes functionality, clear structure, smooth UX, and sensible state management. No authentication is needed.

## Product requirements
Popular movies with infinite pagination and pull-to-refresh; debounced search; navigable details with poster, numeric rating, and overview; persistent favourites in a separate tab; loading, empty, and recoverable error states; useful behavior after the network drops.

## Stack
Expo, React Native, TypeScript, Expo Router, TanStack Query, AsyncStorage. Android is the primary target, with iOS support and a responsive web preview. A live Jikan-compatible movie-only anime catalog works without keys. An optional TMDB token enables general cinema. The default catalog must be clearly identified as animated films. Never invent ratings or show fake live data.

## Experience
Phone-first browsing with prominent real posters, legible titles, clear ratings, and quick save actions. Returning users should retain favourites and cached films after a cold launch. Slow networks should preserve the current screen, explain failures, and allow recovery.

## Deliverables
Working app, readable source, meaningful tests, README, GitHub repository, plus a runnable Expo entry point or a short screen recording. Publishing depends on available connected account access; never claim unbuilt binaries or untested device behavior.
