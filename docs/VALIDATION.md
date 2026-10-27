# Validation record

This record distinguishes completed checks from scenarios that still need a native device or an authenticated build environment. The app was exercised with the live Tenrai animated movie and series catalog. TMDB adapter tests used mocked responses.

## Automated checks

| Check                    | Result                                  |
| ------------------------ | --------------------------------------- |
| `npm run typecheck`      | Passed                                  |
| `npm run lint`           | Passed                                  |
| `npm run format:check`   | Passed                                  |
| `npm test`               | 123 tests passed                        |
| `npm run export:web`     | Production web export passed            |
| `npm run export:android` | Android Hermes JavaScript export passed |

The unit suite covers provider normalization, pagination, malformed API responses, dropped connections, timeouts, cancellation, retry limits, connectivity events, favourites/watchlist hydration, serialized writes, failed storage recovery, corrupted records, Undo timestamp preservation, and bounded query persistence. Discovery tests cover combined filters, unrated films, genre affinity, watched-film exclusion, repeat avoidance, and empty candidate pools. These tests use controlled responses and storage failures; they do not replace an end-to-end airplane-mode test.

Local community tests also cover normalized demo-profile identity, session restoration, comment length and movie-ID validation, spoiler flags, own-comment mutation guards, Undo, ordered rapid writes, corrupt envelope preservation, and failed storage recovery. This feature provides device-only demo identity, not real authentication.

An Android JavaScript export verifies bundling. It does not produce an installable APK or demonstrate native runtime behavior.

## Browser verification

The interface was checked at **390 × 844** and **1280 × 900**, with the new filter controls also checked at **319 × 760**. These are browser preview dimensions, not native-device runs.

| Scenario                        | Observed result                                                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Popular and top-rated lists     | Both displayed live catalog results                                                                                                      |
| Infinite scroll                 | Page two loaded, including a Haruhi film                                                                                                 |
| Refresh                         | Existing content remained visible during refresh                                                                                         |
| Movie details                   | Poster, rating, and synopsis displayed for the selected movie                                                                            |
| Add favourites                  | Four movies were saved                                                                                                                   |
| Persistence                     | All four saved movies remained after a full browser reload                                                                               |
| Search                          | `Spirited` returned two live results                                                                                                     |
| Empty search                    | An unlikely `zzz` query displayed the no-results state                                                                                   |
| Favourites sorting              | A–Z sorting worked                                                                                                                       |
| Surprise me                     | The featured film changed to a pick with an explanation based on favourite genres                                                        |
| Watchlist saving                | The Garden of Words was added to Planned from its detail screen                                                                          |
| Watched history                 | Marking that film watched moved it into Watched with a date                                                                              |
| Remove and Undo                 | Undo restored the removed entry with its watched status and date                                                                         |
| Watchlist persistence           | The watched entry remained after a full browser reload                                                                                   |
| Watchlist layouts               | Two planned films and one watched film displayed correctly in phone and desktop layouts                                                  |
| Hide watched                    | The loaded collection changed from 48 to 47 matching films                                                                               |
| Combined filters                | Fantasy, rated 8+, and hide watched produced 14 matches from 48 loaded films                                                             |
| Demo sign-in                    | Empty name and malformed email showed validation; valid details returned to the previous screen                                          |
| Comment shortcut                | The detail-screen comment button scrolled to the discussion/composer                                                                     |
| Posting                         | A comment appeared under the local profile, and the composer cleared                                                                     |
| Comment removal and Undo        | The removed comment returned with its original author and timestamp                                                                      |
| Spoilers                        | A spoiler comment stayed hidden until revealed, could be hidden again, and was hidden after reload                                       |
| Session and comment persistence | The local sign-in and two comments survived a full browser reload                                                                        |
| Sign-out and return             | Guests could read comments but had no deletion controls; signing back in with a case-varied version of the same email restored ownership |

Login was inspected at 390 × 844 and 319 × 760. Profile and comment views were inspected at phone size, and the discussion at 1280 × 900. Synthetic demo data (`Movie Fan`, `cinema@example.com`) was used for these checks; no real account or shared comment service was contacted.

