import { describe, expect, it } from 'vitest';
import { exportDocumentToMarkdown } from '../src/renderer.js';

const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const doc = (nodes: unknown[]) => ({ version: 1, content: { type: 'doc', content: nodes } });

describe('Markdown 내보내기', () => {
  it('제목과 일반 텍스트의 기호를 구분한다', () => {
    const result = exportDocumentToMarkdown(doc([{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '여행 기록' }] }, p('별표 * 그대로')]));
    expect(result).toEqual({ ok: true, value: { markdown: '## 여행 기록\n\n별표 \\* 그대로', warnings: [] } });
  });

  it('2열을 왼쪽·오른쪽 순서로 풀고 경고를 한 번 전달한다', () => {
    const row = { type: 'columns', content: [{ type: 'column', content: [p('A'), p('B')] }, { type: 'column', content: [p('C'), p('D')] }] };
    expect(exportDocumentToMarkdown(doc([row, row]))).toEqual({ ok: true, value: { markdown: 'A\n\nB\n\nC\n\nD\n\nA\n\nB\n\nC\n\nD', warnings: ['COLUMNS_FLATTENED'] } });
  });

  it('사진 캡션을 별도 문단에 유지하고 alt와 URL 괄호를 이스케이프한다', () => {
    const result = exportDocumentToMarkdown(doc([{ type: 'image', attrs: { src: 'https://example.com/a(b).png', alt: '[커피]', caption: '오후의 기록' } }]));
    expect(result).toEqual({ ok: true, value: { markdown: '![\\[커피\\]](<https://example.com/a(b).png>)\n\n오후의 기록', warnings: ['CAPTION_AS_PARAGRAPH'] } });
  });

  it('코드 안의 백틱보다 긴 fence로 원문을 보존한다', () => {
    expect(exportDocumentToMarkdown(doc([{ type: 'codeBlock', attrs: { language: 'js' }, content: [{ type: 'text', text: 'const mark = "```";\n<script>literal</script>' }] }]))).toMatchObject({ ok: true, value: { markdown: '````js\nconst mark = "```";\n<script>literal</script>\n````' } });
  });

  it('체크리스트와 시작 번호가 있는 목록을 보존한다', () => {
    const result = exportDocumentToMarkdown(doc([
      { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [p('예약')] }] },
      { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [p('세 번째')] }, { type: 'listItem', content: [p('네 번째')] }] }
    ]));
    expect(result).toMatchObject({ ok: true, value: { markdown: '- [x] 예약\n\n3. 세 번째\n4. 네 번째' } });
  });

  it('링크 레이블의 괄호와 HTML 같은 텍스트를 안전하게 출력한다', () => {
    const result = exportDocumentToMarkdown(doc([{ type: 'paragraph', content: [{ type: 'text', text: '[링크]', marks: [{ type: 'link', attrs: { href: 'https://example.com/a(b)' } }] }, { type: 'text', text: ' <script> & 기호' }] }]));
    expect(result).toMatchObject({ ok: true, value: { markdown: '[\\[링크\\]](<https://example.com/a(b)>) &lt;script&gt; &amp; 기호' } });
  });

  it('미래 버전과 임시 업로드 문서를 내보내지 않는다', () => {
    expect(exportDocumentToMarkdown({ version: 2 })).toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_VERSION' } });
    expect(exportDocumentToMarkdown(doc([{ type: 'uploadPlaceholder' }]))).toMatchObject({ ok: false });
  });
});
