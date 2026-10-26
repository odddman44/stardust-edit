import { beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const packageRoot = resolve('packages/editor');
beforeAll(() => { execFileSync('pnpm', ['build'], { cwd: packageRoot }); });

describe('패키지 실행 경계', () => {
  it('루트와 렌더러를 DOM 없는 독립 Node 프로세스에서 실행한다', () => {
    const root = pathToFileURL(resolve(packageRoot, 'dist/index.js')).href;
    const renderer = pathToFileURL(resolve(packageRoot, 'dist/renderer.js')).href;
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      const m = await import(${JSON.stringify(root)});
      const r = await import(${JSON.stringify(renderer)});
      const doc = m.createEmptyDocument();
      console.log(JSON.stringify({ document: m.parseDocument(doc).ok, html: r.renderDocumentToHtml(doc).ok, markdown: r.exportDocumentToMarkdown(doc).ok }));
    `], { encoding: 'utf8' });
    expect(JSON.parse(output)).toEqual({ document: true, html: true, markdown: true });
  });

  it('문서 진입점의 번들 그래프에 React UI를 넣지 않는다', async () => {
    const result = await build({ entryPoints: ['packages/editor/src/index.ts'], bundle: true, packages: 'external', format: 'esm', platform: 'neutral', write: false, metafile: true });
    expect(Object.keys(result.metafile.inputs).some(path => path.includes('/react/'))).toBe(false);
    const imports = Object.values(result.metafile.outputs).flatMap(output => output.imports.map(item => item.path));
    expect(imports.filter(path => path === 'react' || path.startsWith('react/') || path.startsWith('@tiptap/react'))).toEqual([]);
  });
});
