import { expect, test } from '@playwright/test';

const photo = { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/RkAAAAASUVORK5CYII=', 'base64') };

test('파일 업로드 후 캡션을 저장·복원·읽기에 반영한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('사진 이야기');
  await expect(page.getByRole('button', { name: '사진 추가', exact: true })).toBeEnabled();
  await page.getByLabel('사진 파일').setInputFiles(photo);
  await expect(body.locator('img')).toHaveCount(1);
  await page.getByRole('textbox', { name: '사진 설명' }).fill('창가에서 마신 커피');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await expect(body.locator('img')).toHaveAttribute('src', '/demo-photo.svg');
  await expect(page.getByRole('textbox', { name: '사진 설명' })).toHaveValue('창가에서 마신 커피');
  await page.getByRole('button', { name: '서버 미리보기', exact: true }).click();
  await expect(page.getByRole('region', { name: '읽기 미리보기' }).locator('figcaption')).toHaveText('창가에서 마신 커피');
});

test('클립보드 이미지 파일도 같은 업로드 흐름으로 처리한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('붙여넣기');
  await body.evaluate(element => {
    const data = new DataTransfer();
    data.items.add(new File(['image'], 'clipboard.png', { type: 'image/png' }));
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
    element.dispatchEvent(event);
  });
  await expect(body.locator('img')).toHaveCount(1);
});

test('이미지 파일을 본문에 드롭하여 추가한다', async ({ page }) => {
  await page.goto('/');
  const body = page.getByRole('textbox', { name: '문서 본문' });
  await body.fill('사진을 여기에');
  await body.evaluate(element => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(['image'], 'drop.png', { type: 'image/png' }));
    const rect = element.getBoundingClientRect();
    const event = new DragEvent('drop', { clientX: rect.left + 30, clientY: rect.top + 20, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    element.dispatchEvent(event);
  });
  await expect(body.locator('img')).toHaveCount(1);
});
