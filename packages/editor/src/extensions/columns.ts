import { Node } from '@tiptap/core';

export const RootDocument = Node.create({ name: 'doc', topNode: true, content: '(block | columns)+' });

export const Columns = Node.create({
  name: 'columns',
  group: 'layout',
  content: 'column column',
  defining: true,
  isolating: true,
  parseHTML: () => [{ tag: 'div[data-type="cosmos-columns"]' }],
  renderHTML: () => ['div', { class: 'cosmos-columns', 'data-type': 'cosmos-columns' }, 0]
});

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,
  parseHTML: () => [{ tag: 'div[data-type="cosmos-column"]' }],
  renderHTML: () => ['div', { class: 'cosmos-column', 'data-type': 'cosmos-column' }, 0]
});
