import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PagePilot } from '../../src/PagePilot';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Live Flipkart Search E2E', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: false, slowMo: 100 });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser?.close();
    });

    it('should search for iphone on Flipkart and list products', async () => {
        const apiKey = process.env.OPENAI_API_KEY || process.env.PORTKEY_API_KEY;
        const provider = process.env.PORTKEY_API_KEY ? 'portkey' : 'openai';
        const param = process.env.PORTKEY_VIRTUAL_KEY;

        if (!apiKey) {
            console.warn('Skipping Live E2E test: No API Key found.');
            return;
        }

        console.log(`Running Live Test with Provider: ${provider}`);

        // 1. Navigate to Flipkart
        await page.goto('https://www.flipkart.com');

        const pilot = new PagePilot(page, {
            provider: provider as any,
            apiKey,
            param
        });

        // 2. Perform Action: Search for iphone
        console.log('Act: Search for iphone (handling potential popup)');

        // Give AI a robust goal to handle potential overlay
        await pilot.act('If a login popup is visible, close it. Then click the search text input field (not the button).');

        // Type search query
        await page.keyboard.type('iphone');
        await page.keyboard.press('Enter');

        // 3. Wait for results
        await page.waitForTimeout(5000);

        console.log('Current URL:', page.url());

        // 4. Extract Product Lists
        console.log('Act: Extracting product titles using Playwright');

        // Robust check: Verify we are on results page
        expect(page.url()).toContain('search');
        expect(page.url().toLowerCase()).toContain('iphone');

        // Extract product titles by finding elements with text "iPhone"
        // This is a heuristic to get the titles without relying on unstable class names
        const titles = await page.getByText('iPhone', { exact: false }).allInnerTexts();

        // Filter out short texts (like breadcrumbs) to keep likely product titles
        const productNames = titles.filter(t => t.length > 20 && t.toLowerCase().includes('iphone')).slice(0, 10);

        console.log('--- Product List ---');
        productNames.forEach((name, i) => console.log(`${i + 1}. ${name.trim()}`));
        console.log('--------------------');

        expect(productNames.length).toBeGreaterThan(0);
    }, 60000);
});
