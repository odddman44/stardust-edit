// @vitest-environment jsdom
import { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseDocument } from '../src/index.js';
import { createBaseExtensions } from '../src/extensions/baseExtensions.js';
import { createColumns, deleteColumns, unwrapColumns } from '../src/extensions/columnCommands.js';
import { moveSelectedBlock } from '../src/extensions/moveBlock.js';

afterEach(() => vi.restoreAllMocks());
const p = (text = '') => text ? { type: 'paragraph', content: [{ type: 'text', text }] } : { type: 'paragraph' };
const left = [p('A'), { type: 'bulletList', content: [{ type: 'listItem', content: [p('B')] }] }];
const right = [{ type: 'image', attrs: { src: '/c.png', alt: 'C', caption: '' } }, p('D')];
const columns = (a = left, b = right) => ({ type: 'columns', content: [{ type: 'column', content: a }, { type: 'column', content: b }] });
const wrap = (nodes: unknown[]) => ({ version: 1, content: { type: 'doc', content: nodes } });
function instance(content: unknown) {
  return new Editor({ element: document.createElement('div'), extensions: createBaseExtensions(), content: content as never });
}
function selectText(editor: Editor, text: string) {
  let position = 1;
  editor.state.doc.descendants((node, pos) => { if (node.isText && node.text === text) position = pos; });
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, position)));
}

describe('2열 문서', () => {
  it('두 열만 허용하고 중첩·1열·3열을 거부한다', () => {
    expect(parseDocument(wrap([columns()])).ok).toBe(true);
    const row = columns();
    for (const content of [row.content.slice(0, 1), [...row.content, row.content[0]], [{ type: 'column', content: [row] }, row.content[1]]]) {
      expect(parseDocument(wrap([{ type: 'columns', content }]))).toMatchObject({ ok: false, error: { code: 'INVALID_DOCUMENT' } });
    }
  });

  it('열을 해제해도 왼쪽·오른쪽 순서와 이미지·목록을 보존한다', () => {
    const editor = instance({ type: 'doc', content: [columns()] });
    selectText(editor, 'A');
    expect(unwrapColumns(editor)).toBe(true);
    expect(editor.getJSON().content?.map(node => node.type)).toEqual(['paragraph', 'bulletList', 'image', 'paragraph']);
    expect(editor.state.doc.textContent).toBe('ABD');
    expect(editor.getJSON().content?.[2].attrs?.src).toBe('/c.png');
    editor.destroy();
  });

  it('문단을 2열로 감쌌다가 해제해도 본문을 잃지 않는다', () => {
    const editor = instance({ type: 'doc', content: [p('기록')] });
    expect(createColumns(editor)).toBe(true);
    expect(editor.getJSON().content?.[0].type).toBe('columns');
    expect(editor.state.doc.textContent).toBe('기록');
    expect(createColumns(editor)).toBe(false);
    expect(unwrapColumns(editor)).toBe(true);
    expect(editor.state.doc.textContent).toBe('기록');
    editor.destroy();
  });

  it('반대 열 이동은 빈 열을 보정하고 한 번의 undo로 되돌린다', () => {
    const editor = instance({ type: 'doc', content: [columns([p('옮길 문장')], [p()])] });
    selectText(editor, '옮길 문장');
    expect(moveSelectedBlock(editor, 'otherColumn')).toBe(true);
    const row = editor.getJSON().content?.[0];
    expect(row?.content?.[0].content?.[0]).toMatchObject({ type: 'paragraph' });
    expect(row?.content?.[1].content?.[0].content?.[0].text).toBe('옮길 문장');
    editor.commands.undo();
    expect(editor.getJSON().content?.[0].content?.[0].content?.[0].content?.[0].text).toBe('옮길 문장');
    editor.destroy();
  });

  it('비어 있지 않은 열 행 삭제를 취소하면 문서가 그대로다', () => {
    const editor = instance({ type: 'doc', content: [columns()] });
    selectText(editor, 'A');
    const original = editor.getJSON();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(deleteColumns(editor)).toBe(false);
    expect(editor.getJSON()).toEqual(original);
    editor.destroy();
  });

  it('사진을 반대 열로 옮겨도 URL·대체 텍스트·캡션을 보존한다', () => {
    const editor = instance({ type: 'doc', content: [columns()] });
    let imagePos = 0;
    editor.state.doc.descendants((node, pos) => { if (node.type.name === 'image') imagePos = pos; });
    editor.commands.setNodeSelection(imagePos);
    expect(moveSelectedBlock(editor, 'otherColumn')).toBe(true);
    const image = editor.getJSON().content?.[0].content?.[0].content?.at(-1);
    expect(image).toMatchObject({ type: 'image', attrs: { src: '/c.png', alt: 'C', caption: '' } });
    editor.destroy();
  });
});
