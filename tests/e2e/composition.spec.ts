import { expect, test } from '@playwright/test';
test.setTimeout(15000);

test('한글 조합 중 Enter를 블록 메뉴 명령으로 실행하지 않는다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('');
  await body.pressSequentially('/');
  await expect(page.getByRole('listbox', { name: '블록 선택' })).toBeVisible();
  await body.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, isComposing: true, bubbles: true, cancelable: true })));
  await expect(body).toHaveText('/');
  await expect(body.locator('h1')).toHaveCount(0);
});
