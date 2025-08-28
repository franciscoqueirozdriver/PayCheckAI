from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Clear local storage for a clean state
        page.goto("http://localhost:3000")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")

        # 1. Wait for default rows (August 2025) to load and verify count
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible(timeout=15000)
        expect(page.locator("tbody tr")).to_have_count(6)

        # 2. Change date to June 2025
        period_input = page.locator('input[type="month"]')
        period_input.fill("2025-06")

        # 3. Verify that the table is now empty
        expect(page.locator("tbody tr")).to_have_count(0)
        page.screenshot(path="jules-scratch/verification/date_filter_empty.png")

        # 4. Change date back to August 2025
        period_input.fill("2025-08")

        # 5. Verify that the 6 rows are visible again
        expect(page.locator("tbody tr")).to_have_count(6)
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/date_filter_restored.png")

        browser.close()

run()
