import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { build } from 'esbuild';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const outRoot = path.join('dist', 'extension');
const packageRoot = path.join('dist', 'packages');

function formatBuildUpdatedAt(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

const meta = {
  name: 'AnMe',
  version: pkg.version,
  author: 'zjw',
  updatedAt: formatBuildUpdatedAt()
};

const define = {
  'globalThis.__ANME_EXTENSION_META__': JSON.stringify(meta)
};

const commonManifest = {
  name: 'AnMe',
  version: pkg.version,
  author: 'zjw',
  description: 'Universal Multi-Site Account Switcher',
  incognito: 'spanning',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  },
  permissions: ['storage', 'cookies', 'contextMenus'],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['content.js'],
      run_at: 'document_idle',
      all_frames: false
    }
  ]
};

const chromiumManifest = {
  ...commonManifest,
  manifest_version: 3,
  action: {
    default_title: 'Open AnMe',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },
  background: {
    service_worker: 'background.js'
  },
  host_permissions: ['http://*/*', 'https://*/*']
};

const firefoxManifest = {
  ...commonManifest,
  manifest_version: 2,
  browser_action: {
    default_title: 'Open AnMe',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },
  background: {
    scripts: ['background.js']
  },
  permissions: [...commonManifest.permissions, 'http://*/*', 'https://*/*'],
  browser_specific_settings: {
    gecko: {
      id: 'anme@zhu-junwei.github.io',
      strict_min_version: '140.0',
      data_collection_permissions: {
        required: ['websiteContent', 'authenticationInfo']
      }
    },
    gecko_android: {
      strict_min_version: '142.0'
    }
  }
};

function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const crc32Table = createCrc32Table();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const body = data || Buffer.alloc(0);
  const chunk = Buffer.alloc(12 + body.length);
  chunk.writeUInt32BE(body.length, 0);
  name.copy(chunk, 4);
  body.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, body])), 8 + body.length);
  return chunk;
}

function blendPixel(pixels, size, x, y, color, alpha) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= size || py >= size || alpha <= 0) return;

  const offset = (py * size + px) * 4;
  const sourceAlpha = Math.max(0, Math.min(1, alpha)) * (color[3] / 255);
  const targetAlpha = pixels[offset + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
  if (outAlpha <= 0) return;

  pixels[offset] = Math.round((color[0] * sourceAlpha + pixels[offset] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[offset + 1] = Math.round((color[1] * sourceAlpha + pixels[offset + 1] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[offset + 2] = Math.round((color[2] * sourceAlpha + pixels[offset + 2] * targetAlpha * (1 - sourceAlpha)) / outAlpha);
  pixels[offset + 3] = Math.round(outAlpha * 255);
}

function drawLine(pixels, size, fromX, fromY, toX, toY, strokeWidth, color) {
  const scale = size / 24;
  const x1 = fromX * scale;
  const y1 = fromY * scale;
  const x2 = toX * scale;
  const y2 = toY * scale;
  const width = Math.max(1, strokeWidth * scale);
  const minX = Math.floor(Math.min(x1, x2) - width - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + width + 1);
  const minY = Math.floor(Math.min(y1, y2) - width - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + width + 1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
      const nearestX = x1 + t * dx;
      const nearestY = y1 + t * dy;
      const distance = Math.hypot(x - nearestX, y - nearestY);
      const alpha = Math.max(0, Math.min(1, width / 2 + 0.6 - distance));
      blendPixel(pixels, size, x, y, color, alpha);
    }
  }
}

function drawCircleStroke(pixels, size, cx, cy, radius, strokeWidth, color) {
  const scale = size / 24;
  const centerX = cx * scale;
  const centerY = cy * scale;
  const scaledRadius = radius * scale;
  const width = Math.max(1, strokeWidth * scale);
  const min = Math.floor(Math.max(0, Math.min(centerX, centerY) - scaledRadius - width - 1));
  const max = Math.ceil(Math.min(size - 1, Math.max(centerX, centerY) + scaledRadius + width + 1));

  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      const distance = Math.hypot(x - centerX, y - centerY);
      const edgeDistance = Math.abs(distance - scaledRadius);
      const alpha = Math.max(0, Math.min(1, width / 2 + 0.6 - edgeDistance));
      blendPixel(pixels, size, x, y, color, alpha);
    }
  }
}

function createAnMeIconPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const color = [28, 39, 76, 255];
  const stroke = 1.5;

  drawLine(pixels, size, 2, 11, 22, 11, stroke, color);
  drawLine(pixels, size, 4, 11, 4.6, 8.6, stroke, color);
  drawLine(pixels, size, 4.6, 8.6, 6.2, 4.8, stroke, color);
  drawLine(pixels, size, 6.2, 4.8, 8.2, 4, stroke, color);
  drawLine(pixels, size, 8.2, 4, 15.8, 4, stroke, color);
  drawLine(pixels, size, 15.8, 4, 17.8, 4.8, stroke, color);
  drawLine(pixels, size, 17.8, 4.8, 19.4, 8.6, stroke, color);
  drawLine(pixels, size, 19.4, 8.6, 20, 11, stroke, color);
  drawCircleStroke(pixels, size, 6.5, 17.5, 3.5, stroke, color);
  drawCircleStroke(pixels, size, 17.5, 17.5, 3.5, stroke, color);
  drawLine(pixels, size, 10, 17.5, 10.65, 17.17, stroke, color);
  drawLine(pixels, size, 10.65, 17.17, 13.35, 17.17, stroke, color);
  drawLine(pixels, size, 13.35, 17.17, 14, 17.5, stroke, color);

  const rawRows = [];
  for (let y = 0; y < size; y += 1) {
    rawRows.push(Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4));
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.concat(rawRows))),
    pngChunk('IEND')
  ]);
}

