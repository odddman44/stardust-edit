import type { Editor } from '@tiptap/core';

export type BlockAction = { id: string; label: string; hint: string; run: (editor: Editor) => boolean };
export const blockActions: BlockAction[] = [
  { id: 'paragraph', label: '문단', hint: '기본 텍스트', run: editor => editor.chain().focus().setParagraph().run() },
  { id: 'heading1', label: '제목 1', hint: '#', run: editor => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'heading2', label: '제목 2', hint: '##', run: editor => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'heading3', label: '제목 3', hint: '###', run: editor => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bulletList', label: '글머리 목록', hint: '-', run: editor => editor.chain().focus().toggleBulletList().run() },
  { id: 'orderedList', label: '번호 목록', hint: '1.', run: editor => editor.chain().focus().toggleOrderedList().run() },
  { id: 'taskList', label: '체크리스트', hint: '[]', run: editor => editor.chain().focus().toggleTaskList().run() },
  { id: 'blockquote', label: '인용', hint: '>', run: editor => editor.chain().focus().toggleBlockquote().run() },
  { id: 'codeBlock', label: '코드 블록', hint: '```', run: editor => editor.chain().focus().toggleCodeBlock().run() },
  { id: 'horizontalRule', label: '구분선', hint: '---', run: editor => editor.chain().focus().setHorizontalRule().run() }
];
