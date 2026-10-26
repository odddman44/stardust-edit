import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string';
import { parseDocument } from '../document/parseDocument.js';
import type { Result } from '../document/types.js';
import { createBaseExtensions } from '../extensions/baseExtensions.js';

export function renderDocumentToHtml(input: unknown): Result<string> {
  const parsed = parseDocument(input);
  if (!parsed.ok) return parsed;
  try {
    const html = renderToHTMLString({ extensions: createBaseExtensions(), content: parsed.value.content });
    return { ok: true, value: `<div class="cosmos-document">${html}</div>` };
  } catch {
    return { ok: false, error: { code: 'RENDER_FAILED', message: '문서를 표시하지 못했습니다.' } };
  }
}
