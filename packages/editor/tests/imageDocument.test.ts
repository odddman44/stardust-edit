// @vitest-environment jsdom
import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { parseDocument } from '../src/index.js';
import { createBaseExtensions } from '../src/extensions/baseExtensions.js';
import { renderDocumentToHtml } from '../src/renderer.js';
import { createUploadPlaceholder } from '../src/extensions/uploadPlaceholder.js';
import { serializeEditorDocument } from '../src/document/serializeEditor.js';

describe('영구 이미지와 임시 업로드', () => {
  it('사진 URL·대체 텍스트·캡션을 저장하고 서버에서 표시한다', () => {
    const input = { version: 1, content: { type: 'doc', content: [{ type: 'image', attrs: { src: '/photo.png', alt: '창가의 커피', caption: '오후 세 시' } }] } };
    expect(parseDocument(input)).toEqual({ ok: true, value: input });
    const result = renderDocumentToHtml(input);
    expect(result.ok && result.value).toContain('alt="창가의 커피"');
    expect(result.ok && result.value).toContain('<figcaption>오후 세 시</figcaption>');
  });

  it('임시 노드를 원본 문서로 읽지 않는다', () => {
    expect(parseDocument({ version: 1, content: { type: 'doc', content: [{ type: 'uploadPlaceholder', attrs: { id: 'one', previewUrl: 'blob:private' } }] } }))
      .toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_NODE' } });
  });

  it('대기 중 문서 스냅샷에서 임시 상태와 blob URL을 제거한다', () => {
    const editor = new Editor({ element: null, extensions: [...createBaseExtensions(), createUploadPlaceholder(() => null)], content: { type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: '사진 앞 문장' }] },
      { type: 'uploadPlaceholder', attrs: { id: 'one', previewUrl: 'blob:private', status: 'pending' } }
    ] } });
    const result = serializeEditorDocument(editor);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/uploadPlaceholder|blob:|pending|previewUrl/);
    expect(JSON.stringify(result)).toContain('사진 앞 문장');
    editor.destroy();
  });

  it('임시 노드만 남은 스냅샷은 유효한 빈 문단을 유지한다', () => {
    const editor = new Editor({ element: null, extensions: [...createBaseExtensions(), createUploadPlaceholder(() => null)], content: { type: 'doc', content: [{ type: 'uploadPlaceholder', attrs: { id: 'one' } }] } });
    expect(serializeEditorDocument(editor)).toMatchObject({ ok: true, value: { content: { content: [{ type: 'paragraph' }] } } });
    editor.destroy();
  });
});
