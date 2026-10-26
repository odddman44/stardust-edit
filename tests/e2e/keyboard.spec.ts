import { expect, test } from '@playwright/test';
test.setTimeout(15000);

test('블록 메뉴에서 현재 문단을 위로 이동한다', async ({ page, browserName }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('첫 문단');
  await body.press('Enter');
  await page.keyboard.insertText('둘째 문단');
  await body.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
  await expect(page.getByRole('button', { name: '블록 메뉴', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(body.locator('p').first()).toHaveText('둘째 문단');
  await expect(body).toBeFocused();
});
