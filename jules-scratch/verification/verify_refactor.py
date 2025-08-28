from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the new route
        page.goto("http://localhost:3000/paycheckai")

        # Check for the main title of the application
        title = page.get_by_role("heading", name="Cálculo de DSR")
        expect(title).to_be_visible(timeout=15000)

        page.screenshot(path="jules-scratch/verification/refactor_smoke_test.png")

        browser.close()

run()
