import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { createEmptyDocument } from '../index.js';
import { parseDocument } from '../document/parseDocument.js';
import { createBaseExtensions } from '../extensions/baseExtensions.js';
import type { CosmosEditorProps } from './types.js';

export function CosmosEditor(props: CosmosEditorProps) {
  const [initial] = useState(() => parseDocument(props.initialDocument ?? createEmptyDocument()));
  const callbacks = useRef(props);
  callbacks.current = props;
  const reportedError = useRef(false);
  const editor = useEditor({
    extensions: createBaseExtensions(),
    content: initial.ok ? initial.value.content : createEmptyDocument().content,
    immediatelyRender: false,
    editable: initial.ok,
    editorProps: {
      attributes: { class: 'cosmos-document', role: 'textbox', 'aria-label': '문서 본문', 'aria-multiline': 'true' }
    },
    onUpdate: ({ editor: instance }) => {
      const result = parseDocument({ version: 1, content: instance.getJSON() });
      if (result.ok) callbacks.current.onChange?.(result.value, { pendingUploadCount: 0, failedUploadCount: 0 });
      else callbacks.current.onError?.(result.error);
    }
  });

  useImperativeHandle(props.ref, () => ({
    getDocument() {
      if (!initial.ok) return initial;
      if (!editor) return { ok: false, error: { code: 'EDITOR_NOT_READY', message: '편집기를 준비하고 있습니다.' } };
      return parseDocument({ version: 1, content: editor.getJSON() });
    }
  }), [editor, initial]);

  useEffect(() => {
    if (!initial.ok && !reportedError.current) {
      reportedError.current = true;
      callbacks.current.onError?.(initial.error);
    }
  }, [initial]);

  if (!initial.ok) return <div className="cosmos-editor" role="alert">{initial.error.message}</div>;
  return <div className={['cosmos-editor', props.className].filter(Boolean).join(' ')}>
    <EditorContent editor={editor} />
  </div>;
}
