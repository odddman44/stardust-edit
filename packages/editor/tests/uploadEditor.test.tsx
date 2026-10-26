// @vitest-environment jsdom
import { createRef } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CosmosEditor } from '../src/react.js';
import type { CosmosEditorHandle } from '../src/react.js';
import type { CosmosDocument } from '../src/index.js';

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:preview' });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
});
afterEach(cleanup);
const file = () => new File(['png'], 'image.png', { type: 'image/png' });

describe('이미지 편집 흐름', () => {
  it('업로드 함수가 없으면 추가는 막고 기존 사진은 표시한다', async () => {
    const initial: CosmosDocument = { version: 1, content: { type: 'doc', content: [{ type: 'image', attrs: { src: '/photo.png', alt: '기존 사진', caption: '' } }] } };
    render(<CosmosEditor initialDocument={initial} />);
    const button = await screen.findByRole('button', { name: '사진 추가', exact: true });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect((await screen.findByRole('img', { name: '기존 사진' })).getAttribute('src')).toBe('/photo.png');
  });

  it('대기·실패 중 최종 추출을 막고 재시도 결과를 저장한다', async () => {
    const ref = createRef<CosmosEditorHandle>();
    let resolve!: (result: { url: string }) => void;
    let reject!: (error: Error) => void;
    let attempt = 0;
    const snapshots: { document: CosmosDocument; pending: number }[] = [];
    render(<CosmosEditor ref={ref} uploadImage={() => ++attempt === 1
      ? new Promise((_resolve, fail) => { reject = fail; })
      : new Promise(accept => { resolve = accept; })}
      onChange={(document, info) => snapshots.push({ document, pending: info.pendingUploadCount })} />);
    await screen.findByRole('textbox', { name: '문서 본문' });
    fireEvent.change(screen.getByLabelText('사진 파일'), { target: { files: [file()] } });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: false, error: { code: 'UPLOAD_INCOMPLETE' } }));
    expect(JSON.stringify(snapshots)).not.toMatch(/blob:|uploadPlaceholder|previewUrl/);
    await waitFor(() => expect(reject).toBeTypeOf('function'));
    reject(new Error('network'));
    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    resolve({ url: '/ready.png' });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: true, value: { content: { content: expect.arrayContaining([expect.objectContaining({ type: 'image', attrs: expect.objectContaining({ src: '/ready.png' }) })]) } } }));
    expect(snapshots.some(snapshot => snapshot.pending === 1)).toBe(true);
  });

  it('업로드 중 제거한 사진은 늦게 완료되어도 삽입하지 않는다', async () => {
    let resolve!: (result: { url: string }) => void;
    const ref = createRef<CosmosEditorHandle>();
    render(<CosmosEditor ref={ref} uploadImage={() => new Promise(accept => { resolve = accept; })} />);
    await screen.findByRole('textbox', { name: '문서 본문' });
    fireEvent.change(screen.getByLabelText('사진 파일'), { target: { files: [file()] } });
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    fireEvent.click(await screen.findByRole('button', { name: '업로드 제거' }));
    resolve({ url: '/late.png' });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: true }));
    expect(JSON.stringify(ref.current?.getDocument())).not.toContain('/late.png');
  });

  it('업로드 삽입을 취소한 뒤 다시 실행해도 영구 대기 상태를 남기지 않는다', async () => {
    let resolve!: (result: { url: string }) => void;
    const ref = createRef<CosmosEditorHandle>();
    render(<CosmosEditor ref={ref} uploadImage={() => new Promise(accept => { resolve = accept; })} />);
    const body = await screen.findByRole('textbox', { name: '문서 본문' });
    fireEvent.change(screen.getByLabelText('사진 파일'), { target: { files: [file()] } });
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    fireEvent.keyDown(body, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: true }));
    fireEvent.keyDown(body, { key: 'z', code: 'KeyZ', ctrlKey: true, shiftKey: true });
    resolve({ url: '/cancelled.png' });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: true }));
    expect(JSON.stringify(ref.current?.getDocument())).not.toMatch(/cancelled.png|uploadPlaceholder/);
  });

  it('업로드 중 다른 문서를 열면 이전 결과를 새 문서에 넣지 않는다', async () => {
    let resolve!: (result: { url: string }) => void;
    const ref = createRef<CosmosEditorHandle>();
    const upload = () => new Promise<{ url: string }>(accept => { resolve = accept; });
    const { rerender } = render(<CosmosEditor key="A" ref={ref} uploadImage={upload} />);
    await screen.findByRole('textbox', { name: '문서 본문' });
    fireEvent.change(screen.getByLabelText('사진 파일'), { target: { files: [file()] } });
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    rerender(<CosmosEditor key="B" ref={ref} uploadImage={upload} />);
    await screen.findByRole('textbox', { name: '문서 본문' });
    resolve({ url: '/previous-document.png' });
    await waitFor(() => expect(ref.current?.getDocument()).toMatchObject({ ok: true }));
    expect(JSON.stringify(ref.current?.getDocument())).not.toContain('/previous-document.png');
  });
});
