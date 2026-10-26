import { describe, expect, it } from 'vitest';
import { createUploadManager } from '../src/uploads/uploadManager.js';
import type { UploadCallbacks } from '../src/uploads/uploadManager.js';

function deferred() {
  let resolve!: (result: { url: string }) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<{ url: string }>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

const file = () => new File(['image'], 'photo.png', { type: 'image/png' });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
function observed() {
  const ready: { id: string; url: string }[] = [];
  const errors: string[] = [];
  const callbacks: UploadCallbacks = {
    onReady: (id, url) => ready.push({ id, url }),
    onStateChange: () => {},
    onChange: () => {},
    onError: error => errors.push(error.code)
  };
  return { ready, errors, callbacks };
}

describe('이미지 업로드 수명', () => {
  it('완료 순서가 달라도 원래 요청 ID로 결과를 전달한다', async () => {
    const a = deferred(); const b = deferred();
    const view = observed(); let attempts = 0;
    const manager = createUploadManager(() => ++attempts === 1 ? a.promise : b.promise, view.callbacks);
    const first = manager.start(file()); const second = manager.start(file());
    await flush();
    b.resolve({ url: '/b.png' }); await flush();
    a.resolve({ url: '/a.png' }); await flush();
    expect(view.ready).toEqual([{ id: second, url: '/b.png' }, { id: first, url: '/a.png' }]);
    expect(manager.getCounts()).toEqual({ pendingUploadCount: 0, failedUploadCount: 0 });
    expect(manager.getState(first)).toBeUndefined();
  });

  it('제거한 요청은 늦게 완료돼도 다시 삽입하지 않는다', async () => {
    const pending = deferred(); const view = observed();
    const manager = createUploadManager(() => pending.promise, view.callbacks);
    const id = manager.start(file()); await flush();
    manager.remove(id); pending.resolve({ url: '/late.png' }); await flush();
    expect(view.ready).toEqual([]);
    expect(manager.getState(id)).toBeUndefined();
  });

  it('재시도 후 오래된 결과가 최신 결과를 덮어쓰지 않는다', async () => {
    const old = deferred(); const latest = deferred(); const view = observed(); let attempts = 0;
    const manager = createUploadManager(() => ++attempts === 1 ? old.promise : latest.promise, view.callbacks);
    const id = manager.start(file()); await flush(); manager.retry(id); await flush();
    latest.resolve({ url: '/new.png' }); await flush(); old.resolve({ url: '/old.png' }); await flush();
    expect(view.ready).toEqual([{ id, url: '/new.png' }]);
  });

  it('문서를 닫으면 완료나 실패를 보고하지 않는다', async () => {
    const pending = deferred(); const view = observed();
    const manager = createUploadManager(() => pending.promise, view.callbacks);
    manager.start(file()); await flush(); manager.dispose();
    pending.reject(new Error('late')); await flush();
    expect(view.ready).toEqual([]); expect(view.errors).toEqual([]);
    expect(manager.getCounts()).toEqual({ pendingUploadCount: 0, failedUploadCount: 0 });
  });

  it('실패와 재시도의 상태 수를 정확하게 알려준다', async () => {
    const view = observed(); let attempts = 0;
    const manager = createUploadManager(() => ++attempts === 1 ? Promise.reject(new Error('network')) : Promise.resolve({ url: '/ok.png' }), view.callbacks);
    const id = manager.start(file());
    expect(manager.getCounts()).toEqual({ pendingUploadCount: 1, failedUploadCount: 0 });
    await flush();
    expect(manager.getCounts()).toEqual({ pendingUploadCount: 0, failedUploadCount: 1 });
    expect(manager.getState(id)).toMatchObject({ status: 'failed', error: { code: 'UPLOAD_FAILED' } });
    manager.retry(id); await flush();
    expect(manager.getCounts()).toEqual({ pendingUploadCount: 0, failedUploadCount: 0 });
    expect(view.ready).toEqual([{ id, url: '/ok.png' }]);
  });

  it.each(['blob:test', 'data:image/png;base64,a', 'javascript:alert(1)'])('임시·위험 URL을 영구 이미지로 전달하지 않는다: %s', async url => {
    const view = observed();
    const manager = createUploadManager(async () => ({ url }), view.callbacks);
    manager.start(file()); await flush();
    expect(view.ready).toEqual([]); expect(view.errors).toEqual(['UPLOAD_FAILED']);
  });

  it('동기 throw도 구조화된 실패로 반환한다', async () => {
    const view = observed();
    const manager = createUploadManager(() => { throw new Error('sync'); }, view.callbacks);
    expect(() => manager.start(file())).not.toThrow();
    await flush(); expect(view.errors).toEqual(['UPLOAD_FAILED']);
  });
});
