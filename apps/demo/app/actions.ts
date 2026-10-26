'use server';

import { renderDocumentToHtml } from '@cosmoslog/editor/renderer';
import type { Result } from '@cosmoslog/editor';

export async function renderPreview(input: unknown): Promise<Result<string>> {
  return renderDocumentToHtml(input);
}
