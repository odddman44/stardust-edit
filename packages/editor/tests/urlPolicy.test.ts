import { describe, expect, it } from 'vitest';
import { isSafeImageUrl, isSafeLinkUrl } from '../src/document/urlPolicy.js';

describe('URL 정책', () => {
  it.each(['https://example.com/글', 'http://localhost:3000', 'mailto:a@example.com', 'tel:01012345678'])(
    '안전한 링크를 허용한다: %s', value => expect(isSafeLinkUrl(value)).toBe(true)
  );
  it.each(['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,test', '//evil.test/x', ' https://a.test', 'https://a.test\\x'])(
    '위험하거나 모호한 링크를 거부한다: %s', value => expect(isSafeLinkUrl(value)).toBe(false)
  );
  it.each(['https://a.test/photo.png', '/demo-photo.png'])(
    '영구 이미지 경로를 허용한다: %s', value => expect(isSafeImageUrl(value)).toBe(true)
  );
  it.each(['blob:test', 'data:image/png;base64,a', 'mailto:a@test.com', '//evil.test/image.png'])(
    '임시 이미지와 비이미지 프로토콜을 거부한다: %s', value => expect(isSafeImageUrl(value)).toBe(false)
  );
});
