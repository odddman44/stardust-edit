import { forwardRef, useImperativeHandle, useState } from 'react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { BlockAction } from '../extensions/blockActions.js';

export type SlashMenuHandle = { onKeyDown: (props: SuggestionKeyDownProps) => boolean };

export const SlashMenu = forwardRef<SlashMenuHandle, SuggestionProps<BlockAction, BlockAction>>(function SlashMenu(props, ref) {
  const [selection, setSelection] = useState(0);
  const index = Math.min(selection, Math.max(0, props.items.length - 1));
  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.isComposing || event.keyCode === 229 || !props.items.length) return false;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        setSelection((index + (event.key === 'ArrowDown' ? 1 : -1) + props.items.length) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') { props.command(props.items[index]); return true; }
      return false;
    }
  }), [index, props]);

  return <div className="cosmos-slash-menu" role="listbox" aria-label="블록 선택">
    <div className="cosmos-menu-label">블록 추가</div>
    {props.items.map((item, itemIndex) => <button type="button" key={item.id} role="option" aria-selected={itemIndex === index}
      onMouseDown={event => event.preventDefault()} onClick={() => props.command(item)}>
      <span>{item.label}</span><span className="cosmos-menu-hint">{item.hint}</span>
    </button>)}
    {!props.items.length && <p className="cosmos-menu-empty">일치하는 블록이 없습니다.</p>}
  </div>;
});
