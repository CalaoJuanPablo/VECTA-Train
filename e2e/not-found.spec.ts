import { expect, test } from '@playwright/test';

test('direct load of an unknown URL shows the not-found page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('refreshing an unknown URL keeps the not-found page and the URL', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveURL('/this-page-does-not-exist');
});
