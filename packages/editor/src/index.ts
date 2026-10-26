import type { CosmosDocument } from './document/types.js';
export type { CosmosDocument, EditorError, EditorErrorCode, Result } from './document/types.js';
export { parseDocument } from './document/parseDocument.js';

export function createEmptyDocument(): CosmosDocument {
  return { version: 1, content: { type: 'doc', content: [{ type: 'paragraph' }] } };
}
