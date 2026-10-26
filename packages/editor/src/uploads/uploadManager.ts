import type { EditorError } from '../document/types.js';
import type { ChangeInfo, UploadImage } from '../react/types.js';
import { isSafeImageUrl } from '../document/urlPolicy.js';

export type UploadState = { status: 'pending' } | { status: 'failed'; error: EditorError };
export type UploadCallbacks = {
  onReady: (id: string, url: string) => void;
  onStateChange: (id: string, state: UploadState) => void;
  onChange: (info: ChangeInfo) => void;
  onError: (error: EditorError) => void;
};
export type UploadManager = {
  start: (file: File) => string;
  retry: (id: string) => void;
  remove: (id: string) => void;
  dispose: () => void;
  getCounts: () => ChangeInfo;
  getState: (id: string) => UploadState | undefined;
};

export function createUploadManager(upload: UploadImage, callbacks: UploadCallbacks): UploadManager {
  const entries = new Map<string, { file: File; generation: number; state: UploadState }>();
  let disposed = false;

  function getCounts(): ChangeInfo {
    let pendingUploadCount = 0; let failedUploadCount = 0;
    for (const entry of entries.values()) {
      if (entry.state.status === 'pending') pendingUploadCount++;
      else failedUploadCount++;
    }
    return { pendingUploadCount, failedUploadCount };
  }

  function attempt(id: string) {
    const entry = entries.get(id);
    if (!entry || disposed) return;
    const generation = ++entry.generation;
    entry.state = { status: 'pending' };
    callbacks.onStateChange(id, entry.state);
    callbacks.onChange(getCounts());
    const current = () => !disposed && entries.get(id) === entry && entry.generation === generation;
    Promise.resolve().then(() => current() ? upload(entry.file) : undefined).then(result => {
      if (!current()) return;
      if (!result || !isSafeImageUrl(result.url)) throw new Error('영구 이미지 URL이 필요합니다.');
      entries.delete(id);
      callbacks.onReady(id, result.url);
      callbacks.onChange(getCounts());
    }).catch(() => {
      if (!current()) return;
      const error: EditorError = { code: 'UPLOAD_FAILED', message: '사진을 업로드하지 못했습니다. 다시 시도해주세요.' };
      entry.state = { status: 'failed', error };
      callbacks.onStateChange(id, entry.state);
      callbacks.onError(error);
      callbacks.onChange(getCounts());
    });
  }

  return {
    start(file) {
      const id = crypto.randomUUID();
      entries.set(id, { file, generation: 0, state: { status: 'pending' } });
      attempt(id);
      return id;
    },
    retry: attempt,
    remove(id) {
      if (entries.delete(id)) callbacks.onChange(getCounts());
    },
    dispose() { disposed = true; entries.clear(); },
    getCounts,
    getState: id => entries.get(id)?.state
  };
}
