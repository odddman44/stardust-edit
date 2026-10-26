import { build } from 'esbuild';
import { copyFile, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/index.ts', 'src/renderer.ts'],
  outdir: 'dist',
  bundle: true,
  packages: 'external',
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  legalComments: 'inline'
});
await build({
  entryPoints: ['src/react.ts'],
  outdir: 'dist',
  bundle: true,
  packages: 'external',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  banner: { js: '"use client";' },
  legalComments: 'inline'
});
await copyFile('src/styles.css', 'dist/styles.css');
