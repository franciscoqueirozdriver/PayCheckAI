from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mobile screenshot
        page.set_viewport_size({"width": 375, "height": 667})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(2000) # wait for render
        page.screenshot(path="jules-scratch/verification/responsive_mobile.png")

        # Tablet screenshot
        page.set_viewport_size({"width": 768, "height": 1024})
        page.goto("http://localhost:3000", wait_until="networkidle")
        page.wait_for_timeout(2000) # wait for render
        page.screenshot(path="jules-scratch/verification/responsive_tablet.png")

        browser.close()

run()
