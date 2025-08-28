from playwright.sync_api import sync_playwright, expect

def add_payment(page, date: str, company: str, value: str):
    page.get_by_role("button", name="Adicionar Pagamento").click()
    new_row = page.locator("tbody tr").last
    new_row.locator("td:nth-child(1) input").fill(date)
    new_row.locator("td:nth-child(2) input").fill(company)
    new_row.locator("td:nth-child(5) input").fill(value)
    # Wait for any potential debounce/re-render
    page.wait_for_timeout(200)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:3000")
        page.evaluate("localStorage.clear()")
        page.reload(wait_until="networkidle")

        # Set period to August to start
        period_input = page.locator('input[type="month"]')
        period_input.fill("2025-08")

        # Add payments for different months
        add_payment(page, "2025-08-10", "Empresa de Agosto", "100")
        add_payment(page, "2025-06-20", "Empresa de Junho", "200")
        add_payment(page, "2025-08-25", "Outra de Agosto", "300")

        # Assert that only August rows are visible
        expect(page.locator("tbody tr")).to_have_count(2)
        expect(page.get_by_text("Empresa de Agosto")).to_be_visible()
        expect(page.get_by_text("Outra de Agosto")).to_be_visible()
        expect(page.get_by_text("Empresa de Junho")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/filter_august.png")

        # Change period to June
        period_input.fill("2025-06")

        # Assert that only the June row is visible
        expect(page.locator("tbody tr")).to_have_count(1)
        expect(page.get_by_text("Empresa de Junho")).to_be_visible()
        expect(page.get_by_text("Empresa de Agosto")).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/filter_june.png")

        browser.close()

run()
