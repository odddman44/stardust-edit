import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { createUploadManager } from './uploadManager.js';
import type { UploadManager } from './uploadManager.js';
import type { CosmosEditorProps } from '../react/types.js';
import type { CosmosDocument, Result } from '../document/types.js';
import { serializeEditorDocument } from '../document/serializeEditor.js';

export function createEditorUploads(getCallbacks: () => CosmosEditorProps) {
  let editor: Editor | null = null;
  let manager: UploadManager | null = null;
  const previews = new Map<string, string>();

  function find(id: string) {
    let found: { node: ProseMirrorNode; pos: number } | undefined;
    editor?.state.doc.descendants((node, pos) => {
      if (node.type.name === 'uploadPlaceholder' && node.attrs.id === id) { found = { node, pos }; return false; }
    });
    return found;
  }

  function release(id: string) {
    const url = previews.get(id);
    if (url) URL.revokeObjectURL(url);
    previews.delete(id);
  }

  function notify() {
    if (!editor || editor.isDestroyed || !manager) return;
    const snapshot = serializeEditorDocument(editor);
    if (snapshot.ok) getCallbacks().onChange?.(snapshot.value, manager.getCounts());
    else getCallbacks().onError?.(snapshot.error);
  }

  function reconcile() {
    if (!editor || editor.isDestroyed || !manager) return;
    const alive = new Set<string>();
    const orphans: { pos: number; size: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'uploadPlaceholder') return;
      alive.add(node.attrs.id);
      if (!manager?.getState(node.attrs.id)) orphans.push({ pos, size: node.nodeSize });
    });
    if (orphans.length) {
      const tr = editor.state.tr;
      for (const orphan of orphans.reverse()) tr.delete(orphan.pos, orphan.pos + orphan.size);
      editor.view.dispatch(tr.setMeta('addToHistory', false));
      return;
    }
    for (const id of Array.from(previews.keys())) {
      if (!alive.has(id)) { release(id); manager.remove(id); }
    }
    notify();
  }

  return {
    getManager: () => manager,
    reconcile,
    attach(instance: Editor) {
      editor = instance;
      manager = createUploadManager(file => {
        const upload = getCallbacks().uploadImage;
        return upload ? upload(file) : Promise.reject(new Error('업로드 함수가 없습니다.'));
      }, {
        onReady(id, url) {
          const anchor = find(id);
          if (!anchor || !editor || editor.isDestroyed) return;
          editor.view.dispatch(editor.state.tr.replaceWith(anchor.pos, anchor.pos + anchor.node.nodeSize,
            editor.schema.nodes.image.create({ src: url, alt: '', caption: '' })));
          release(id);
        },
        onStateChange(id, state) {
          const anchor = find(id);
          if (!anchor || !editor || editor.isDestroyed || anchor.node.attrs.status === state.status) return;
          editor.view.dispatch(editor.state.tr.setNodeMarkup(anchor.pos, undefined, { ...anchor.node.attrs, status: state.status }).setMeta('addToHistory', false));
        },
        onChange: notify,
        onError: failure => getCallbacks().onError?.(failure)
      });
      return () => {
        manager?.dispose();
        manager = null;
        editor = null;
        for (const id of Array.from(previews.keys())) release(id);
      };
    },
    addFiles(instance: Editor, files: File[], pos?: number) {
      if (!getCallbacks().uploadImage || !manager || instance !== editor) {
        getCallbacks().onError?.({ code: 'UPLOAD_UNAVAILABLE', message: '사진 업로드가 연결되어 있지 않습니다.' });
        return;
      }
      let position = pos ?? instance.state.selection.from;
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          getCallbacks().onError?.({ code: 'UPLOAD_FAILED', message: '이미지 파일을 선택해주세요.' });
          continue;
        }
        const id = manager.start(file);
        const previewUrl = URL.createObjectURL(file);
        previews.set(id, previewUrl);
        instance.chain().focus().insertContentAt(position, [
          { type: 'uploadPlaceholder', attrs: { id, previewUrl, status: 'pending' } },
          { type: 'paragraph' }
        ]).run();
        position = instance.state.selection.from;
      }
    },
    getDocument(): Result<CosmosDocument> {
      if (!editor || editor.isDestroyed) return { ok: false, error: { code: 'EDITOR_NOT_READY', message: '편집기를 준비하고 있습니다.' } };
      const counts = manager?.getCounts();
      let hasPlaceholder = false;
      editor.state.doc.descendants(node => { if (node.type.name === 'uploadPlaceholder') hasPlaceholder = true; });
      if (hasPlaceholder || counts?.pendingUploadCount || counts?.failedUploadCount) {
        return { ok: false, error: { code: 'UPLOAD_INCOMPLETE', message: '사진 업로드를 완료하거나 대기·실패 항목을 제거해주세요.' } };
      }
      return serializeEditorDocument(editor);
    }
  };
}
