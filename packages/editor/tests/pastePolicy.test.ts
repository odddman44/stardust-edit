// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizePastedHtml } from '../src/extensions/pastePolicy.js';

describe('외부 HTML 붙여넣기', () => {
  it('스크립트·이벤트·외부 이미지·스타일을 제거하고 본문은 보존한다', () => {
    const html = sanitizePastedHtml('<h2 style="color:red" onclick="alert(1)">제목</h2><ul><li>목록</li></ul><img src="https://evil.test/a"><script>alert(1)</script><a href="javascript:alert(1)">링크</a>');
    expect(html).toContain('<h2>제목</h2>');
    expect(html).toContain('<ul><li>목록</li></ul>');
    expect(html).toContain('링크');
    expect(html).not.toMatch(/script|onclick|style=|<img|javascript:/);
  });

  it('안전한 링크와 지원하지 않는 컨테이너 안의 텍스트를 유지한다', () => {
    const html = sanitizePastedHtml('<section><a href="https://example.com" target="evil">설명</a></section>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('설명');
    expect(html).not.toContain('target="evil"');
  });
});
