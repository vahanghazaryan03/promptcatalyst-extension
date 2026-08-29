# Extension handoff

Updated 2026-08-30. The extension now runs against the new API; this records how
it is wired, what was verified, and what is still open.

## State: working against the new backend

Every call that used to go to `catalystmedia.ai` now goes to
`https://promptcatalyst.ai/api`, authentication is Supabase, and running out of
credits is handled as `402` rather than `429`. Verified by loading the extension
in Chrome and in Firefox and driving the real flows — see **Verified**, below.

## How it is wired

Three shared files, loaded before everything else, hold what used to be repeated
at thirteen separate fetch sites:

| File | Holds |
|---|---|
| `scripts/pc-config.js` | API base, Supabase URL and anon key, site URL, storage keys |
| `scripts/pc-auth.js` | The Supabase session: sign in/up/out, Google, refresh |
| `scripts/pc-api.js` | `url()`, `headers()`, and the error classification |

They are loaded by `<script>` tags in `popup.html` and by `importScripts` in the
Chrome service worker. Firefox has no `importScripts` in an event page, so its
manifest lists all four background files instead and `background.js` guards the
call.

**API base:** `https://promptcatalyst.ai/api` — one constant in `pc-config.js`.
Staging (`/apitest`) is the commented line beneath it.

**Auth:** Supabase project `urvfnsimzrfxwhisydpt`. The GoTrue REST endpoints are
called directly rather than through `@supabase/supabase-js`, because there is no
build step and the SDK stores its session in `localStorage`, which the service
worker cannot read. The session lives in `chrome.storage.local` under
`pcSession`, and the access token is mirrored to `authToken` because the popup
reads that key in dozens of places; the two are always written and cleared
together.

Refreshing is on demand, in `pcAuth.ensureFreshToken`, and single-flight —
Supabase rotates refresh tokens, so two concurrent refreshes would invalidate the
pair and sign the user out.

Identity is still the original numeric id when the account has one
(`app_metadata.wp_user_id`); accounts created natively in Supabase fall back to
`sub`, which is correct — they have no history to be detached from.

**Google sign-in** goes through Supabase's `/authorize`, not Google directly, so
Google's registered redirect stays Supabase's callback and no Google Cloud change
was needed. It uses `chrome.identity.launchWebAuthFlow` with PKCE, and falls back
to implicit fragment tokens if `/authorize` returns those instead.

Two things make that work, and both are easy to break:

