import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState } from '@tiptap/react';
import { isSafeLinkUrl } from '../document/urlPolicy.js';

export function FormatToolbar({ editor }: { editor: Editor }) {
  const marks = useEditorState({ editor, selector: ({ editor: current }) => ({
    bold: current.isActive('bold'), italic: current.isActive('italic'), strike: current.isActive('strike'), code: current.isActive('code')
  }) });
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  return <BubbleMenu editor={editor} options={{ placement: 'top' }} shouldShow={({ state }) => !state.selection.empty && !editor.view.composing}>
    <div className="cosmos-editor cosmos-format-menu" role="toolbar" aria-label="글자 서식">
      <button type="button" aria-label="굵게" aria-pressed={marks.bold} onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
      <button type="button" aria-label="기울임" aria-pressed={marks.italic} onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
      <button type="button" aria-label="취소선" aria-pressed={marks.strike} onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
      <button type="button" aria-label="인라인 코드" aria-pressed={marks.code} onMouseDown={event => event.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()}>&lt;/&gt;</button>
      <button type="button" aria-label="링크" onMouseDown={event => event.preventDefault()} onClick={() => { setUrl(editor.getAttributes('link').href ?? ''); setError(''); setLinkOpen(value => !value); }}>↗</button>
      {linkOpen && <form className="cosmos-link-form" onSubmit={event => {
        event.preventDefault();
        if (url && !isSafeLinkUrl(url)) { setError('http·https·mailto·tel 주소를 입력해주세요.'); return; }
        const chain = editor.chain().focus().extendMarkRange('link');
        if (url) chain.setLink({ href: url }).run(); else chain.unsetLink().run();
        setLinkOpen(false);
      }}>
        <label>링크 주소<input aria-label="링크 주소" value={url} onChange={event => setUrl(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') { setLinkOpen(false); editor.commands.focus(); } }} /></label>
        <button type="submit">링크 적용</button>
        {error && <span role="alert">{error}</span>}
      </form>}
    </div>
  </BubbleMenu>;
}
