import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const banner = (await readFile('scripts/userscript.header.txt', 'utf8')).trimEnd();

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
