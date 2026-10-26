import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { isSafeLinkUrl } from '../document/urlPolicy.js';
import { ImageNode } from './image.js';
import { RootDocument, Columns, Column } from './columns.js';

export function createBaseExtensions(): Extensions {
  return [
    StarterKit.configure({
      document: false,
      heading: { levels: [1, 2, 3] },
      underline: false,
      trailingNode: false,
      link: {
        openOnClick: false,
        isAllowedUri: isSafeLinkUrl,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' }
      }
    }),
    RootDocument, Columns, Column, ImageNode,
    TaskList,
    TaskItem.configure({ nested: true, HTMLAttributes: { 'data-type': 'taskItem' } })
  ];
}
