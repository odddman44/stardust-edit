import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
test.setTimeout(15000);

test('마크다운 단축키로 제목과 목록을 작성한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('');
  await body.pressSequentially('# ');
  await page.keyboard.insertText('나의 기록');
  await expect(body.locator('h1')).toHaveText('나의 기록');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- ');
  await page.keyboard.insertText('골목 걷기');
  await expect(body.locator('ul li')).toContainText('골목 걷기');
});

test('외부 문서 붙여넣기에서 텍스트와 링크만 보존한다', async ({ page }) => {
  let imageRequests = 0;
  await page.route('https://example.invalid/**', route => { imageRequests++; return route.abort(); });
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('');
  for (const name of ['notion', 'googleDocs']) {
    const html = readFileSync(`tests/fixtures/${name}.html`, 'utf8');
    await body.evaluate((element, markup) => {
      const clipboardData = new DataTransfer();
      const template = document.createElement('template');
      template.innerHTML = markup;
      const text = template.content.textContent ?? '';
      // Firefox는 합성 ClipboardEvent의 데이터를 비우므로 외부 입력 경계만 주입한다.
      Object.defineProperty(clipboardData, 'getData', { value: (format: string) => format === 'text/html' ? markup : format === 'text/plain' ? text : '' });
      Object.defineProperty(clipboardData, 'types', { value: ['text/html', 'text/plain'] });
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: clipboardData });
      element.dispatchEvent(event);
    }, html);
  }
  await expect(body).toContainText('노션에서 가져온 제목');
  await expect(body).toContainText('문서에서 가져온 제목');
  await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com');
  await expect(body.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { pasteExecuted?: boolean }).pasteExecuted)).toBeUndefined();
  expect(imageRequests).toBe(0);
});

test('슬래시 메뉴를 키보드로 선택하고 닫는다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('');
  await body.pressSequentially('/');
  await expect(page.getByRole('listbox', { name: '블록 선택' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('새 제목');
  await expect(body.locator('h1')).toHaveText('새 제목');
  await page.keyboard.press('Enter');
  await page.keyboard.type('/');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox', { name: '블록 선택' })).toHaveCount(0);
  await expect(body).toBeFocused();
});

test('선택한 본문에 서식을 적용하고 링크를 안전하게 만든다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('기억할 문장');
  await body.press('Meta+a');
  await page.getByRole('button', { name: '굵게', exact: true }).click();
  await expect(body.locator('strong')).toHaveText('기억할 문장');
  await page.getByRole('button', { name: '링크', exact: true }).click();
  await page.getByRole('textbox', { name: '링크 주소' }).fill('https://example.com');
  await page.getByRole('button', { name: '링크 적용' }).click();
  await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com');
});
