import type { Result } from '../document/types.js';
import { renderToMarkdown } from '@tiptap/static-renderer/pm/markdown';
import { parseDocument } from '../document/parseDocument.js';
import { createBaseExtensions } from '../extensions/baseExtensions.js';

export type MarkdownWarning = 'COLUMNS_FLATTENED' | 'CAPTION_AS_PARAGRAPH';
const join = (children: string | string[] | undefined) => Array.isArray(children) ? children.join('') : children ?? '';

function escapeText(text: string) {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  return text.replace(/[&<>]/g, char => entities[char]).replace(/[\\`*_[\]{}()#+.!|~\-]/g, '\\$&');
}

function destination(url: string) {
  return `<${url.replace(/</g, '%3C').replace(/>/g, '%3E')}>`;
}

function fence(text: string, minimum: number) {
  return '`'.repeat(Math.max(minimum, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)));
}

export function exportDocumentToMarkdown(input: unknown): Result<{ markdown: string; warnings: MarkdownWarning[] }> {
  const parsed = parseDocument(input);
  if (!parsed.ok) return parsed;
  const warnings = new Set<MarkdownWarning>();
  try {
    const markdown = renderToMarkdown({
      extensions: createBaseExtensions(),
      content: parsed.value.content,
      options: {
        nodeMapping: {
          doc: ({ children }) => join(children),
          text: ({ node, parent }) => parent?.type.name === 'codeBlock' || node.marks.some(mark => mark.type.name === 'code') ? node.text ?? '' : escapeText(node.text ?? ''),
          paragraph: ({ children }) => `${join(children)}\n\n`,
          heading: ({ node, children }) => `${'#'.repeat(node.attrs.level)} ${join(children)}\n\n`,
          bulletList: ({ children }) => `${join(children).trimEnd()}\n\n`,
          orderedList: ({ children }) => `${join(children).trimEnd()}\n\n`,
          taskList: ({ children }) => `${join(children).trimEnd()}\n\n`,
          listItem: ({ node, children, parent }) => {
            let number = parent?.attrs.start ?? 1;
            parent?.forEach((child, _offset, index) => { if (child === node) number += index; });
            const prefix = parent?.type.name === 'orderedList' ? `${number}. ` : '- ';
            return `${prefix}${join(children).trim().replace(/\n/g, `\n${' '.repeat(prefix.length)}`)}\n`;
          },
          taskItem: ({ node, children }) => `- [${node.attrs.checked ? 'x' : ' '}] ${join(children).trim().replace(/\n/g, '\n      ')}\n`,
          blockquote: ({ children }) => `${join(children).trim().split('\n').map(line => `> ${line}`).join('\n')}\n\n`,
          codeBlock: ({ node }) => {
            const delimiter = fence(node.textContent, 3);
            const language = /^[a-zA-Z0-9_+-]+$/.test(node.attrs.language ?? '') ? node.attrs.language : '';
            return `${delimiter}${language}\n${node.textContent}\n${delimiter}\n\n`;
          },
          hardBreak: () => '  \n',
          horizontalRule: () => '---\n\n',
          columns: ({ children }) => { warnings.add('COLUMNS_FLATTENED'); return join(children); },
          column: ({ children }) => join(children),
          image: ({ node }) => {
            const image = `![${escapeText(node.attrs.alt).replace(/\r?\n/g, ' ')}](${destination(node.attrs.src)})`;
            if (!node.attrs.caption) return `${image}\n\n`;
            warnings.add('CAPTION_AS_PARAGRAPH');
            return `${image}\n\n${escapeText(node.attrs.caption)}\n\n`;
          }
        },
        markMapping: {
          link: ({ mark, children }) => `[${join(children)}](${destination(mark.attrs.href)})`,
          code: ({ node }) => {
            const text = node.textContent;
            const delimiter = fence(text, 1);
            const padding = /^[` ]|[` ]$/.test(text) ? ' ' : '';
            return `${delimiter}${padding}${text}${padding}${delimiter}`;
          }
        }
      }
    }).trim();
    return { ok: true, value: { markdown, warnings: (['COLUMNS_FLATTENED', 'CAPTION_AS_PARAGRAPH'] as const).filter(warning => warnings.has(warning)) } };
  } catch {
    return { ok: false, error: { code: 'EXPORT_FAILED', message: 'Markdown으로 내보내지 못했습니다.' } };
  }
}
