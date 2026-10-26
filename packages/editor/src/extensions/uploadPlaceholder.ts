import { Node } from '@tiptap/core';
import type { UploadManager } from '../uploads/uploadManager.js';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { UploadPlaceholderView } from '../react/UploadPlaceholderView.js';

export function createUploadPlaceholder(getManager: () => UploadManager | null) {
  return Node.create({
    name: 'uploadPlaceholder', group: 'block', atom: true,
    addOptions: () => ({ getManager }),
    addAttributes: () => ({ id: { default: null }, previewUrl: { default: null }, status: { default: 'pending' } }),
    parseHTML: () => [],
    renderHTML: () => ['div', {}, '사진 업로드 중'],
    addNodeView: () => ReactNodeViewRenderer(UploadPlaceholderView)
  });
}
