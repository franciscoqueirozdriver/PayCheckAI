import { test, expect } from '@playwright/test';

test.describe('Accessibility and Routing Checks', () => {

  test('should display a 404 page for a non-existent route', async ({ page }) => {
    // Navigate to a route that is guaranteed not to exist.
    const randomRoute = `/non-existent-route-${Math.random().toString(36).substring(7)}`;
    const response = await page.goto(randomRoute);

    // In Next.js, a 404 page is served with a 404 status code.
    expect(response.status()).toBe(404);

    // Check for a title or text that is specific to the Next.js 404 page.
    // The default Next.js 404 page contains the text "404".
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('404');
    await expect(page).toHaveTitle(/404/);
  });

  test('should open the import modal without accessibility warnings', async ({ page }) => {
    // NOTE: This test assumes the user is authenticated as an admin.
    // In a real test suite, you would programmatically log in before this test.
    // For example, by calling an API or setting an auth cookie.

    const consoleMessages = [];
    page.on('console', (msg) => {
      // Track console messages, especially warnings and errors.
      if (msg.type() === 'warning' || msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Navigate to the main calculator page.
    await page.goto('/calcular-dsr');

    // Find and click the button to open the modal.
    // This button is only visible to admins.
    const importButton = page.getByRole('button', { name: 'Importar Holerite' });

    // We need to handle the case where the button might not be there if not logged in as admin.
    // For this test case, we will assume it is visible and fail if not.
    await expect(importButton).toBeVisible();
    await importButton.click();

    // Wait for the modal to be visible.
    // Check for the dialog title to confirm it's open.
    const dialogTitle = page.getByRole('heading', { name: 'Importar Holerite' });
    await expect(dialogTitle).toBeVisible();

    // Check that no accessibility warnings were logged to the console.
    // Radix UI and other libraries sometimes log warnings if accessibility props are missing.
    const accessibilityWarnings = consoleMessages.filter(msg =>
      msg.toLowerCase().includes('accessibility') ||
      msg.toLowerCase().includes('aria') ||
      msg.toLowerCase().includes('warning: validateDOMNesting') // Common React warning
    );

    expect(accessibilityWarnings).toHaveLength(0);
  });

});
