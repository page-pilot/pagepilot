import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PagePilot } from '../../src/PagePilot';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Live Google Search E2E', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true }); // Headless for CI/speed, set false to watch
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser?.close();
    });

    it('should search on Google using AI', async () => {
        const apiKey = process.env.OPENAI_API_KEY || process.env.PORTKEY_API_KEY;
        const provider = process.env.PORTKEY_API_KEY ? 'portkey' : 'openai';
        const param = process.env.PORTKEY_VIRTUAL_KEY;

        if (!apiKey) {
            console.warn('Skipping Live E2E test: No API Key found.');
            return;
        }

        console.log(`Running Live Test with Provider: ${provider}`);

        // 1. Navigate to Google
        await page.goto('https://google.com');

        const pilot = new PagePilot(page, {
            provider: provider as any,
            apiKey,
            param // Only used if provider is portkey
        });

        // 2. Perform Action: Click Search Bar
        // Note: Google's search bar is usually a textarea or input. 
        // We'll give a generic goal.
        console.log('Act: Click the search input');
        await pilot.act('Click the search text input area');

        // 3. Type query
        await page.keyboard.type('PagePilot AI');
        await page.keyboard.press('Enter');

        // 4. Verify results page loaded (simple check)
        await page.waitForTimeout(2000); // Wait for results
        const url = page.url();
        console.log('Page URL:', url);

        // Relaxed check: Just verify we are on a search result page or have searched
        expect(url).toContain('search');
    }, 60000);
});
