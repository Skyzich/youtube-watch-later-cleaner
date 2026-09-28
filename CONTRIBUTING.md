# Contributing

Contributions that improve compatibility, safety, language detection, testability, or documentation are welcome.

## Project scope

The project is intentionally limited to helping a signed-in user manage **their own Watch Later playlist** through visible YouTube UI controls.

Please do not submit changes whose purpose is to:

- bypass authentication, CAPTCHA, access controls, rate limits, or anti-abuse mechanisms;
- hide or disguise automation from YouTube;
- access other users' accounts or private data;
- collect passwords, cookies, authentication tokens, or other credentials;
- automate engagement manipulation (views, likes, subscribers, comments, etc.);
- mass-operate multiple accounts;
- add telemetry, advertising, or unrelated data collection.

## Bug reports

Please include:

- script version;
- browser and browser version;
- operating system;
- YouTube interface language;
- whether `playlist?list=WL` was open;
- the exact visible text of the menu item that should remove a video from Watch Later;
- relevant console messages.

Do **not** post cookies, passwords, tokens, email addresses, account IDs, or other private data.

## Language additions

Language matching is intentionally strict. A rule should identify both:

1. a removal concept; and
2. the localized Watch Later name.

This reduces the risk of clicking a different menu item.

## Code changes

Keep the project dependency-free and readable as a single console script. Prefer visible UI automation with verification after every removal. Avoid external network calls, telemetry, analytics, credential/storage access, or bypass techniques.

## Terms and responsible use

Changes should remain consistent with [`DISCLAIMER.md`](DISCLAIMER.md). Contributors should not present the project as approved, authorized, endorsed, or supported by YouTube or Google.
