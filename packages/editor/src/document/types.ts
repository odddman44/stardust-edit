import type { JSONContent } from '@tiptap/core';

export type CosmosDocument = { version: 1; content: JSONContent };
export type EditorErrorCode = 'INVALID_DOCUMENT' | 'UNSUPPORTED_VERSION' | 'UNSUPPORTED_NODE'
  | 'UNSAFE_URL' | 'RENDER_FAILED' | 'EXPORT_FAILED' | 'EDITOR_NOT_READY'
  | 'UPLOAD_UNAVAILABLE' | 'UPLOAD_FAILED' | 'UPLOAD_INCOMPLETE';
export type EditorError = { code: EditorErrorCode; message: string; path?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: EditorError };
