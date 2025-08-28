from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Clear local storage for a clean state
        page.goto("http://localhost:3000")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")

        # Wait for default rows to load
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible(timeout=15000)

        # Change global rates
        page.locator('input[type="number"]').nth(0).fill("10") # Imposto
        page.locator('input[type="number"]').nth(1).fill("50") # Comissão

        # Verify that the first row's percentages have updated
        first_row_imposto = page.locator('tbody tr').first.locator('td:nth-child(6) input')
        expect(first_row_imposto).to_have_value("10")

        first_row_comissao = page.locator('tbody tr').first.locator('td:nth-child(8) input')
        expect(first_row_comissao).to_have_value("50")

        page.screenshot(path="jules-scratch/verification/global_rates_applied.png")

        # Unlock global rates
        page.get_by_label("Travar e aplicar a todas as linhas").uncheck()

        # Change a single row's imposto and verify it doesn't affect others
        first_row_imposto.fill("5")

        second_row_imposto = page.locator('tbody tr').nth(1).locator('td:nth-child(6) input')
        expect(second_row_imposto).to_have_value("10") # Should remain at the old global rate

        page.screenshot(path="jules-scratch/verification/global_rates_unlocked.png")

        browser.close()

run()
