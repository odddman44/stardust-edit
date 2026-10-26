import { describe, expect, it } from 'vitest';
import { renderDocumentToHtml } from '../src/renderer.js';

const document = { version: 1, content: { type: 'doc', content: [
  { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '서울 여행' }] },
  { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '예약' }] }] }] },
  { type: 'codeBlock', content: [{ type: 'text', text: '<script>alert(1)</script>' }] }
] } };

describe('서버 읽기 렌더러', () => {
  it('한글과 기본 블록을 편집 UI 없이 출력한다', () => {
    const result = renderDocumentToHtml(document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('class="cosmos-document"');
    expect(result.value).toContain('<h1>서울 여행</h1>');
    expect(result.value).toContain('data-type="taskList"');
    expect(result.value).not.toMatch(/contenteditable|cosmos-toolbar|cosmos-block-menu/);
  });

  it('태그 형태의 본문을 HTML로 실행하지 않는다', () => {
    const result = renderDocumentToHtml(document);
    expect(result.ok && result.value).toContain('&lt;script&gt;');
    expect(result.ok && result.value).not.toContain('<script>');
  });

  it('읽기 화면의 체크박스는 변경할 수 없게 출력한다', () => {
    const result = renderDocumentToHtml(document);
    expect(result.ok && result.value).toMatch(/<input[^>]*disabled/);
  });

  it('위험한 링크를 출력하지 않는다', () => {
    const input = { version: 1, content: { type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: '링크', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }
    ] } };
    expect(renderDocumentToHtml(input)).toMatchObject({ ok: false, error: { code: 'UNSAFE_URL' } });
  });

  it('이벤트 속성이나 미래 버전을 조용히 출력하지 않는다', () => {
    expect(renderDocumentToHtml({ version: 2 })).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_VERSION' } });
    expect(renderDocumentToHtml({ version: 1, content: { type: 'doc', content: [{ type: 'paragraph', attrs: { onclick: 'alert(1)' } }] } }))
      .toMatchObject({ ok: false, error: { code: 'INVALID_DOCUMENT' } });
  });
});
