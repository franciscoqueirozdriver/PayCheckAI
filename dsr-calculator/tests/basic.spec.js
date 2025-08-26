import { test, expect } from '@playwright/test';

test('serves index.html for unknown routes', async ({ page }) => {
  await page.goto('http://localhost:3000/rota-inexistente');
  await expect(page.locator('title')).toHaveText('Calculadora de DSR');
});

test('dialog renders without warnings', async ({ page }) => {
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  await page.goto('http://localhost:3000/');
  await page.click('text=Sobre');
  expect(warnings).toEqual([]);
});

