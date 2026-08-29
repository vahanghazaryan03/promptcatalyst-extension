# Prompt Catalyst — browser extension

Chrome and Firefox extension for writing image and video prompts. Published as
[Prompt Catalyst](https://chromewebstore.google.com/detail/prompt-catalyst/hehieakgdbakdajfpekgmfckplcjmgcf)
on the Chrome Web Store and on
[Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/prompt-catalyst/).

Talks to the API at `https://promptcatalyst.ai/api`; authentication is Supabase.

## Layout

```
manifest.json           Chrome (MV3). Carries `key`, which pins the extension ID.
manifest.firefox.json   Firefox (MV3). Background scripts rather than a worker.
scripts/pc-config.js    API base, Supabase URL and anon key, storage keys.
scripts/pc-auth.js      The Supabase session: sign in/up/out, Google, refresh.
scripts/pc-api.js       Request helper and error classification.
scripts/popup.js        The extension itself. One large file; see HANDOFF.md.
scripts/background.js   Service worker (Chrome) / event page (Firefox).
tools/build.js          Produces the store packages.
```

## Build

```bash
node tools/build.js
```

Writes `dist/chrome/` and `dist/firefox/` plus a zip of each. Requires nothing
installed — it shells out to PowerShell for the zip.

The two builds differ in more than the manifest name: Firefox needs its own
manifest copied over `manifest.json`, and the Chrome upload has the `key` field
stripped. Do not hand-zip the folder; it would ship `screenshots/` (5 MB of store
listing images) and give Firefox the wrong manifest.

## Load it locally

**Chrome** — `chrome://extensions` → Developer mode → Load unpacked → this
folder. It loads as `hehieakgdbakdajfpekgmfckplcjmgcf`, the published ID, because
of the `key` field. That is deliberate: Google sign-in resolves against
`https://<id>.chromiumapp.org/`, which is allow-listed in Supabase, so signing in
works in development exactly as it does in production.

Recent Chrome has removed `--load-extension`, so command-line loading needs
Chrome for Testing.

**Firefox** — build first, then `about:debugging` → This Firefox → Load Temporary
Add-on → `dist/firefox/manifest.json`.

## Releasing

Bump `version` in **both** manifests, `node tools/build.js`, then upload
`dist/prompt-catalyst-chrome-<version>.zip` to the Chrome Web Store dashboard and
`dist/prompt-catalyst-firefox-<version>.zip` to AMO.

`HANDOFF.md` records how the auth and credit handling work, and why.
