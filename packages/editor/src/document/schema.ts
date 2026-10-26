import { getSchema } from '@tiptap/core';
import type { Schema } from '@tiptap/pm/model';
import { createBaseExtensions } from '../extensions/baseExtensions.js';

let schema: Schema | undefined;

export function getDocumentSchema(): Schema {
  return schema ??= getSchema(createBaseExtensions());
}
