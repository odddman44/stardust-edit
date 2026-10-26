import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import { createEmptyDocument } from '../index.js';
import { parseDocument } from '../document/parseDocument.js';
import { createBaseExtensions } from '../extensions/baseExtensions.js';
import { createSlashMenu } from '../extensions/slashMenu.js';
import { sanitizePastedHtml } from '../extensions/pastePolicy.js';
import DragHandle from '@tiptap/extension-drag-handle';
import { BlockMenu } from './BlockMenu.js';
import { FormatToolbar } from './FormatToolbar.js';
import { ImageView } from './ImageView.js';
import { createUploadPlaceholder } from '../extensions/uploadPlaceholder.js';
import { createEditorUploads } from '../uploads/editorUploads.js';
import FileHandler from '@tiptap/extension-file-handler';
import type { CosmosEditorProps } from './types.js';

export function CosmosEditor(props: CosmosEditorProps) {
  const [initial] = useState(() => parseDocument(props.initialDocument ?? createEmptyDocument()));
  const callbacks = useRef(props);
  callbacks.current = props;
  const [uploads] = useState(() => createEditorUploads(() => callbacks.current));
  const fileInput = useRef<HTMLInputElement>(null);
  const reportedError = useRef(false);
  const editor = useEditor({
    extensions: [...createBaseExtensions().map(extension => extension.name === 'image'
      ? extension.extend({ addNodeView: () => ReactNodeViewRenderer(ImageView) }) : extension),
    createUploadPlaceholder(uploads.getManager),
    FileHandler.configure({
      consumePasteEvent: true,
      onPaste: (instance, files) => uploads.addFiles(instance, files),
      onDrop: (instance, files, pos) => uploads.addFiles(instance, files, pos)
    }),
    createSlashMenu(), DragHandle.configure({
      render: () => {
        const handle = document.createElement('div');
        handle.className = 'cosmos-editor cosmos-drag-handle';
        handle.textContent = '⠿';
        handle.setAttribute('aria-hidden', 'true');
        return handle;
      }
    })],
    content: initial.ok ? initial.value.content : createEmptyDocument().content,
    immediatelyRender: false,
    editable: initial.ok,
    editorProps: {
      transformPastedHTML: sanitizePastedHtml,
      attributes: { class: 'cosmos-document', role: 'textbox', 'aria-label': '문서 본문', 'aria-multiline': 'true' }
    },
    onUpdate: () => uploads.reconcile()
  });

  useEffect(() => { if (editor && initial.ok) return uploads.attach(editor); }, [editor, initial, uploads]);

  useImperativeHandle(props.ref, () => ({
    getDocument() {
      if (!initial.ok) return initial;
      if (!editor) return { ok: false, error: { code: 'EDITOR_NOT_READY', message: '편집기를 준비하고 있습니다.' } };
      return uploads.getDocument();
    }
  }), [editor, initial, uploads]);

  useEffect(() => {
    if (!initial.ok && !reportedError.current) {
      reportedError.current = true;
      callbacks.current.onError?.(initial.error);
    }
  }, [initial]);

  if (!initial.ok) return <div className="cosmos-editor" role="alert">{initial.error.message}</div>;
  return <div className={['cosmos-editor', props.className].filter(Boolean).join(' ')}>
    {editor && <><div className="cosmos-editor-tools"><BlockMenu editor={editor} />
      <button className="cosmos-image-trigger" type="button" aria-label="사진 추가" disabled={!props.uploadImage} onMouseDown={event => event.preventDefault()} onClick={() => fileInput.current?.click()}>▧ <span>사진 추가</span></button>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden aria-label="사진 파일" disabled={!props.uploadImage}
        onChange={event => { uploads.addFiles(editor, Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    </div><FormatToolbar editor={editor} /></>}
    <EditorContent editor={editor} />
  </div>;
}
