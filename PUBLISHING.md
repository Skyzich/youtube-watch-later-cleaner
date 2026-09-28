# Publishing this project on GitHub

These instructions assume you want to publish the repository as public open source under the MIT License.

## Recommended repository settings

- **Repository name:** `youtube-watch-later-cleaner`
- **Description:** `Fast adaptive console cleaner for your own YouTube Watch Later playlist. Unofficial and open source.`
- **Visibility:** Public (or Private first, if you want to review everything before publishing)
- **Initialize repository:** Do **not** add a README, `.gitignore`, or license in GitHub's creation form, because this project already contains those files.

## Upload using the GitHub website

1. Sign in to GitHub.
2. Click the **+** menu in the upper-right corner and choose **New repository**.
3. Choose the owner, enter the repository name and description, and select visibility.
4. Leave the README, `.gitignore`, and license initialization options unchecked.
5. Click **Create repository**.
6. On the empty repository page, choose the option to **upload an existing file** (or use **Add file → Upload files** if shown).
7. Extract the release ZIP on your computer.
8. Upload the **contents of the project folder**, including the hidden `.github` folder. Do not upload the outer ZIP as the only repository file.
9. Use a commit message such as `Initial release v1.1.0`.
10. Commit directly to `main` for a personal first release, or create a branch if you prefer review before merging.

## After upload

1. Confirm that the repository root shows `README.md`, `LICENSE`, `watch-later-cleaner.js`, `DISCLAIMER.md`, and the other project files.
2. Open `watch-later-cleaner.js` on GitHub and verify that the header says `Version: 1.1.0`.
3. Check the **Issues** tab. The included bug-report template should appear when creating a new issue.
4. Optional: create a GitHub Release tagged `v1.1.0` and attach the release ZIP.
5. If you create a release, use the contents of `RELEASE.txt` as a starting point for the release notes.

## Suggested About section

**Description:**  
`Fast adaptive console cleaner for your own YouTube Watch Later playlist. Unofficial and open source.`

**Topics:**  
`youtube`, `watch-later`, `javascript`, `devtools`, `playlist`, `automation`

Avoid descriptions such as "undetectable bot", "bypass YouTube limits", or claims that the project is approved by YouTube.

## Before making the repository public

- Read `README.md` and `DISCLAIMER.md` once in the rendered GitHub view.
- Confirm that no personal files, browser data, tokens, or account information are present.
- Confirm that the source does not contain secrets.
- Keep the repository's purpose limited to a user's own Watch Later playlist.
- Review the current YouTube Terms of Service: <https://www.youtube.com/static?template=terms>

GitHub's official repository-creation documentation:  
<https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository>
