import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  packages: 'external',
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  legalComments: 'inline'
});
