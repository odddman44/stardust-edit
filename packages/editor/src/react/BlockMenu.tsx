import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { blockActions } from '../extensions/blockActions.js';
import { moveSelectedBlock } from '../extensions/moveBlock.js';

export function BlockMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) menuRef.current?.querySelector('button')?.focus(); }, [open]);
  function run(action: () => void) { action(); setOpen(false); editor.commands.focus(); }

  return <div className="cosmos-block-control">
    <button type="button" className="cosmos-block-trigger" aria-label="블록 메뉴" aria-expanded={open} aria-haspopup="menu"
      onMouseDown={event => event.preventDefault()} onClick={() => setOpen(value => !value)}>＋ <span>블록</span></button>
    {open && <div role="menu" aria-label="블록 편집" className="cosmos-block-menu" ref={menuRef} onKeyDown={event => {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') { event.preventDefault(); run(() => {}); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const buttons = Array.from(menuRef.current?.querySelectorAll('button') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}>
      {blockActions.map(action => <button type="button" role="menuitem" key={action.id} onClick={() => run(() => { action.run(editor); })}>{action.label}<span className="cosmos-menu-hint">{action.hint}</span></button>)}
      <div className="cosmos-menu-divider" />
      <button type="button" role="menuitem" onClick={() => run(() => { moveSelectedBlock(editor, 'up'); })}>위로 이동</button>
      <button type="button" role="menuitem" onClick={() => run(() => { moveSelectedBlock(editor, 'down'); })}>아래로 이동</button>
    </div>}
  </div>;
}
