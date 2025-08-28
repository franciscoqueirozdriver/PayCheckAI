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
        expect(municipio_select).to_be_enabled(timeout=20000) # Increased timeout for multiple fetches

        # 1. Check if the capital is first
        first_city_option = municipio_select.locator("option").nth(1)
        expect(first_city_option).to_have_text("São Paulo")

        # 2. Check the order of metro vs. non-metro city
        options = municipio_select.locator("option").all_text_contents()

        try:
            # Guarulhos is in the metro area, Adamantina is not.
            guarulhos_index = options.index("Guarulhos")
            adamantina_index = options.index("Adamantina")

            # Assert that Guarulhos comes before Adamantina
            assert guarulhos_index < adamantina_index, "Guarulhos should appear before Adamantina"
            print("Sort order verified: Capital > Metro > Other")

        except ValueError as e:
            print(f"A city was not found in the dropdown, which might be an issue: {e}")
            print("Full list of options:", options)


        # For visual confirmation, click the dropdown and take a screenshot
        municipio_select.click()
        page.wait_for_timeout(500)
        page.screenshot(path="jules-scratch/verification/full_sorted_list.png")

        browser.close()

run()
