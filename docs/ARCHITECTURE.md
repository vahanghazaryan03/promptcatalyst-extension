# Architecture

How the extension is put together, and the reasoning behind the parts that are
not obvious.

The extension is Manifest V3 with no build framework and no runtime
dependencies — the shipped package is the source. It talks to one API and one
authentication provider, and nothing else.

## The shared layer

Three files hold everything that used to be repeated at thirteen separate `fetch`
sites. They load before anything else, so both the popup and the background
context can rely on them.

| File | Responsibility |
|---|---|
| `scripts/pc-config.js` | API base, Supabase URL and anon key, site URL, storage keys |
| `scripts/pc-auth.js` | The Supabase session: sign in, sign up, Google, refresh, sign out |
| `scripts/pc-api.js` | `url()`, `headers()`, request helper, error classification |

Centralising this was the point of the migration. When every call site carried its
own host string and its own idea of what an error meant, changing the backend
meant changing thirteen things correctly, and one wrong error branch was
indistinguishable from twelve right ones.

## Authentication

Supabase issues the tokens; the API verifies them locally against Supabase's
JWKS. The anon key is public by design — it identifies the project and grants
nothing on its own.

**Why not the SDK.** `@supabase/supabase-js` stores its session in
`localStorage`, which a Manifest V3 service worker has no access to, and pulling
it in would mean adding a bundler to a project that deliberately has none. So the
four GoTrue endpoints actually needed — password grant, refresh, signup,
recover — are called directly.

**Session storage.** The session lives in `chrome.storage.local` under
`pcSession`: the one store the popup and the background context share. The access
token is also mirrored to `authToken`, because the popup reads that key in dozens
of places; the two are always written and cleared together, so they cannot
disagree.

**Refresh is on demand and single-flight.** Without the SDK there is no refresh
timer, so `pcAuth.ensureFreshToken` refreshes immediately before handing out a
token, and shares one in-flight refresh between concurrent callers. This matters:
Supabase rotates refresh tokens, so two simultaneous refreshes invalidate the
pair and sign the user out for no visible reason.

**Identity.** The API keys credits and history on the original numeric user id,
carried in the token's `app_metadata.wp_user_id`. Accounts created natively in
Supabase have no such id and fall back to `sub`, which is correct — they have no
prior history to be attached to.

**Migrating existing sessions.** Anyone updating from an earlier build still has a
token from the previous provider sitting in storage. Nothing can refresh it and
the API will not accept it, so it is retired on startup rather than left to make
the extension look signed in while every request goes out anonymous.

## Google sign-in, and why the extension ID matters

Google sign-in runs through Supabase's `/authorize` rather than Google directly,
so Google's registered redirect stays Supabase's callback and no Google Cloud
client changes are needed. The flow uses `identity.launchWebAuthFlow` with PKCE,
falling back to implicit fragment tokens if `/authorize` returns those instead.

Two things make it work, and both are easy to break silently:

**1. The extension ID must be the published one.** The OAuth flow resolves
against `https://<extension-id>.chromiumapp.org/`. An unpacked build with a
freshly generated key has a different ID, so sign-in works in development and
fails for every real user — with no symptom until someone clicks the button in
production.

`manifest.json` therefore carries the published extension's own public key,
recovered from the signed CRX. Worth knowing if you ever repeat this: a CRX
contains several signature proofs, and the publisher's is *not* simply the first
one — it is the proof whose SHA-256 matches `crx_id` in the header's
`signed_header_data`. The first is Google's, and it derives a plausible-looking
but wrong ID. The check that settles it is loading the extension and reading
`chrome.runtime.id`.

**2. The redirect must be allow-listed on Supabase.** Auth → URL Configuration
carries the Chrome `chromiumapp.org` redirect and a wildcard for Firefox, whose
redirect URL is a per-install UUID and so cannot be listed exactly. The Supabase
callback must in turn be an authorised redirect URI on the Google OAuth client.

