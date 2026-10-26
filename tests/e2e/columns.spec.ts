import { expect, test } from '@playwright/test';

test('2열 작성·이동·해제·저장·서버 표시', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('왼쪽 이야기');
  await page.getByRole('button', { name: '블록 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '2열 만들기' }).click();
  await expect(body.locator('.cosmos-column')).toHaveCount(2);
  await body.locator('.cosmos-column').nth(1).locator('p').click();
  await page.keyboard.insertText('오른쪽 이야기');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await expect(body.locator('.cosmos-column').first()).toHaveText('왼쪽 이야기');
  await expect(body.locator('.cosmos-column').nth(1)).toHaveText('오른쪽 이야기');
  await page.getByRole('button', { name: '서버 미리보기', exact: true }).click();
  const preview = page.getByRole('region', { name: '읽기 미리보기' });
  await expect(preview.locator('.cosmos-column')).toHaveCount(2);
  const editorInset = await body.locator('.cosmos-column').first().evaluate(element => getComputedStyle(element).padding);
  const readerInset = await preview.locator('.cosmos-column').first().evaluate(element => getComputedStyle(element).padding);
  expect(readerInset).toBe(editorInset);
  await body.locator('.cosmos-column').first().locator(':scope > :first-child').click();
  await page.getByRole('button', { name: '블록 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '열 해제' }).click();
  await expect(body.locator('.cosmos-columns')).toHaveCount(0);
  await expect(body.locator(':scope > *')).toHaveText(['왼쪽 이야기', '오른쪽 이야기']);
});

test('넓은 화면에서도 좁은 부모 안에서는 세로로 표시한다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('왼쪽');
  await page.getByRole('button', { name: '블록 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '2열 만들기' }).click();
  const wide = await body.locator('.cosmos-column').first().boundingBox();
  const wideRight = await body.locator('.cosmos-column').nth(1).boundingBox();
  expect(Math.abs(wideRight!.y - wide!.y)).toBeLessThan(2);
  await body.evaluate(element => { element.style.width = '380px'; });
  const narrow = await body.locator('.cosmos-column').first().boundingBox();
  const narrowRight = await body.locator('.cosmos-column').nth(1).boundingBox();
  expect(narrowRight!.y).toBeGreaterThan(narrow!.y);
});

test('좁은 화면에서는 왼쪽·오른쪽 순서로 세로 전환한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('왼쪽');
  await page.getByRole('button', { name: '블록 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '2열 만들기' }).click();
  const first = await body.locator('.cosmos-column').first().boundingBox();
  const second = await body.locator('.cosmos-column').nth(1).boundingBox();
  expect(second!.y).toBeGreaterThan(first!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
