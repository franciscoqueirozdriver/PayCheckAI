from playwright.sync_api import sync_playwright, expect
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000/")

        # Wait for the table to be populated
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible(timeout=15000)

        # Target the first row
        first_row = page.locator("tbody tr").first
        valor_bruto_input = first_row.locator('td:nth-child(5) input[type="text"]')

        # The default tax is 19%. 1000 * (1 - 0.19) = 810
        # Let's change the gross value and check the net value

        # 1. Fill the input with a formatted string
        valor_bruto_input.fill("2.000,00")

        # 2. Check that the calculated "Líquido da Venda" is correct
        # 2000 * (1 - 0.19) = 1620
        # The value is formatted as R$ 1.620,00
        liquido_da_venda_cell = first_row.locator('td:nth-child(7)')

        # Use a regex to handle non-breaking spaces that Intl.NumberFormat might use
        expected_text_regex = re.compile(r'R\$\s*1\.620,00')
        expect(liquido_da_venda_cell).to_have_text(expected_text_regex)

        # 3. Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/currency_input_verified.png")

        browser.close()

run()
