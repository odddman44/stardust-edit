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
  if (!selected || direction === 'otherColumn') return false;
  const { node, pos, parent, index } = selected;
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
