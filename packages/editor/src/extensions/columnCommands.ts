import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { getSelectedBlock } from './moveBlock.js';

export function getSelectedColumns(editor: Editor) {
  const { selection } = editor.state;
  if (selection instanceof NodeSelection && selection.node.type.name === 'columns') return { node: selection.node, pos: selection.from };
  for (let depth = selection.$from.depth; depth > 0; depth--) {
    if (selection.$from.node(depth).type.name === 'columns') return { node: selection.$from.node(depth), pos: selection.$from.before(depth) };
  }
}

export function createColumns(editor: Editor): boolean {
  const selected = getSelectedBlock(editor);
  if (!selected || selected.parent.type.name !== 'doc' || selected.node.type.name === 'columns') return false;
  const { columns, column, paragraph } = editor.schema.nodes;
  const row = columns.create(null, [column.create(null, selected.node), column.create(null, paragraph.create())]);
  const tr = editor.state.tr.replaceWith(selected.pos, selected.pos + selected.node.nodeSize, row);
  tr.setSelection(TextSelection.near(tr.doc.resolve(selected.pos + 3)));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}

export function unwrapColumns(editor: Editor): boolean {
  const selected = getSelectedColumns(editor);
  if (!selected) return false;
  const blocks: ProseMirrorNode[] = [];
  selected.node.forEach(column => column.forEach(block => blocks.push(block)));
  const tr = editor.state.tr.replaceWith(selected.pos, selected.pos + selected.node.nodeSize, blocks);
  tr.setSelection(TextSelection.near(tr.doc.resolve(selected.pos + 1)));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}

export function deleteColumns(editor: Editor): boolean {
  const selected = getSelectedColumns(editor);
  if (!selected) return false;
  let empty = true;
  selected.node.forEach(column => {
    if (column.childCount !== 1 || column.firstChild?.type.name !== 'paragraph' || column.firstChild.content.size !== 0) empty = false;
  });
  if (!empty && !window.confirm('열 안의 내용을 모두 삭제할까요?')) return false;
  editor.view.dispatch(editor.state.tr.delete(selected.pos, selected.pos + selected.node.nodeSize).scrollIntoView());
  editor.commands.focus();
  return true;
}
