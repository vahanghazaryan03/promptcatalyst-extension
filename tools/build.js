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
const { zipDirectory } = require('./zip');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/**
 * Everything the extension needs at runtime, and nothing else.
 *
 * An allowlist, not an ignore list, so that adding a stray file to the project
 * root does not silently ship it -- a filename-listing script had been going out
 * inside `previews/` for months.
 *
 * `screenshots/` looks like store-listing material and is not: docs.html embeds
 * 28 of them. Dropping it produced a docs page of broken images, which is why
 * verifyReferences below now exists.
 */
const INCLUDE = [
  'icons',
  'previews',
  'screenshots',
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

/**
 * Every local file the packaged pages ask for must be in the package.
 *
 * Without this the failure is silent: the zip builds, the extension loads, and
 * the broken image only shows up if someone opens that particular page. Paths
 * built at runtime (`${...}`) cannot be checked here and are skipped.
 */
function verifyReferences(dir) {
  /**
   * Patterns are per file type on purpose. Running the CSS `url()` pattern over
   * JavaScript matches `pcApi.url('/credits')` and reports the API as a missing
   * file.
   *
   * In JS, a reference counts only if it ends in an asset extension AND contains
   * a slash. The option tables carry bare filenames -- `preview:
   * 'cartoon-preview.png'` -- whose folder is supplied at runtime, so those are
   * data rather than paths and cannot be resolved here.
   */
  const PATTERNS = {
    '.html': [/(?:src|href)\s*=\s*["']([^"']+)["']/g],
    '.css': [/url\(\s*["']?([^"')]+)["']?\s*\)/g],
    '.js': [/["']([^"'`]*\/[^"'`]*\.(?:png|jpe?g|webp|gif|svg|css|html))["']/g],
  };
  const missing = [];

  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const patterns = PATTERNS[path.extname(entry.name)];
      if (!patterns) continue;

      const text = fs.readFileSync(full, 'utf8');
      for (const pattern of patterns) {
        for (const m of text.matchAll(pattern)) {
          const ref = m[1];
          if (!ref || ref.includes('${') || /^(https?:|data:|blob:|chrome-extension:|mailto:|#)/.test(ref)) {
            continue;
          }
          const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
          // Relative to the file, then to the package root: pages sit at the
          // root but stylesheets reference assets as ../icons/...
          const candidates = [
            path.resolve(path.dirname(full), clean),
            path.resolve(dir, clean.replace(/^(\.\.\/)+/, '')),
          ];
          if (!candidates.some((c) => fs.existsSync(c))) {
            missing.push(`${path.relative(dir, full)} -> ${ref}`);
          }
        }
      }
    }
  };


  walk(dir);
  return missing;
}

/**
 * Zips with our own writer rather than PowerShell.
 *
 * Compress-Archive writes entry names with backslashes on Windows, which the
 * ZIP spec forbids. Chrome accepted such an archive; addons.mozilla.org rejected
 * it with "Invalid file name in archive: icons\chevron-down.svg". See tools/zip.js.
 */
function zip(dir, out) {
  rmrf(out);
  zipDirectory(dir, out);
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

  const missing = verifyReferences(out);
  if (missing.length) {
    console.error(`\n${name}: ${missing.length} reference(s) point outside the package:`);
    for (const m of missing.slice(0, 20)) console.error(`  ${m}`);
    if (missing.length > 20) console.error(`  ... and ${missing.length - 20} more`);
    throw new Error(`${name} package is incomplete`);
  }

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
