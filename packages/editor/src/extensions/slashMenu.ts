import { Extension, ReactRenderer } from '@tiptap/react';
import Suggestion, { exitSuggestion } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { SlashMenu } from '../react/SlashMenu.js';
import type { SlashMenuHandle } from '../react/SlashMenu.js';
import { blockActions } from './blockActions.js';
import type { BlockAction } from './blockActions.js';

const key = new PluginKey('cosmosSlashMenu');

export function createSlashMenu() {
  return Extension.create({
    name: 'cosmosSlashMenu',
    addProseMirrorPlugins() {
      return [Suggestion<BlockAction, BlockAction>({
        editor: this.editor,
        pluginKey: key,
        char: '/',
        startOfLine: true,
        allow: ({ state }) => !this.editor.view.composing && !state.selection.$from.parent.type.spec.code,
        items: ({ query }) => blockActions.filter(item => `${item.label} ${item.id}`.toLowerCase().includes(query.toLowerCase())),
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.run(editor);
        },
        render: () => {
          let component: ReactRenderer<SlashMenuHandle> | undefined;
          let unmount: (() => void) | undefined;
          return {
            onStart: props => {
              component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              component.element.classList.add('cosmos-editor', 'cosmos-menu-portal');
              unmount = props.mount(component.element);
            },
            onUpdate: props => component?.updateProps(props),
            onKeyDown: props => {
              if (props.event.isComposing || props.event.keyCode === 229 || props.view.composing) return false;
              if (props.event.key === 'Escape') { exitSuggestion(props.view, key); return true; }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => { unmount?.(); component?.destroy(); }
          };
        }
      })];
    }
  });
}