## Error classification

Every generation endpoint can refuse for reasons that are not failures, and the
distinction drives the UI: a refusal should offer a way forward, a fault should
offer a retry.

| Condition | Signal |
|---|---|
| Out of credits | `402` with `anonymous_limit_reached`, `insufficient_credits` or `usage_limit_reached` |
| Feature needs a paid plan | `403` with `premium_required` or `video_requires_pro` |
| Service briefly busy | `429` with `provider_rate_limited` |

`pcApi.isTerminal` is the union of the first two — the question every call site
actually asks, since neither is helped by trying again.

**`429` is deliberately not treated as a credit limit**, which is where this
parts company with the web client's equivalent module. That file accepts `429` as
a fallback for older cached bundles talking to a previous API. Here, a `429` means
the generation provider is momentarily busy; reporting it as "you are out of
credits, please upgrade" would be false, and shown most often to the paying
customers generating the most.

The earlier code inferred all of this by searching the error message for
`"limit"`. That fired on *"Rate limit exceeded"* from a busy provider and missed
refusals phrased any other way. Matching the API's own error codes replaced the
guesswork.

## Cross-browser

One source tree, two manifests.

Chrome runs the background as a service worker and pulls in the shared modules
with `importScripts`. Firefox runs it as an event page, where `importScripts` does
not exist, so `manifest.firefox.json` lists the same files under
`background.scripts` and `background.js` guards the call. Everything else — the
popup, the API layer, the auth layer — is identical.

Firefox also needs its own add-on GUID, and its OAuth redirect is a per-install
UUID rather than a stable ID, which is why the Supabase allow-list entry for it is
a wildcard.

## Build and packaging

`node tools/build.js` writes `dist/chrome/` and `dist/firefox/` plus a zip of
each, from an explicit allowlist of what the extension needs at runtime. It
substitutes the correct manifest per target and strips the `key` field from the
Chrome upload, where identity comes from the dashboard item instead.

Two checks run as part of the build, both added after the failures they prevent:

**Every local reference must resolve inside the package.** `src`, `href` and
`url()` in the packaged HTML, CSS and JS are resolved against the files actually
shipped, and a miss fails the build. This class of bug is invisible otherwise: the
package builds, installs and runs, and the breakage only appears on whichever page
holds the missing asset.

**The archive is written directly rather than shelled out.** PowerShell's
`Compress-Archive` stores entry names with backslash separators on Windows, which
the ZIP specification forbids. Chrome accepts such an archive; addons.mozilla.org
rejects the upload with `Invalid file name in archive`. `tools/zip.js` is a small
deflate writer over `zlib` that guarantees POSIX separators and refuses to emit
anything else.

A detail that makes this bug hard to see: Python's `zipfile` rewrites separators
when reading, so `namelist()` reports forward slashes for an archive that
contains backslashes. Only the raw bytes are conclusive.

## Verification

Changes were confirmed by loading the packages and driving them against the live
API — Chrome over the DevTools Protocol, Firefox over the remote debugging
protocol — rather than by checking that a build succeeded.

That covers sign-in and sign-out, prompt generation, preview image generation,
variations, image analysis through the background context's multipart upload,
weekly prompts, credit decrementing, and the out-of-credits path returning `402`
and showing the sign-in panel without retrying. Firefox installs with zero
manifest warnings, and the packaged builds are verified in addition to the source
tree.

## Constraints

`popup.js` is a large single file from the original build. Everything runs inside
one `DOMContentLoaded` closure, so moving code into another file changes what it
closes over — splitting it is a rewrite of a working UI, not a refactor. The
migration was therefore done by introducing the shared modules and routing every
call site through them, leaving the UI logic untouched.

The natural next step, when it is worth doing, is lifting the pure data tables —
styles, lighting, camera angles, greetings, several thousand lines of literals —
into a file loaded beforehand, since a script-scoped `const` remains visible
inside the closure.
