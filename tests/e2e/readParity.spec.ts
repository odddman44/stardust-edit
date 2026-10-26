import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const fixture = { version: 1, content: { type: 'doc', content: [
  { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '골목의 작은 기록' }] },
  { type: 'paragraph', content: [{ type: 'text', text: '걷다가 만난 카페. 한 장의 사진과 짧은 문장으로 남겨둡니다.' }] },
  { type: 'columns', content: [
    { type: 'column', content: [{ type: 'image', attrs: { src: '/demo-photo.svg', alt: '창가의 커피', caption: '느린 오후의 커피' } }] },
    { type: 'column', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '다시 가고 싶은 곳' }] }, { type: 'paragraph', content: [{ type: 'text', text: '따뜻한 커피와 햇살이 좋았어요. 다음에는 조금 더 오래 머물고 싶습니다.' }] }] }
  ] },
  { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '다음 방문을 위한 메모' }] }] }] },
  { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '한 줄의 메모' }] }] }] },
  { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '세 번째 기록' }] }] }] },
  { type: 'codeBlock', content: [{ type: 'text', text: 'const memory = "오래 기억할 오후";'.repeat(5) }] }
] } };

for (const width of [390, 1024]) for (const colorScheme of ['light', 'dark'] as const) {
  test(`${width}px ${colorScheme} 편집·읽기 본문과 외부 reset`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(input => localStorage.setItem('cosmoslog-demo-document', JSON.stringify(input)), fixture);
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: '문서 본문' });
    await expect(editor.locator('img')).toBeVisible();
    await page.getByRole('button', { name: '서버 미리보기', exact: true }).click();
    const reader = page.getByRole('region', { name: '읽기 미리보기' }).locator('.cosmos-document');
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText('골목의 작은 기록');
    expect(await reader.locator('ul:not([data-type="taskList"])').evaluate(element => getComputedStyle(element).listStyleType)).toBe('disc');
    expect(await reader.locator('ol').evaluate(element => getComputedStyle(element).listStyleType)).toBe('decimal');
    const properties = (element: Element) => {
      const style = getComputedStyle(element);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, color: style.color, fontWeight: style.fontWeight };
    };
    const editingStyle = await editor.locator('h1').evaluate(properties);
    expect(await reader.locator('h1').evaluate(properties)).toEqual(editingStyle);
    expect(Number(editingStyle.fontWeight)).toBeGreaterThanOrEqual(600);
    expect(await reader.locator('input[type=checkbox]').isDisabled()).toBe(true);
    const checkbox = await editor.locator('input[type=checkbox]').boundingBox();
    const taskText = await editor.locator('li').filter({ has: page.locator('input[type=checkbox]') }).locator('p').boundingBox();
    expect(taskText!.x).toBeGreaterThan(checkbox!.x + checkbox!.width);
    expect(Math.abs(taskText!.y - checkbox!.y)).toBeLessThan(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const columns = await reader.locator('.cosmos-column').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y };
    }));
    if (width === 390) expect(columns[1].y).toBeGreaterThan(columns[0].y);
    else expect(Math.abs(columns[1].y - columns[0].y)).toBeLessThan(2);
    mkdirSync('.local/screenshots', { recursive: true });
    await editor.screenshot({ path: `.local/screenshots/${browserName}-${width}-${colorScheme}-editor.png` });
    await reader.screenshot({ path: `.local/screenshots/${browserName}-${width}-${colorScheme}-reader.png` });
  });
}
