# Validation record

This record distinguishes completed checks from scenarios that still need a native device or an authenticated build environment. The app was exercised with the live Tenrai animated-film catalog. TMDB adapter tests used mocked responses.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run format:check` | Passed |
| `npm test` | 67 tests passed |
| `npm run export:web` | Production web export passed |
| `npm run export:android` | Android Hermes JavaScript export passed |

The unit suite covers provider normalization, pagination, malformed API responses, dropped connections, timeouts, cancellation, retry limits, connectivity events, favourites/watchlist hydration, serialized writes, failed storage recovery, corrupted records, Undo timestamp preservation, and bounded query persistence. Discovery tests cover combined filters, unrated films, genre affinity, watched-film exclusion, repeat avoidance, and empty candidate pools. These tests use controlled responses and storage failures; they do not replace an end-to-end airplane-mode test.

Local community tests also cover normalized demo-profile identity, session restoration, comment length and movie-ID validation, spoiler flags, own-comment mutation guards, Undo, ordered rapid writes, corrupt envelope preservation, and failed storage recovery. This feature provides device-only demo identity, not real authentication.

An Android JavaScript export verifies bundling. It does not produce an installable APK or demonstrate native runtime behavior.

## Browser verification

The interface was checked at **390 × 844** and **1280 × 900**, with the new filter controls also checked at **319 × 760**. These are browser preview dimensions, not native-device runs.

| Scenario | Observed result |
| --- | --- |
| Popular and top-rated lists | Both displayed live catalog results |
| Infinite scroll | Page two loaded, including a Haruhi film |
| Refresh | Existing content remained visible during refresh |
| Movie details | Poster, rating, and synopsis displayed for the selected movie |
| Add favourites | Four movies were saved |
| Persistence | All four saved movies remained after a full browser reload |
| Search | `Spirited` returned two live results |
| Empty search | An unlikely `zzz` query displayed the no-results state |
| Favourites sorting | A–Z sorting worked |
| Surprise me | The featured film changed to a pick with an explanation based on favourite genres |
| Watchlist saving | The Garden of Words was added to Planned from its detail screen |
| Watched history | Marking that film watched moved it into Watched with a date |
| Remove and Undo | Undo restored the removed entry with its watched status and date |
| Watchlist persistence | The watched entry remained after a full browser reload |
| Watchlist layouts | Two planned films and one watched film displayed correctly in phone and desktop layouts |
| Hide watched | The loaded collection changed from 48 to 47 matching films |
| Combined filters | Fantasy, rated 8+, and hide watched produced 14 matches from 48 loaded films |
| Demo sign-in | Empty name and malformed email showed validation; valid details returned to the previous screen |
| Comment shortcut | The detail-screen comment button scrolled to the discussion/composer |
| Posting | A comment appeared under the local profile, and the composer cleared |
| Comment removal and Undo | The removed comment returned with its original author and timestamp |
| Spoilers | A spoiler comment stayed hidden until revealed, could be hidden again, and was hidden after reload |
| Session and comment persistence | The local sign-in and two comments survived a full browser reload |
| Sign-out and return | Guests could read comments but had no deletion controls; signing back in with a case-varied version of the same email restored ownership |

Login was inspected at 390 × 844 and 319 × 760. Profile and comment views were inspected at phone size, and the discussion at 1280 × 900. Synthetic demo data (`Movie Fan`, `cinema@example.com`) was used for these checks; no real account or shared comment service was contacted.

Login/comment captures: [sign-in](screenshots/login.jpg), [compact sign-in](screenshots/login-small.jpg), [profile](screenshots/profile.jpg), [comments](screenshots/comments.jpg), and [desktop discussion](screenshots/comments-desktop.jpg).

Current screenshots: [Discover](screenshots/discover-v2.jpg), [filters](screenshots/filters.jpg), [compact phone filters](screenshots/filters-small.jpg), [Watchlist](screenshots/watchlist.jpg), [watchlist controls in details](screenshots/watchlist-controls.jpg), [desktop Watchlist](screenshots/watchlist-desktop.jpg), and [desktop Discover](screenshots/desktop-v2.jpg). Earlier core-flow captures remain available for [details](screenshots/details.jpg), [search](screenshots/search.jpg), [favourites](screenshots/favourites.jpg), and [empty search](screenshots/empty-search.jpg).

The [original two-minute recording](frame-demo.mp4) predates the discovery, filter, watchlist, and local login/comment additions. It captures the core phone-sized web experience at 4 fps with inactive gaps compressed; it is not a native APK demonstration. Screenshots capture individual moments, so counts can differ from later persistence checks.

## Not completed

- **Native device or emulator run:** no Android emulator was available; the local iOS simulator was blocked by the Xcode license setup.
- **Airplane-mode end-to-end test:** not run. Network transitions, retries, and storage failure handling have unit coverage; native cold-launch behavior still needs the manual checklist.
- **APK / hosted Expo build:** not produced. Expo was not signed in. An EAS preview profile and build instructions are included in the README.
- **Live TMDB requests:** not run without a token. Normalization, provider switching, and request contracts were tested with mocks.
- **Screen-reader and large-text audit:** not completed on native devices.

Use [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) to complete the device, accessibility, and network-failure scenarios. Its unchecked items are planned tests, not unreported passes.

## Dependency audit

`npm audit` reported unresolved upstream tooling advisories involving **node-forge 1.4.0** and the **Expo CLI's transitive Zod 3 dependency chain**, including high-severity findings. A patched node-forge release was not available at the check. No forced downgrade or incompatible dependency override was applied. These findings remain open and should be revisited when upstream fixes are published.
