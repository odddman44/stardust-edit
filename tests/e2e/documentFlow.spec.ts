import { expect, test } from '@playwright/test';

test('한글 작성·저장·복원과 서버 미리보기', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('서울 여행');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await expect(body).toHaveText('서울 여행');
  await page.getByRole('button', { name: '서버 미리보기', exact: true }).click();
  await expect(page.getByRole('region', { name: '읽기 미리보기' })).toContainText('서울 여행');
  expect(errors).toEqual([]);
});

test('미래 버전의 로컬 저장값을 초기화하지 않는다', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cosmoslog-demo-document', '{"version":2}'));
  await page.goto('/');
  await expect(page.getByRole('region', { name: '문서 작업 공간' }).getByRole('alert')).toContainText('버전');
  expect(await page.evaluate(() => localStorage.getItem('cosmoslog-demo-document'))).toBe('{"version":2}');
  await expect(page.getByRole('textbox', { name: '문서 본문' })).toHaveCount(0);
});

test('서버 컴포넌트에서 본문을 표시한다', async ({ page }) => {
  await page.goto('/read');
  await expect(page.getByRole('heading', { name: '서울의 한 페이지' })).toBeVisible();
  await expect(page.locator('[contenteditable]')).toHaveCount(0);
});
