import { describe, expect, it } from 'vitest';
import { createEmptyDocument, parseDocument } from '../src/index.js';

describe('문서 형식', () => {
  it('한글과 중첩 목록을 JSON 왕복해도 변경하지 않는다', () => {
    const document = {
      version: 1,
      content: { type: 'doc', content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '서울 여행' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [
          { type: 'paragraph', content: [{ type: 'text', text: '맛집', marks: [{ type: 'bold' }] }] },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }
        ] }] }
      ] }
    };
    const before = JSON.stringify(document);
    expect(parseDocument(JSON.parse(before))).toEqual({ ok: true, value: document });
    expect(JSON.stringify(document)).toBe(before);
  });

  it('미래 버전을 정상 문서로 읽지 않는다', () => {
    expect(parseDocument({ version: 2, content: { type: 'doc' } }))
      .toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_VERSION' } });
  });

  it('모르는 블록을 조용히 지우지 않는다', () => {
    expect(parseDocument({ version: 1, content: { type: 'doc', content: [{ type: 'mapCard' }] } }))
      .toMatchObject({ ok: false, error: { code: 'UNSUPPORTED_NODE' } });
  });

  it.each([
    { type: 'heading', attrs: { level: 4 } },
    { type: 'bulletList', content: [{ type: 'text', text: '목록 오류' }] },
    { type: 'paragraph', attrs: { onclick: 'alert(1)' } },
    { type: 'paragraph', content: [{ type: 'text', text: '' }] }
  ])('잘못된 구조와 속성을 거부한다: %j', node => {
    expect(parseDocument({ version: 1, content: { type: 'doc', content: [node] } }))
      .toMatchObject({ ok: false, error: { code: 'INVALID_DOCUMENT' } });
  });

  it.each([null, [], {}, { version: 1 }, { version: 1, content: { type: 'paragraph' } }])(
    '잘못된 입력에서 예외 대신 오류를 반환한다: %j', input => {
      expect(parseDocument(input)).toMatchObject({ ok: false });
    }
  );

  it('새 문서의 빈 문단을 안전하게 만든다', () => {
    expect(createEmptyDocument()).toEqual({ version: 1, content: { type: 'doc', content: [{ type: 'paragraph' }] } });
    expect(parseDocument(createEmptyDocument()).ok).toBe(true);
  });
});
