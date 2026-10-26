import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { isSafeLinkUrl } from '../document/urlPolicy.js';

export function createBaseExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      underline: false,
      trailingNode: false,
      link: {
        openOnClick: false,
        isAllowedUri: isSafeLinkUrl,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' }
      }
    }),
    TaskList,
    TaskItem.configure({ nested: true })
  ];
}
