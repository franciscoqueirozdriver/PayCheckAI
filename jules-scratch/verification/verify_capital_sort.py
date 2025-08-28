from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000/")

        # Wait for states to load and select São Paulo (SP)
        uf_select = page.locator("#uf-select")
        expect(uf_select).to_be_enabled(timeout=15000)
        uf_select.select_option("SP")

        # Wait for municipalities to load
        municipio_select = page.locator("#municipio-select")
        expect(municipio_select).to_be_enabled(timeout=15000)

        # Check if the first actual city is the capital
        # The first <option> is "Selecione", so we check the second one.
        first_city_option = municipio_select.locator("option").nth(1)
        expect(first_city_option).to_have_text("São Paulo")

        # For visual confirmation, click the dropdown and take a screenshot
        municipio_select.click()
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/capital_sorted.png")

        browser.close()

run()
