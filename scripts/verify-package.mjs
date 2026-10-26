import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = join(root, 'packages/editor');
const scratch = join(root, '.local/package-check');
const consumer = join(scratch, 'consumer');
const logs = join(scratch, 'logs');
mkdirSync(logs, { recursive: true });

function run(command, args, cwd, name) {
  console.log(`${name} 확인 중…`);
  try {
    const output = execFileSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
    writeFileSync(join(logs, `${name}.log`), output);
    return output;
  } catch (error) {
    writeFileSync(join(logs, `${name}.log`), `${error.stdout ?? ''}\n${error.stderr ?? ''}`);
    throw new Error(`${name} 검증에 실패했습니다. ${join(logs, `${name}.log`)}를 확인하세요.`, { cause: error });
  }
}

function write(path, content) {
  const destination = join(consumer, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

run('pnpm', ['--filter', '@cosmoslog/editor', 'build'], root, 'library-build');
const preview = JSON.parse(run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', join(scratch, 'npm-cache')], packageRoot, 'pack-preview'))[0];
for (const file of preview.files) {
  assert(!file.path.includes('..') && (file.path.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE'].includes(file.path)), `허용하지 않은 배포 파일: ${file.path}`);
  if (/\.(js|ts|css)$/.test(file.path)) {
    const source = readFileSync(join(packageRoot, file.path), 'utf8');
    assert(!source.includes(root) && !source.includes('/Users/') && !source.includes('/.local/'), `로컬 경로가 포함된 배포 파일: ${file.path}`);
  }
}
assert(preview.files.some(file => file.path === 'LICENSE'));
assert(preview.files.some(file => file.path === 'README.md'));
assert(readFileSync(join(packageRoot, 'dist/react.js'), 'utf8').trimStart().startsWith('"use client";'));
const packed = JSON.parse(run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch, '--cache', join(scratch, 'npm-cache')], packageRoot, 'pack'))[0];
const tarball = join(scratch, packed.filename.replace(/\.tgz$/, `-${packed.shasum}.tgz`));
copyFileSync(join(scratch, packed.filename), tarball);
const archive = run('tar', ['-tzf', tarball], root, 'archive-list').trim().split('\n');
assert.deepEqual(archive.map(path => path.replace(/^package\//, '')).sort(), preview.files.map(file => file.path).sort());

write('package.json', JSON.stringify({
  name: 'editor-consumer-check', private: true, type: 'module',
  dependencies: { '@cosmoslog/editor': `file:${tarball}`, react: '19.3.1', 'react-dom': '19.3.1', next: '16.4.3' },
  devDependencies: { vite: '8.3.5', typescript: '5.9.3', '@types/node': '22.20.5', '@types/react': '19.3.0', '@types/react-dom': '19.3.0' }
}, null, 2));
write('tsconfig.json', JSON.stringify({ compilerOptions: {
  target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'Bundler',
  jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true, plugins: [{ name: 'next' }]
}, include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules', 'dist-vite'] }, null, 2));
write('index.html', '<html lang="ko"><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
write('src/main.tsx', `import { createRoot } from 'react-dom/client';
import { CosmosEditor } from '@cosmoslog/editor/react';
import { createEmptyDocument } from '@cosmoslog/editor';
import '@cosmoslog/editor/styles.css';
createRoot(document.getElementById('root')!).render(<CosmosEditor initialDocument={createEmptyDocument()} />);`);
write('next.config.mjs', 'export default { turbopack: { root: process.cwd() } };');
write('app/layout.tsx', `import type { ReactNode } from 'react';
import '@cosmoslog/editor/styles.css';
export default function Layout({ children }: { children: ReactNode }) { return <html lang="ko"><body>{children}</body></html>; }`);
write('app/ClientEditor.tsx', `'use client';
import { CosmosEditor } from '@cosmoslog/editor/react';
export default function ClientEditor() { return <CosmosEditor />; }`);
write('app/page.tsx', `import { renderDocumentToHtml } from '@cosmoslog/editor/renderer';
import { createEmptyDocument } from '@cosmoslog/editor';
import ClientEditor from './ClientEditor';
export default function Page() { const result = renderDocumentToHtml(createEmptyDocument());
if (!result.ok) throw new Error(result.error.code);
return <><article dangerouslySetInnerHTML={{ __html: result.value }} /><ClientEditor /></>; }`);

run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', join(scratch, 'npm-cache')], consumer, 'consumer-install');
const installed = realpathSync(join(consumer, 'node_modules/@cosmoslog/editor'));
assert(installed.startsWith(consumer + sep), 'tarball 대신 외부 workspace 링크를 사용했습니다.');
for (const path of ['dist/react.js', 'dist/index.js', 'dist/renderer.js', 'dist/styles.css']) {
  assert.equal(readFileSync(join(installed, path), 'utf8'), readFileSync(join(packageRoot, path), 'utf8'), `소비 앱이 이전 배포물을 사용합니다: ${path}`);
}
const appRequire = createRequire(join(consumer, 'package.json'));
const libraryRequire = createRequire(join(installed, 'package.json'));
const tiptapRequire = createRequire(libraryRequire.resolve('@tiptap/react'));
assert.equal(realpathSync(appRequire.resolve('react')), realpathSync(libraryRequire.resolve('react')));
assert.equal(realpathSync(appRequire.resolve('react')), realpathSync(tiptapRequire.resolve('react')));
run(process.execPath, ['--input-type=module', '-e', `
import { createEmptyDocument, parseDocument } from '@cosmoslog/editor';
import { renderDocumentToHtml, exportDocumentToMarkdown } from '@cosmoslog/editor/renderer';
const input = createEmptyDocument();
if (!parseDocument(input).ok || !renderDocumentToHtml(input).ok || !exportDocumentToMarkdown(input).ok) throw new Error('서버 진입점 오류');
console.log('DOM 없는 서버 실행 성공');`], consumer, 'node-renderer');
run('npm', ['exec', '--', 'vite', 'build', '--outDir', 'dist-vite'], consumer, 'vite-build');
const cssFiles = readdirSync(join(consumer, 'dist-vite/assets')).filter(path => path.endsWith('.css'));
assert(cssFiles.some(path => readFileSync(join(consumer, 'dist-vite/assets', path), 'utf8').includes('.cosmos-editor')), '소비 앱 빌드에서 CSS가 제거됐습니다.');
run('npm', ['exec', '--', 'next', 'build'], consumer, 'next-build');
run('npm', ['exec', '--', 'tsc', '--noEmit'], consumer, 'consumer-typecheck');
assert(existsSync(join(consumer, '.next/BUILD_ID')));
writeFileSync(join(scratch, 'report.json'), JSON.stringify({ tarball, files: preview.files.length, react: '19.3.1', next: '16.4.3', vite: '8.3.5', server: true, typecheck: true, builds: ['vite', 'next'] }, null, 2));
console.log(`배포물 검증 성공: ${preview.files.length}개 파일, React 공유, Node 서버 실행, Vite·Next.js·타입 검사 통과.`);
