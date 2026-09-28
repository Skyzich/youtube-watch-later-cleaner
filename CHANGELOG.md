# Changelog

All notable changes to this project will be documented here.

The format is based on Keep a Changelog and this project uses semantic versioning.

## [1.1.0] - 2026-09-28

### Changed

- Strengthened the public-release disclaimer and responsible-use language.
- Clarified that the intended scope is management of the user's own Watch Later playlist.
- Added explicit notice that YouTube's Terms may restrict automated access.
- Added console warning that the script does not bypass login, CAPTCHA, access controls, or rate limits.
- Added `DISCLAIMER.md` with platform, trademark, warranty, and Terms guidance.
- Added `PUBLISHING.md` with GitHub publishing instructions.
- Tightened contribution policy against bypass, credential collection, engagement manipulation, and multi-account automation.
- Clarified privacy language as "no third-party network requests initiated by the script."

## [1.0.0] - 2026-09-28

### Added

- First public release.
- User-selectable removal count plus `ALL` mode.
- Fast Adaptive pacing with automatic speed-up after successful removals.
- Failure backoff and automatic safety stop after repeated errors.
- DOM-detachment verification after every removal.
- Short anti-throttle cooldown every 150 successful removals.
- Multi-language Watch Later removal-command detection.
- `SKYZICH_WL.stop()` emergency-stop command.
- `SKYZICH_WL.status()` live status command.
- Privacy and safety banner in the console.
- Page validation so the script only starts on `playlist?list=WL`.
