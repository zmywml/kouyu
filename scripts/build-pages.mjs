import { copyFile } from 'node:fs/promises';

await import('./build.mjs');
await copyFile('worker/index.mjs', 'dist/_worker.js');
console.log('Added Pages advanced-mode Worker');
