import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

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

const banner = (await readFile('scripts/userscript.header.txt', 'utf8'))
  .replace('__BUILD_UPDATED_AT__', formatBuildUpdatedAt())
  .trimEnd();

await build({
  entryPoints: ['src/main.js'],
  outfile: 'AnMe.user.js',
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  banner: { js: banner },
  logLevel: 'info',
  legalComments: 'none'
});
