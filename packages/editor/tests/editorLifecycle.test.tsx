// @vitest-environment jsdom
import { StrictMode, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CosmosEditor } from '../src/react.js';
import type { CosmosEditorHandle } from '../src/react.js';
import type { CosmosDocument } from '../src/index.js';

afterEach(cleanup);
const initial: CosmosDocument = { version: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '서울 여행' }] }] } };

describe('React 편집기 수명', () => {
  it('런타임 null 문서를 새 문서로 바꾸지 않는다', async () => {
    const ref = createRef<CosmosEditorHandle>();
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<CosmosEditor initialDocument={null as unknown as CosmosDocument} ref={ref} onChange={onChange} onError={onError} />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(ref.current?.getDocument()).toMatchObject({ ok: false, error: { code: 'INVALID_DOCUMENT' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_DOCUMENT' }));
  });

  it('초기 문서를 표시하고 선택 이동이나 재렌더로 초기화하지 않는다', async () => {
    const ref = createRef<CosmosEditorHandle>();
    const onChange = vi.fn();
    const { rerender } = render(<CosmosEditor initialDocument={initial} ref={ref} onChange={onChange} />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: '문서 본문' }).textContent).toBe('서울 여행'));
    rerender(<CosmosEditor ref={ref} onChange={onChange} />);
    expect(screen.getByRole('textbox', { name: '문서 본문' }).textContent).toBe('서울 여행');
    expect(ref.current?.getDocument()).toMatchObject({ ok: true, value: { version: 1 } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('미래 문서를 빈 문서로 덮어쓰지 않는다', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<CosmosEditor initialDocument={{ version: 2 } as unknown as CosmosDocument} onChange={onChange} onError={onError} />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('버전'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNSUPPORTED_VERSION' }));
  });

  it('StrictMode에서 문서 변경 콜백을 중복 통지하지 않는다', async () => {
    const onChange = vi.fn();
    render(<StrictMode><CosmosEditor initialDocument={initial} onChange={onChange} /></StrictMode>);
    const textbox = await screen.findByRole('textbox', { name: '문서 본문' });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    textbox.innerHTML = '<p>부산 여행</p>';
    fireEvent.input(textbox, { inputType: 'insertText', data: '부산 여행' });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.calls[0][0].content.content[0].content[0].text).toBe('부산 여행');
  });

  it('key가 바뀌면 이전 문서의 상태를 새 문서에 섞지 않는다', async () => {
    const ref = createRef<CosmosEditorHandle>();
    const { rerender } = render(<CosmosEditor key="A" initialDocument={initial} ref={ref} />);
    await screen.findByRole('textbox');
    rerender(<CosmosEditor key="B" ref={ref} />);
    await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
    expect(ref.current?.getDocument()).toMatchObject({ ok: true, value: { content: { content: [{ type: 'paragraph' }] } } });
  });
});
