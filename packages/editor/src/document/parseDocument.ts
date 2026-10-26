import type { JSONContent } from '@tiptap/core';
import type { AttributeSpec } from '@tiptap/pm/model';
import { getDocumentSchema } from './schema.js';
import type { CosmosDocument, EditorError, EditorErrorCode, Result } from './types.js';
import { isSafeImageUrl, isSafeLinkUrl } from './urlPolicy.js';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function error(code: EditorErrorCode, path: string): EditorError {
  const message = code === 'UNSAFE_URL' ? '허용하지 않는 URL입니다.'
    : code === 'UNSUPPORTED_NODE' ? '지원하지 않는 블록입니다.'
      : '문서의 구조나 속성이 올바르지 않습니다.';
  return { code, message, path };
}

function checkAttrs(value: unknown, specs: Record<string, AttributeSpec> | undefined, path: string): EditorError | undefined {
  if (value === undefined) return;
  if (!record(value)) return error('INVALID_DOCUMENT', path);
  for (const [key, attr] of Object.entries(value)) {
    if (!specs || !Object.hasOwn(specs, key)) return error('INVALID_DOCUMENT', `${path}.${key}`);
    const fallback = specs[key].default;
    if (fallback === null ? attr !== null && typeof attr !== 'string' : typeof attr !== typeof fallback) {
      return error('INVALID_DOCUMENT', `${path}.${key}`);
    }
    if (typeof attr === 'number' && !Number.isSafeInteger(attr)) return error('INVALID_DOCUMENT', path);
  }
}

function checkNode(value: unknown, path: string, depth = 0): EditorError | undefined {
  if (!record(value) || typeof value.type !== 'string' || depth > 100) return error('INVALID_DOCUMENT', path);
  const schema = getDocumentSchema();
  const nodeType = schema.nodes[value.type];
  if (!nodeType) return error('UNSUPPORTED_NODE', path);
  if (Object.keys(value).some(key => !['type', 'attrs', 'text', 'content', 'marks'].includes(key))) return error('INVALID_DOCUMENT', path);
  const attrError = checkAttrs(value.attrs, nodeType.spec.attrs, `${path}.attrs`);
  if (attrError) return attrError;
  const attrs = record(value.attrs) ? value.attrs : {};
  if (value.type === 'heading' && attrs.level !== undefined && ![1, 2, 3].includes(attrs.level as number)) return error('INVALID_DOCUMENT', path);
  if (value.type === 'orderedList' && attrs.start !== undefined && (attrs.start as number) < 1) return error('INVALID_DOCUMENT', path);
  if (value.type === 'image' && (typeof attrs.src !== 'string' || !isSafeImageUrl(attrs.src))) return error('UNSAFE_URL', path);
  if (value.type === 'text' ? typeof value.text !== 'string' || !value.text.length || value.content !== undefined || value.attrs !== undefined : value.text !== undefined) {
    return error('INVALID_DOCUMENT', path);
  }
  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks)) return error('INVALID_DOCUMENT', path);
    for (const mark of value.marks) {
      if (!record(mark) || typeof mark.type !== 'string' || !schema.marks[mark.type]) return error('INVALID_DOCUMENT', path);
      if (Object.keys(mark).some(key => !['type', 'attrs'].includes(key))) return error('INVALID_DOCUMENT', path);
      const markError = checkAttrs(mark.attrs, schema.marks[mark.type].spec.attrs, `${path}.marks`);
      if (markError) return markError;
      if (mark.type === 'link' && (!record(mark.attrs) || typeof mark.attrs.href !== 'string' || !isSafeLinkUrl(mark.attrs.href))) return error('UNSAFE_URL', path);
    }
  }
  if (value.content !== undefined) {
    if (!Array.isArray(value.content)) return error('INVALID_DOCUMENT', path);
    for (let i = 0; i < value.content.length; i++) {
      const childError = checkNode(value.content[i], `${path}.content[${i}]`, depth + 1);
      if (childError) return childError;
    }
  }
}

export function parseDocument(input: unknown): Result<CosmosDocument> {
  try {
    if (!record(input)) return { ok: false, error: error('INVALID_DOCUMENT', '$') };
    if (input.version !== undefined && input.version !== 1) {
      return { ok: false, error: { code: 'UNSUPPORTED_VERSION', message: '지원하지 않는 문서 버전입니다.', path: '$.version' } };
    }
    if (input.version !== 1 || Object.keys(input).some(key => !['version', 'content'].includes(key)) || !record(input.content) || input.content.type !== 'doc') {
      return { ok: false, error: error('INVALID_DOCUMENT', '$') };
    }
    const failure = checkNode(input.content, '$.content');
    if (failure) return { ok: false, error: failure };
    getDocumentSchema().nodeFromJSON(input.content).check();
    return { ok: true, value: { version: 1, content: structuredClone(input.content) as JSONContent } };
  } catch {
    return { ok: false, error: error('INVALID_DOCUMENT', '$.content') };
  }
}