1. `manifest.json` carries a `key` — the **published extension's own public key**,
   recovered from the signed CRX on the Web Store. It pins an unpacked local load
   to `hehieakgdbakdajfpekgmfckplcjmgcf`, the published ID, so development and
   production share one identity and one redirect URL. Do not regenerate it: a
   new key means a new ID, and the allow-list entry below stops matching with no
   obvious symptom beyond Google sign-in failing.

   (A CRX carries several signature proofs. The publisher's is the one whose
   SHA-256 matches `crx_id` in the header's `signed_header_data` — not simply the
   first, which is Google's.)

2. Supabase's redirect allow-list (Auth → URL Configuration) carries
   `https://hehieakgdbakdajfpekgmfckplcjmgcf.chromiumapp.org/**` and
   `https://*.extensions.allizom.org/**`, alongside the pre-existing
   promptcatalyst.ai and localhost entries. The wildcard covers Firefox, whose
   redirect URL is a per-install UUID and so cannot be listed exactly.

## Identity, and where the versions stand

| | Value |
|---|---|
| Chrome Web Store ID | `hehieakgdbakdajfpekgmfckplcjmgcf` |
| Firefox add-on GUID | `promptcatalyst@catalystmedia.ai` |
| Published version | 1.9.2.1 (both stores) |
| This tree | 1.9.3 |

The local manifest said 1.8.2 while the stores had 1.9.2.1, which looked like the
source being behind. It was not: the published package was extracted and compared
file by file, and the code matches — only the version had never been bumped
locally. The name was `Prompt Catalyst DEV`, which would have renamed the store
listing on upload, and is now `Prompt Catalyst`.

## Credit limits: 402, keyed on `code`

`pcApi.isCreditLimit` matches `anonymous_limit_reached`, `insufficient_credits`
and `usage_limit_reached` first, then falls back to status 402.
`isPremiumRequired` covers 403 and `premium_required` / `video_requires_pro`.
`isTerminal` is the union — the question every call site actually asks, since
neither case is helped by trying again.

**This deliberately differs from the web client's `apiErrors.js` in one respect:**
that file also treats `429` as a credit limit, as a fallback for cached bundles
still talking to the old API. On the new API a 429 is `provider_rate_limited` —
the generation service being briefly busy. Answering that with "you are out of
credits, please upgrade" would be a lie told to a paying customer, so the
extension treats 429 as transient and says so.

The message-substring guesses (`error.includes('limit')`) are gone from every
call site for the same reason: they fired on "Rate limit exceeded" from a busy
provider, and missed refusals worded differently.

## Verified

Loaded unpacked and driven over CDP/RDP against the live API, not just built:

- **Chrome** (Chrome for Testing 131 — Chrome 151 has removed `--load-extension`,
  so an unpacked load there needs the `chrome://extensions` UI): modules load in
  both the popup and the service worker; anonymous generate returns 402
  `anonymous_limit_reached` and shows the sign-in panel with no retry; sign-in
  stores the session and mirrors the token; signed-in generate returns three
  prompts; credits decrement (12 → 11 → …); preview returns a runware image that
  renders under the CSP; variations return; image analysis works through the
  service worker's multipart upload; weekly prompts load 20 cards; logout clears
  everything; a leftover WordPress token is retired on startup.
- **Firefox 154** (temporary add-on): installs with **zero manifest warnings**,
  popup loads, all three modules present, `/credits` and `/api/weekly-prompts`
  both 200, and the background event page answers `runtime.sendMessage`.
- **Google sign-in**: the redirect URL the extension generates is
  `https://hehieakgdbakdajfpekgmfckplcjmgcf.chromiumapp.org/`, matching the
  allow-list entry exactly; Supabase's `/authorize` 302s to Google carrying it,
  and the PKCE grant is supported. The consent round-trip itself was not driven —
  it needs a real Google account.
- **The packaged builds**, not just the source tree: `dist/chrome` loads and
  reaches the API, and `dist/firefox` installs under the published add-on GUID
  with zero warnings. All preview assets resolve from inside the package.
- **Re-run in full after the cleanup**, against a throwaway Supabase account that
  was deleted afterwards: sign in, generate, preview, variations, image analysis,
  weekly prompts, the Style Codes panel, logout — plus docs.html, whose 41 images
  all load.

## Cleanup

**Files removed:** `scripts/style-refs-fullscreen.js` and its CSS (loaded by no
HTML, in neither manifest), the `testRatePopup` button and `forceRatePopupTest`
(marked "remove before production" and shipped anyway), and
`previews/styles/New Text Document.py` — a stray filename-listing script that had
been going out to users inside the package.

**Dead code in popup.js.** Four declarations were shadowed by later ones of the
same name; fourteen functions were referenced by nothing, several left over from
the removed Style Codes feature. Removing them cascades — two rounds were needed
before nothing was unreferenced. `cleanupOldPreviews` had also been registered on
two hourly intervals, because the shadowed copy brought its own `setInterval`.
The file is now 357 KB, from 388 KB.

Boundaries came from real brace matching, not indentation: this file's nesting
and its indentation disagree, everything sits inside one `DOMContentLoaded`
callback, and `hidePreview` turned out to be **two different scopes** — both live,
both kept. Anything doing this again should check scope the same way rather than
trusting the column a declaration starts in.

**Assets.** Six files were unreachable by any code path, including a 1.5 MB
teaser image belonging to the removed feature. Reachability had to model both
ways previews are named: literal filenames in the option tables, *and* paths
built at runtime as `previews/${folder}/${value.replace(/_/g,'-')}-preview.png`.
Seven files that looked unused are reached the second way and were kept — a
filename-only search would have deleted them.

**The docs page** described a Style References tab that no longer exists, and now
points at the website.

**The build now verifies itself.** `screenshots/` looked like store-listing
material and was excluded; docs.html embeds 28 of them, so that shipped a docs
page of broken images. The build checks that every local `src`/`href`/`url()` in
the packaged HTML, CSS and JS resolves inside the package, and fails if one does
not. Confirmed to fail on a deliberately broken reference, so it is not passing
vacuously.

## Still open

- **`popup.js` is still one 357 KB file.** It cannot simply be split: everything
  lives inside a single `DOMContentLoaded` callback, so moving code to another
  file changes what it closes over. The data tables (styles, lighting, camera
  angles, greetings — several thousand lines of pure literals) *could* be lifted
  into a file loaded before it, since a script-scoped `const` stays visible
  inside the callback. That is the next thread worth pulling.
- **Chrome 151 load not done.** The verification browser was Chrome for Testing
  131, because current Chrome has removed `--load-extension`. Loading it into
  everyday Chrome means the `chrome://extensions` UI.
- **The Style Codes tab is now an explanation.** The API has no
  `/api/style-references`; the tab says the codes live on the website and links
  there rather than calling a host that is gone.

## Related

Web client: `Claude Playground/prompt-catalyst-web` (public). API:
`Claude Playground/promptcatalyst-backend` (private), routes in `api/src/routes/`,
`docs/` records what changed and why.
