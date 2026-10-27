# Two-minute native Frame demo

[Watch the current recording](frame-native-demo.mp4) · [Native validation evidence](VALIDATION.md#standalone-android-apk--october-27-2026)

This is an **actual native Android recording**, made on October 27, 2026 from the submitted standalone APK: source `69cd1dc3def1e1edbb41eb99ce7dd160c384b840`, GitHub Actions build `40483623767`. It runs on an Android 15 / API 35 arm64 emulator at 720×1600, 320 dpi, using the live, key-free Tenrai animated movie and series catalog. Metro and Expo Go are not required by this APK.

The file is exactly **120 seconds**, silent H.264 / yuv420p at 30 fps, approximately 6.1 MB. It retains the first 120 seconds of a 131.42-second native screen capture. Only trailing footage was trimmed; there are no scene cuts or speed changes. The variable-frame-rate capture was encoded at a regular 30 fps for playback compatibility, not to claim a measured app frame rate.

## Chapters in the supplied recording

Times are rounded from the [recorded action timestamps](native-evidence/recording-events.json). The final screen is held through the end of the two minutes.

| Time      | Visible flow                                                                             |
| --------- | ---------------------------------------------------------------------------------------- |
| 0:00–0:09 | Discover in Dark appearance; scroll the live movie feed                                  |
| 0:09–0:20 | Open Search, type `Your Name`, dismiss the Android keyboard with Back, and open a result |
| 0:20–0:30 | Your Name poster, metadata and community score; save to favourites                       |
| 0:30–0:38 | Give Your Name a personal four-star rating; it becomes watched                           |
| 0:38–0:44 | Add the title to the existing Weekend watch collection                                   |
| 0:44–0:59 | Open Library and the collection containing Your Name and Spirited Away                   |
| 0:59–1:05 | Show Your ratings                                                                        |
| 1:05–1:13 | Show cinema Stats: two watched movies, two ratings and a 4.5/5 personal average          |
| 1:13–1:26 | Open the guest account screen, scroll to Appearance and switch to Light                  |
| 1:26–1:43 | Return to Discover, switch to Series and browse the real animated series catalog         |
| 1:43–2:00 | Open Favourites in Light appearance, showing the two saved movies                        |

The library is deliberate test data created through app interactions. Spirited Away and the Weekend watch collection existed from the native validation steps; Your Name is saved, rated and added during the recording. No claim is made that these test ratings represent the owner's viewing history.

## What this clip does not demonstrate

Offline restart, reconnection, System appearance changes, cast and episode details were tested separately and have screenshots in [VALIDATION.md](VALIDATION.md). They are not shown in this clip. The recording does not demonstrate TMDB language filters, movie playback, server authentication, a physical Android phone, or a full accessibility/performance audit.

The user chose to proceed with the key-free catalog. Telugu/Hindi/English original-language browsing remains implemented behind TMDB configuration and is not presented as live-verified here.

## Recording checks

The encoded MP4 was checked for its 120.00-second duration, 720×1600 dimensions, H.264/yuv420p encoding, 30 fps and fast-start ordering. Representative frames at 0, 20, 32, 42, 53, 67, 81, 97 and 110 seconds were inspected against the intended flow. [Recording metadata](native-evidence/recording.json) includes the file checksum and size.

The [older Frame video](frame-demo.mp4) is a historical, edited phone-sized web-preview baseline. It predates the expanded app and is not the current submission recording.
