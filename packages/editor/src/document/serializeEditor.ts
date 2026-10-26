import type { Editor, JSONContent } from '@tiptap/core';
import type { CosmosDocument, Result } from './types.js';
import { parseDocument } from './parseDocument.js';

function permanentNode(node: JSONContent): JSONContent | undefined {
  if (node.type === 'uploadPlaceholder') return;
  const result = { ...node };
  if (node.content) {
    result.content = node.content.map(permanentNode).filter((child): child is JSONContent => child !== undefined);
    if (!result.content.length && ['doc', 'column', 'listItem', 'taskItem', 'blockquote'].includes(node.type ?? '')) {
      result.content = [{ type: 'paragraph' }];
    }
  }
  return result;
}

export function serializeEditorDocument(editor: Editor): Result<CosmosDocument> {
  return parseDocument({ version: 1, content: permanentNode(editor.getJSON()) });
}
