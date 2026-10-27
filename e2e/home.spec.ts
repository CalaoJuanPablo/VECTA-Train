import { expect, test } from '@playwright/test';

test('direct load of "/" shows the home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Welcome to VECTA Train' })).toBeVisible();
});
