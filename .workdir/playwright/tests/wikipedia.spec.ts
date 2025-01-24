import { test, expect } from '@playwright/test';

test('should have the correct page title', async ({ page }) => {
  await page.goto('https://www.wikipedia.org');
  
  const title = await page.title();
  expect(title).toBe('Wikipedia');
});