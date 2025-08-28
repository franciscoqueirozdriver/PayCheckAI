from playwright.sync_api import sync_playwright, expect
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000/")

        # Wait for the table to be populated
        expect(page.get_by_text("Driver Empresa 03")).to_be_visible(timeout=15000)

        # 1. Check the initial total for "Valor Bruto"
        # The sum of default rows is 7000+9000+45000+9000+20000+60000 = 145000
        total_valor_bruto_cell = page.locator("tfoot tr td").nth(1)
        initial_total_regex = re.compile(r'R\$\s*145\.000,00')
        expect(total_valor_bruto_cell).to_have_text(initial_total_regex)

        # 2. Change the "Valor Bruto" of the first row from 7000 to 8000
        first_row_input = page.locator("tbody tr").first.locator('td:nth-child(5) input[type="text"]')
        first_row_input.fill("8.000,00")

        # 3. Check that the total for "Valor Bruto" updates correctly
        # New total is 145000 - 7000 + 8000 = 146000
        updated_total_regex = re.compile(r'R\$\s*146\.000,00')
        expect(total_valor_bruto_cell).to_have_text(updated_total_regex)

        # 4. Take a screenshot
        page.screenshot(path="jules-scratch/verification/totals_verified.png")

        browser.close()

run()
