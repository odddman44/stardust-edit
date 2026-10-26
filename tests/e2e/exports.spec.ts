import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('Markdown 파일을 내려받아 한글 본문을 보존한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '문서 본문' }).fill('내 문장');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Markdown 내보내기' }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('cosmoslog-document.md');
  expect(readFileSync((await file.path())!, 'utf8')).toContain('내 문장');
});

test('2열 내보내기에서 레이아웃 변화 경고를 표시한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '문서 본문' }).fill('왼쪽 문장');
  await page.getByRole('button', { name: '블록 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '2열 만들기' }).click();
  await page.getByRole('button', { name: 'Markdown 내보내기' }).click();
  await expect(page.getByText('2열은 왼쪽·오른쪽 순서의 세로 본문으로 변환했습니다.')).toBeVisible();
});
