import { forwardRef, useEffect, useId, useImperativeHandle, useState } from 'react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { BlockAction } from '../extensions/blockActions.js';

export type SlashMenuHandle = { onKeyDown: (props: SuggestionKeyDownProps) => boolean };

export const SlashMenu = forwardRef<SlashMenuHandle, SuggestionProps<BlockAction, BlockAction>>(function SlashMenu(props, ref) {
  const [selection, setSelection] = useState(0);
  const listId = useId();
  const index = Math.min(selection, Math.max(0, props.items.length - 1));
  useEffect(() => {
    const dom = props.editor.view.dom;
    dom.setAttribute('aria-controls', listId);
    dom.setAttribute('aria-expanded', 'true');
    dom.setAttribute('aria-autocomplete', 'list');
    if (props.items[index]) dom.setAttribute('aria-activedescendant', `${listId}-${index}`);
    else dom.removeAttribute('aria-activedescendant');
    return () => { for (const key of ['aria-controls', 'aria-expanded', 'aria-autocomplete', 'aria-activedescendant']) dom.removeAttribute(key); };
  }, [listId, index, props.editor, props.items]);
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

  return <div className="cosmos-slash-menu" id={listId} role="listbox" aria-label="블록 선택">
    <div className="cosmos-menu-label">블록 추가</div>
    {props.items.map((item, itemIndex) => <button type="button" key={item.id} id={`${listId}-${itemIndex}`} role="option" aria-selected={itemIndex === index}
      onMouseDown={event => event.preventDefault()} onClick={() => props.command(item)}>
      <span>{item.label}</span><span className="cosmos-menu-hint">{item.hint}</span>
    </button>)}
    {!props.items.length && <p className="cosmos-menu-empty">일치하는 블록이 없습니다.</p>}
  </div>;
});
