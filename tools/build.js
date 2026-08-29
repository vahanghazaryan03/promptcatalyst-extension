#!/usr/bin/env node
//
// Builds the store-ready packages.
//
//   node tools/build.js            -> dist/chrome/ + dist/firefox/ and a zip of each
//   node tools/build.js chrome     -> just one
//
// Two things make this necessary rather than "zip the folder":
//
//   Firefox reads manifest.json, and ours is Chrome's. The Firefox manifest has
//   to be copied over it, or Gecko sees background.service_worker and refuses.
//
//   The Chrome upload must not contain the `key` field. It is there so an
//   unpacked local load gets the published extension's ID -- which is what makes
//   the OAuth redirect match in development. The Web Store assigns identity from
//   the dashboard item, and a key in the package is at best redundant.

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/**
 * Everything the extension needs at runtime, and nothing else.
 *
 * An allowlist, not an ignore list: the previous upload shipped `screenshots/`
 * -- 5 MB of store listing images -- inside the extension, because the rule was
 * "zip what is there".
 */
const INCLUDE = [
  'icons',
  'previews',
  'scripts',
  'styles',
  'docs.html',
  'popup.html',
  'upload.html',
  'upload-background.html',
];

const TARGETS = {
  chrome: {
    manifest: 'manifest.json',
    // Identity comes from the dashboard item; see the note above.
    transform: (m) => {
      delete m.key;
      return m;
    },
  },
  firefox: {
    manifest: 'manifest.firefox.json',
    transform: (m) => m,
  },
};

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyInto(dest) {
  for (const entry of INCLUDE) {
    const from = path.join(ROOT, entry);
    if (!fs.existsSync(from)) {
      throw new Error(`missing ${entry} -- refusing to build an incomplete package`);
    }
    fs.cpSync(from, path.join(dest, entry), { recursive: true });
  }
}

/** Zips with PowerShell, so the build needs nothing installed. */
function zip(dir, out) {
  rmrf(out);
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${dir}\\*' -DestinationPath '${out}' -Force`,
    ],
    { stdio: 'pipe' },
  );
}

function build(name) {
  const target = TARGETS[name];
  if (!target) throw new Error(`unknown target ${name}`);

  const manifestPath = path.join(ROOT, target.manifest);
  const manifest = target.transform(JSON.parse(fs.readFileSync(manifestPath, 'utf8')));

  const out = path.join(DIST, name);
  rmrf(out);
  fs.mkdirSync(out, { recursive: true });

  copyInto(out);
  fs.writeFileSync(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const zipPath = path.join(DIST, `prompt-catalyst-${name}-${manifest.version}.zip`);
  zip(out, zipPath);

  const bytes = fs.statSync(zipPath).size;
  console.log(
    `${name.padEnd(8)} v${manifest.version}  ${(bytes / 1024 / 1024).toFixed(1)} MB  ${path.relative(ROOT, zipPath)}`,
  );
}

const requested = process.argv[2];
fs.mkdirSync(DIST, { recursive: true });
for (const name of requested ? [requested] : Object.keys(TARGETS)) build(name);
