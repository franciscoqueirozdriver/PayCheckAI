from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")

        # Wait for the default rows to be loaded by looking for the first default entry
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible(timeout=15000)

        # Now we can safely check the count
        expect(page.locator("tbody tr")).to_have_count(6)
        initial_row_count = 6

        # 1. Add a new payment
        page.get_by_role("button", name="Adicionar Pagamento").click()

        expect(page.locator("tbody tr")).to_have_count(initial_row_count + 1)

        # 2. Fill the new row
        new_row = page.locator("tbody tr").last
        new_row.locator("td:nth-child(1) input").fill("2025-08-15")
        new_row.locator("td:nth-child(2) input").fill("Nova Empresa Teste")
        new_row.locator("td:nth-child(5) input").fill("1000")

        page.wait_for_timeout(1000)
        page.screenshot(path="jules-scratch/verification/table_add_row_only.png")

        browser.close()

run()
