from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000", wait_until="networkidle")

        # Wait for states to load and select São Paulo
        uf_select = page.locator("#uf-select")
        expect(uf_select).to_be_enabled(timeout=10000)
        uf_select.select_option("SP")

        # Wait for municipalities to load
        municipio_select = page.locator("#municipio-select")
        expect(municipio_select).to_be_enabled(timeout=10000)

        # Click the dropdown to make options visible
        municipio_select.click()
        page.wait_for_timeout(500) # wait for options to render

        page.screenshot(path="jules-scratch/verification/sorted_municipalities.png")

        browser.close()

run()