async function writeIcons(outdir) {
  const iconDir = path.join(outdir, 'icons');
  await mkdir(iconDir, { recursive: true });
  await writeFile(path.join(iconDir, 'anme.svg'), await readFile('src/extension/icons/anme.svg', 'utf8'), 'utf8');
  for (const size of [16, 32, 48, 128]) {
    await writeFile(path.join(iconDir, `icon-${size}.png`), createAnMeIconPng(size));
  }
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
}

async function listFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await listFiles(fullPath, baseDir);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      files.push({
        fullPath,
        zipPath: path.relative(baseDir, fullPath).replaceAll(path.sep, '/')
      });
    }
  }
  return files.sort((a, b) => a.zipPath.localeCompare(b.zipPath));
}

async function writeZipFromDirectory(sourceDir, zipPath) {
  const fileEntries = await listFiles(sourceDir);
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, day } = dosDateTime();

  for (const file of fileEntries) {
    const name = Buffer.from(file.zipPath, 'utf8');
    const data = await readFile(file.fullPath);
    const checksum = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(day, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(day, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(fileEntries.length, 8);
  end.writeUInt16LE(fileEntries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  await mkdir(path.dirname(zipPath), { recursive: true });
  await writeFile(zipPath, Buffer.concat([...localParts, centralDirectory, end]));
}

async function buildTarget(targetName, manifest) {
  const outdir = path.join(outRoot, targetName);
  await mkdir(outdir, { recursive: true });
  await writeFile(path.join(outdir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeIcons(outdir);

  await build({
    entryPoints: ['src/main.js'],
    outfile: path.join(outdir, 'content.js'),
    bundle: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    define,
    logLevel: 'info',
    legalComments: 'none'
  });

  await build({
    entryPoints: ['src/extension/background.js'],
    outfile: path.join(outdir, 'background.js'),
    bundle: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    logLevel: 'info',
    legalComments: 'none'
  });
}

await rm(outRoot, { recursive: true, force: true });
await rm(packageRoot, { recursive: true, force: true });
await buildTarget('chromium', chromiumManifest);
await buildTarget('firefox', firefoxManifest);

await writeZipFromDirectory(
  path.join(outRoot, 'chromium'),
  path.join(packageRoot, `AnMe-chromium-${pkg.version}.zip`)
);
await writeZipFromDirectory(
  path.join(outRoot, 'firefox'),
  path.join(packageRoot, `AnMe-firefox-${pkg.version}.xpi`)
);