Login/comment captures: [sign-in](screenshots/login.jpg), [compact sign-in](screenshots/login-small.jpg), [profile](screenshots/profile.jpg), [comments](screenshots/comments.jpg), and [desktop discussion](screenshots/comments-desktop.jpg).

Current screenshots: [Discover](screenshots/discover-v2.jpg), [filters](screenshots/filters.jpg), [compact phone filters](screenshots/filters-small.jpg), [Watchlist](screenshots/watchlist.jpg), [watchlist controls in details](screenshots/watchlist-controls.jpg), [desktop Watchlist](screenshots/watchlist-desktop.jpg), and [desktop Discover](screenshots/desktop-v2.jpg). Earlier core-flow captures remain available for [details](screenshots/details.jpg), [search](screenshots/search.jpg), [favourites](screenshots/favourites.jpg), and [empty search](screenshots/empty-search.jpg).

The [original two-minute recording](frame-demo.mp4) predates the discovery, filter, watchlist, and local login/comment additions. It captures the core phone-sized web experience at 4 fps with inactive gaps compressed; it is not a native APK demonstration. Screenshots capture individual moments, so counts can differ from later persistence checks.

## Expanded cinema library — October 27, 2026

The six-feature extension passed TypeScript, ESLint, formatting, 123 unit tests, web production export, and Android Hermes export. The Android bundle is not a native device run or APK. The added `expo-system-ui` dependency and automatic appearance configuration support the System theme choice in native builds.

| Scenario               | Observed result                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movie/series selector  | Movies and TV series returned separate live Tenrai feeds; series cards and details identify the type                                                      |
| Series search          | A debounced `Frieren` search returned three real series entries                                                                                           |
| Cast and crew          | Attack on Titan showed real directors and Japanese voice actors with images                                                                               |
| Related titles         | More like this displayed live recommendation cards; incomplete recommendation snapshots require opening details before saving                             |
| Episode browsing       | Attack on Titan showed 25 real episodes; page 1 rendered 20 and page 2 rendered the remaining five, with Next disabled at the end                         |
| Personal rating        | Four stars appeared immediately, marked the title watched, and remained in Your ratings after a full reload                                               |
| Custom collections     | Created Weekend watch from details, added a series, renamed it Weekend stories, removed/restored membership, and restored the entire collection with Undo |
| Collection persistence | Renamed collection and restored membership survived a full browser reload                                                                                 |
| Cinema stats           | Counts, movie/series split, genre frequency, and 4.0/5 personal average reflected the test actions and existing watch history                             |
| Appearance             | Light and dark applied throughout navigation, cards, fields, details, and Library; dark preference survived reload                                        |
| Existing data          | Existing favourites, watchlist items, and demo profile remained present after the changes                                                                 |

Screenshots were inspected at 390×844, 319×760, and 1280×900. A fresh reviewer inspected the screenshots and source, requested a 48×48 Retry/Undo target, then scored that fix **resolved** with **ship at web-preview scope**. No native-device sign-off is claimed. Temporary test ratings, watched entry, and collection were removed after verification; screenshot counts represent the test session.

New captures: [light Discover](screenshots/discover-light.jpg), [series](screenshots/series.jpg), [Library](screenshots/personal-library.jpg), [ratings](screenshots/ratings.jpg), [stats](screenshots/cinema-stats.jpg), [cast](screenshots/cast.jpg), [episodes](screenshots/episodes.jpg), [compact collection](screenshots/collection-small.jpg), [collection Undo](screenshots/collection-undo.jpg), and [desktop Library](screenshots/desktop-library.jpg).

New tests cover TMDB movie/TV ID isolation, original-language discovery/search paging, credits, recommendations, season/episode normalization, alternative anime detail types, personal rating bounds, collection validation/Undo, corrupted storage preservation, serialized writes/recovery, real derived stats, theme preference/contrast, legacy saved-film compatibility, and separate movie/series comment persistence. Live Tenrai requests confirmed recommendations can include ONA titles such as Cyberpunk: Edgerunners; those detail links now normalize correctly.

TMDB language controls are implemented but live verification remains deferred: the user chose the key-free catalog for this submission. Anime seasons are independent catalog entries; missing provider information is shown as unavailable. The native Android checks below extend this earlier web-preview review.

## Standalone Android APK — October 27, 2026

