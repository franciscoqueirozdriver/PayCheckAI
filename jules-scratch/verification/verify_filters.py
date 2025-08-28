from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")

        # Wait for states to load and select Minas Gerais
        uf_select = page.locator("#uf-select")
        expect(uf_select).to_be_enabled(timeout=10000)
        uf_select.select_option("MG")

        # Wait for municipalities to load and select Belo Horizonte
        municipio_select = page.locator("#municipio-select")
        expect(municipio_select).to_be_enabled(timeout=10000)
        municipio_select.select_option("3106200")

        # Change settings
        page.get_by_label("Considerar feriados locais").check()
        page.get_by_label("Usar dias úteis COM sábado").check()

        # Change period
        period_input = page.locator('input[type="month"]')
        period_input.fill("2025-06")

        # Wait for network activity to settle after all changes
        page.wait_for_timeout(2000) # Wait for debounce or final API call

        page.screenshot(path="jules-scratch/verification/filters_applied.png")
        browser.close()

run()
