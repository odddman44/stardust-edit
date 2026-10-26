import { renderToHTMLString } from '@tiptap/static-renderer/pm/html-string';
import { parseDocument } from '../document/parseDocument.js';
import type { Result } from '../document/types.js';
import { createBaseExtensions } from '../extensions/baseExtensions.js';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export function renderDocumentToHtml(input: unknown): Result<string> {
  const parsed = parseDocument(input);
  if (!parsed.ok) return parsed;
  try {
    const extensions = createBaseExtensions().map(extension => extension.name === 'taskItem' ? extension.extend({
      renderHTML({ node }: { node: ProseMirrorNode }) {
        return ['li', { 'data-type': 'taskItem', 'data-checked': node.attrs.checked },
          ['label', {}, ['input', { type: 'checkbox', disabled: 'disabled', checked: node.attrs.checked ? 'checked' : undefined, 'aria-label': node.textContent }], ['span']],
          ['div', {}, 0]];
      }
    }) : extension);
    const html = renderToHTMLString({ extensions, content: parsed.value.content });
    return { ok: true, value: `<div class="cosmos-document">${html}</div>` };
  } catch {
    return { ok: false, error: { code: 'RENDER_FAILED', message: '문서를 표시하지 못했습니다.' } };
  }
}