The exact APK from [GitHub Actions run 40483623767](https://github.com/paidadharshitha/frame-movie-explorer/actions/runs/40483623767), source commit `69cd1dc3def1e1edbb41eb99ce7dd160c384b840`, was installed and launched on an isolated **Android 15 / API 35 arm64 emulator at 720×1600 pixels and 320 dpi**. It runs its bundled JavaScript without Metro or Expo Go and uses the live Tenrai catalog. This is a native emulator run, not a physical-phone test.

The standalone `arm64-v8a` release variant is development-signed for review. Its minimum Android API is 24, target API is 36, and compile API is 37. APK SHA-256:

```text
e6392ffab70baa023fd61f1010f69238df30e3761649e064510f0ea3687b4d49
```

| Scenario                           | Observed result                                                                                                                                                                                                                                    | Evidence                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Standalone launch                  | Installed APK opened and displayed live Tenrai movie data                                                                                                                                                                                          | [Movie details](native-evidence/movie-details.png)                                                                     |
| Repeated scrolling / pagination    | Fourteen swipes reached additional titles, including Fullmetal Alchemist the Movie: Conqueror of Shamballa                                                                                                                                         | [Pagination](native-evidence/pagination.png)                                                                           |
| Native search and keyboard         | Searching `Spirited` returned two results; the Android keyboard appeared; Back dismissed it while keeping the results                                                                                                                              | [Keyboard](native-evidence/search-keyboard.png), [results](native-evidence/search-results.png)                         |
| Movie detail                       | The selected title displayed its actual metadata                                                                                                                                                                                                   | [Details](native-evidence/movie-details.png)                                                                           |
| Personal rating and watch history  | Setting four stars marked the title watched; Stats showed one watched title                                                                                                                                                                        | [Stats](native-evidence/stats.png)                                                                                     |
| Collection and favourite           | Weekend watch contained one title, and one favourite was saved                                                                                                                                                                                     | [Created collection](native-evidence/collection-created.png), [Library](native-evidence/library.png)                   |
| Offline restart                    | Airplane mode was enabled and Wi-Fi/mobile data were disabled; the app was force-stopped and relaunched; the saved favourite remained available with offline feedback                                                                              | [Offline favourites](native-evidence/offline-restart-favourites.png)                                                   |
| Saved detail after offline restart | Spirited Away's poster, overview, four-star personal rating and collection membership were restored                                                                                                                                                | [Saved detail](native-evidence/offline-saved-detail.png), [collection](native-evidence/offline-collection.png)         |
| Offline personal action            | The personal rating changed from four to five while offline                                                                                                                                                                                        | [Offline rating](native-evidence/offline-rating.png)                                                                   |
| Offline rating persistence         | A second force-stop/relaunch while still offline restored the five-star rating in Your ratings                                                                                                                                                     | [Rating after restart](native-evidence/offline-rating-restart.png)                                                     |
| Uncached search offline            | Search displayed “Reconnect to search this collection.” instead of a misleading empty-result state                                                                                                                                                 | [Offline search](native-evidence/offline-search.png)                                                                   |
| Reconnection                       | Airplane mode was disabled and Wi-Fi/mobile data restored; a fresh `Your Name` search loaded two live results without an app restart                                                                                                               | [Reconnected search](native-evidence/reconnected-search.png)                                                           |
| Detail Back navigation             | Android Back returned from a title detail to the same search results                                                                                                                                                                               | [Search results](native-evidence/search-results.png)                                                                   |
| Pull-to-refresh                    | Refreshing the home feed kept already loaded cards visible                                                                                                                                                                                         | [Refresh](native-evidence/pull-refresh.png)                                                                            |
| Series catalog                     | Switching Movies to Series loaded live titles including Attack on Titan and Death Note                                                                                                                                                             | [Series](native-evidence/series.png)                                                                                   |
| Native cast and episode details    | Attack on Titan showed director Araki, Tetsurou and actual first-page episode rows, including episodes 1–4, for its 25-episode catalog entry                                                                                                       | [Cast](native-evidence/cast.png), [episodes](native-evidence/episodes.png)                                             |
| Light appearance                   | Selecting Light applied the light palette on the observed native screen                                                                                                                                                                            | [Light appearance](native-evidence/appearance-light.png)                                                               |
| System appearance                  | In System mode, changing Android's night mode to yes changed the app to dark, and changing it to no changed the app to light in place                                                                                                              | [System dark](native-evidence/appearance-system-dark.png), [System light](native-evidence/appearance-system-light.png) |
| Theme persistence                  | Selecting fixed Dark, force-stopping and relaunching restored Dark                                                                                                                                                                                 | [Theme after restart](native-evidence/theme-restart.png)                                                               |
| Runtime error inspection           | The inspected `AndroidRuntime:E` and `ReactNativeJS:E` log output was empty during this test session                                                                                                                                               | Session log inspection; this is not a guarantee that every path is error-free                                          |
| Limited larger-text check          | At Android font scale 1.3, Library and Stats content and essential controls remained readable. Bottom Watchlist/Favourites labels were visually ellipsized; full accessibility labels remained available. Font scale was restored to 1.0 afterward | [Library at 1.3](native-evidence/large-text-library.png), [Stats at 1.3](native-evidence/large-text-stats.png)         |

These observations establish the listed native browsing, keyboard, Back, refresh, appearance and offline saved-data paths. They do not establish every checklist item, frame-rate performance, a fresh installation without connectivity, or persistence after uninstalling the app. The verified native recording below is the current submission demo; the older video remains a historical web baseline.

## Latest native recording

[frame-native-demo.mp4](frame-native-demo.mp4) is an actual screen recording of the same standalone Android APK and emulator described above. It is **120.00 seconds, 720×1600, H.264 High / yuv420p, 30 fps, silent, 6,120,011 bytes**, with fast-start metadata verified before the media payload. SHA-256: `a2bb06e9d26ba38c30f523ca36e25ff94e81c25748279e2d8293857769f3573a`.

The raw capture was 131.42 seconds. The first 120 seconds were retained, preserving the original action sequence and speed; only the tail was trimmed. Variable-frame-rate screenrecord output was normalized to 30 fps. This encoding rate is not a measurement of app rendering performance.

Representative frames at 0, 20, 32, 42, 53, 67, 81, 97 and 110 seconds were inspected. They show Discover, Your Name details, the saved four-star rating, collection membership, the two-title Weekend watch collection, two watched movies with a 4.5/5 personal average, Light appearance, series browsing, and two favourites. No environment file, credentials or real profile information appears in these frames. The [recording metadata and action timestamps](native-evidence/recording.json) and [chapter list](DEMO_SCRIPT.md) accompany the clip.

The video does **not** demonstrate offline behavior, full episode pagination, TMDB language browsing, playback, real authentication or a physical Android device. Offline and system-appearance tests are documented separately above. Demo-library changes are explicit test interactions; counts in the recording differ from earlier one-title test screenshots.

## Not completed

- **Physical Android device and iOS:** not tested. The native evidence above comes from an Android emulator; the earlier local iOS simulator attempt was blocked by Xcode license setup.
- **Additional native network scenarios:** first launch without cached data, throttling, interrupted pagination, automatic resumption of an in-flight request and expired-cache fallbacks remain unverified end to end. Fresh search after reconnection was verified above.
- **Additional native interactions:** broader Back/gesture navigation, full native episode pagination, an all-screen light/dark audit and reduced-motion behavior remain unverified. The specific Back, refresh, first-page episodes and appearance checks above passed.
- **Hosted Expo build:** not produced. The standalone GitHub-built APK is supplied instead; EAS remains an optional build path.
- **Live TMDB requests:** deferred by the user's key-free choice. Normalization, provider switching, and request contracts were tested with mocks.
- **Accessibility audit:** a full TalkBack/VoiceOver and all-screen large-text audit is not complete. The limited 1.3 font-scale check above found bottom-tab label truncation; do not interpret it as an accessibility pass.

Use [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md) to complete the device, accessibility, and network-failure scenarios. Its unchecked items are planned tests, not unreported passes.

## Dependency audit

`npm audit` reported unresolved upstream tooling advisories involving **node-forge 1.4.0** and the **Expo CLI's transitive Zod 3 dependency chain**, including high-severity findings. A patched node-forge release was not available at the check. No forced downgrade or incompatible dependency override was applied. These findings remain open and should be revisited when upstream fixes are published.
