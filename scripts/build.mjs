import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });

await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  sourcemap: false,
  outdir: 'dist/assets',
  entryNames: 'main',
  assetNames: '[name]-[hash]',
  loader: { '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
});

const source = await readFile('index.html', 'utf8');
const html = source
  .replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/assets/main.css" />\n    <script type="module" src="/assets/main.js"></script>');
await writeFile('dist/index.html', html);
await cp('public', 'dist', { recursive: true });
console.log('Built dist/ with esbuild');
