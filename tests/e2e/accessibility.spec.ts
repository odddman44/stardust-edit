import { expect, test } from '@playwright/test';

test('슬래시 메뉴의 현재 선택을 본문 접근성 속성으로 연결한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('');
  await body.pressSequentially('/');
  await page.keyboard.press('ArrowDown');
  const selectedId = await page.getByRole('option', { selected: true }).getAttribute('id');
  expect(selectedId).toBeTruthy();
  await expect(body).toHaveAttribute('aria-activedescendant', selectedId!);
  await page.keyboard.press('Escape');
  await expect(body).not.toHaveAttribute('aria-activedescendant');
});

test('서식 버튼의 눌림 상태를 문서 변경에 맞춰 갱신한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('서식 상태');
  await body.press('Meta+a');
  const button = page.getByRole('button', { name: '굵게', exact: true });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('에디터 외부의 요소에 전역 편집기 스타일을 주입하지 않는다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '문서 본문' }).waitFor();
  const whitespace = await page.evaluate(() => {
    const other = document.createElement('div');
    other.className = 'tiptap ProseMirror';
    other.textContent = '다른 컴포넌트';
    document.body.append(other);
    const result = getComputedStyle(other).whiteSpace;
    other.remove();
    return result;
  });
  expect(whitespace).toBe('normal');
});
