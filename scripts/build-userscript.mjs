import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));

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

const banner = (await readFile('scripts/userscript.header.txt', 'utf8'))
  .replace('__VERSION__', meta.version)
  .replace('__BUILD_UPDATED_AT__', meta.updatedAt)
  .trimEnd();

await build({
  entryPoints: ['src/main.js'],
  outfile: 'AnMe.user.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  banner: { js: banner },
  define: {
    'globalThis.__ANME_BUILD_META__': JSON.stringify(meta)
  },
  logLevel: 'info',
  legalComments: 'none'
});
