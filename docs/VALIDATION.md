# Validation record

This record distinguishes completed checks from scenarios that still need a native device or an authenticated build environment. The app was exercised with the live Tenrai animated-film catalog. TMDB adapter tests used mocked responses.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run format:check` | Passed |
| `npm test` | 34 tests passed |
| `npm run export:web` | Production web export passed |
| `npm run export:android` | Android Hermes JavaScript export passed |

The unit suite covers provider normalization, pagination, malformed API responses, dropped connections, timeouts, cancellation, retry limits, connectivity events, favourites hydration, serialized writes, failed storage recovery, corrupted records, and bounded query persistence. These tests use controlled responses and storage failures; they do not replace an end-to-end airplane-mode test.

An Android JavaScript export verifies bundling. It does not produce an installable APK or demonstrate native runtime behavior.

## Browser verification

The interface was checked at **390 × 844** and **1280 × 900**, with an additional initial layout check at **319 px** width.

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

Screenshots: [Discover](screenshots/home.jpg), [details](screenshots/details.jpg), [search](screenshots/search.jpg), [favourites](screenshots/favourites.jpg), [empty search](screenshots/empty-search.jpg), and [desktop](screenshots/desktop.jpg).

The [two-minute recording](frame-demo.mp4) is a silent capture of the actual phone-sized web preview, recorded at 4 fps with inactive gaps compressed. It is evidence of the web experience, not a native APK demonstration. The screenshots capture individual moments; their saved-movie counts may differ from the later four-movie persistence check.

## Not completed

- **Native device or emulator run:** no Android emulator was available; the local iOS simulator was blocked by the Xcode license setup.
- **Airplane-mode end-to-end test:** not run. Network transitions, retries, and storage failure handling have unit coverage; native cold-launch behavior still needs the manual checklist.
- **APK / hosted Expo build:** not produced. Expo was not signed in. An EAS preview profile and build instructions are included in the README.
- **Live TMDB requests:** not run without a token. Normalization, provider switching, and request contracts were tested with mocks.
- **Screen-reader and large-text audit:** not completed on native devices.

Use [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) to complete the device, accessibility, and network-failure scenarios. Its unchecked items are planned tests, not unreported passes.

## Dependency audit

`npm audit` reported unresolved upstream tooling advisories involving **node-forge 1.4.0** and the **Expo CLI's transitive Zod 3 dependency chain**, including high-severity findings. A patched node-forge release was not available at the check. No forced downgrade or incompatible dependency override was applied. These findings remain open and should be revisited when upstream fixes are published.
