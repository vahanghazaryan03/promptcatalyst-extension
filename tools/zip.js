// A minimal ZIP writer.
//
// Exists because PowerShell's Compress-Archive, on Windows, writes entry names
// with BACKSLASH separators: `icons\chevron-down.svg`. The ZIP spec requires
// forward slashes. Chrome accepts such an archive; addons.mozilla.org rejects it
// outright with "Invalid file name in archive", so the Firefox build could never
// be submitted.
//
// Worth knowing if you go looking: Python's zipfile silently rewrites separators
// when reading, so `namelist()` shows forward slashes for an archive that
// actually contains backslashes. Only the raw bytes tell the truth.

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

/** CRC-32, from zlib where available (Node 20.15+) and by table otherwise. */
const crc32 =
  typeof zlib.crc32 === 'function'
    ? (buf) => zlib.crc32(buf)
    : (() => {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
          let c = i;
          for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          table[i] = c >>> 0;
        }
        return (buf) => {
          let c = 0xffffffff;
          for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
          return (c ^ 0xffffffff) >>> 0;
        };
      })();

/** MS-DOS date/time. The format starts at 1980; anything earlier is clamped. */
function dosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, base));
    } else if (entry.isFile()) {
      // Always POSIX separators, whatever the host platform uses.
      out.push({ full, name: path.relative(base, full).split(path.sep).join('/') });
    }
  }
  return out;
}

/**
 * Writes `dir` to `outPath` as a zip whose members sit at the archive root,
 * which is what both stores require of an extension package.
 */
function zipDirectory(dir, outPath) {
  const files = walk(dir);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    // Belt and braces: the whole point of this module is that this never holds.
    if (file.name.includes('\\')) {
      throw new Error(`entry name contains a backslash, which no store accepts: ${file.name}`);
    }
    const data = fs.readFileSync(file.full);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    // Storing is only worth it when compression made the entry bigger.
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const method = useDeflate ? 8 : 0;

    const nameBuf = Buffer.from(file.name, 'utf8');
    const { time, date } = dosDateTime(fs.statSync(file.full).mtime);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra length

    chunks.push(local, nameBuf, body);

    const dirEntry = Buffer.alloc(46);
    dirEntry.writeUInt32LE(0x02014b50, 0);
    dirEntry.writeUInt16LE(0x031e, 4); // made by: UNIX, spec 3.0
    dirEntry.writeUInt16LE(20, 6);
    dirEntry.writeUInt16LE(0x0800, 8);
    dirEntry.writeUInt16LE(method, 10);
    dirEntry.writeUInt16LE(time, 12);
    dirEntry.writeUInt16LE(date, 14);
    dirEntry.writeUInt32LE(crc, 16);
    dirEntry.writeUInt32LE(body.length, 20);
    dirEntry.writeUInt32LE(data.length, 24);
    dirEntry.writeUInt16LE(nameBuf.length, 28);
    dirEntry.writeUInt16LE(0, 30); // extra
    dirEntry.writeUInt16LE(0, 32); // comment
    dirEntry.writeUInt16LE(0, 34); // disk
    dirEntry.writeUInt16LE(0, 36); // internal attrs
    // >>> 0 because JS bitwise shifts are signed: 0o100644 << 16 goes negative.
    dirEntry.writeUInt32LE((0o100644 << 16) >>> 0, 38); // regular file, mode 0644
    dirEntry.writeUInt32LE(offset, 42);

    central.push(dirEntry, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // comment length

  fs.writeFileSync(outPath, Buffer.concat([...chunks, centralBuf, end]));
  return files.length;
}

module.exports = { zipDirectory };
