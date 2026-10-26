import type { Editor } from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';

export function getSelectedBlock(editor: Editor) {
  const { selection } = editor.state;
  const { $from, to } = selection;
  if (selection instanceof NodeSelection && ['doc', 'column'].includes($from.parent.type.name)) {
    return { node: selection.node, pos: selection.from, parent: $from.parent, parentPos: $from.start(), index: $from.index() };
  }
  for (let depth = $from.depth; depth > 0; depth--) {
    const parent = $from.node(depth - 1);
    if (!['doc', 'column'].includes(parent.type.name)) continue;
    const node = $from.node(depth);
    const pos = $from.before(depth);
    if (to > pos + node.nodeSize) return;
    return { node, pos, parent, parentPos: $from.start(depth - 1), index: $from.index(depth - 1) };
  }
}

export function moveSelectedBlock(editor: Editor, direction: 'up' | 'down' | 'otherColumn'): boolean {
  const selected = getSelectedBlock(editor);
  if (!selected) return false;
  const { node, pos, parent, index } = selected;
  if (direction === 'otherColumn') {
    if (parent.type.name !== 'column') return false;
    const boundary = editor.state.doc.resolve(selected.parentPos - 1);
    const row = boundary.parent;
    const rowPos = boundary.before();
    const sourceIndex = boundary.index();
    const targetIndex = 1 - sourceIndex;
    const children: import('@tiptap/pm/model').Node[][] = [[], []];
    row.forEach((column, _offset, columnIndex) => column.forEach((block, _blockOffset, blockIndex) => {
      if (columnIndex !== sourceIndex || blockIndex !== index) children[columnIndex].push(block);
    }));
    const target = children[targetIndex];
    if (target.length === 1 && target[0].type.name === 'paragraph' && target[0].content.size === 0) target.length = 0;
    target.push(node);
    if (!children[sourceIndex].length) children[sourceIndex].push(editor.schema.nodes.paragraph.create());
    const updated = row.type.create(null, children.map(blocks => editor.schema.nodes.column.create(null, blocks)));
    const tr = editor.state.tr.replaceWith(rowPos, rowPos + row.nodeSize, updated);
    const targetStart = rowPos + 2 + (targetIndex === 1 ? updated.firstChild!.nodeSize : 0);
    const blockStart = targetStart + target.slice(0, -1).reduce((size, block) => size + block.nodeSize, 0);
    tr.setSelection(node.isAtom ? NodeSelection.create(tr.doc, blockStart) : TextSelection.near(tr.doc.resolve(blockStart + 1)));
    editor.view.dispatch(tr.scrollIntoView());
    editor.commands.focus();
    return true;
  }
  const adjacentIndex = index + (direction === 'up' ? -1 : 1);
  if (adjacentIndex < 0 || adjacentIndex >= parent.childCount) return false;
  const adjacent = parent.child(adjacentIndex);
  const start = direction === 'up' ? pos - adjacent.nodeSize : pos;
  const content = direction === 'up' ? [node, adjacent] : [adjacent, node];
  const tr = editor.state.tr.replaceWith(start, start + adjacent.nodeSize + node.nodeSize, content);
  const destination = direction === 'up' ? start : start + adjacent.nodeSize;
  tr.setSelection(TextSelection.near(tr.doc.resolve(destination + 1)));
  editor.view.dispatch(tr.scrollIntoView());
  editor.commands.focus();
  return true;
}
