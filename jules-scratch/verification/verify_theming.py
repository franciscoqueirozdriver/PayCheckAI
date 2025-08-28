from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000/")

        # Wait for the main heading to be visible
        expect(page.get_by_role("heading", name="Cálculo de DSR")).to_be_visible(timeout=15000)

        # Give it a moment for all styles to apply
        page.wait_for_timeout(1000)

        page.screenshot(path="jules-scratch/verification/themed_page.png")

        browser.close()

run()
