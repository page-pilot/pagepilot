import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { PagePilot } from '../../src/PagePilot';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Live Local Page E2E', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser?.close();
    });

    it('should interact with local page using AI', async () => {
        const apiKey = process.env.OPENAI_API_KEY || process.env.PORTKEY_API_KEY;
        const provider = process.env.PORTKEY_API_KEY ? 'portkey' : 'openai';
        const param = process.env.PORTKEY_VIRTUAL_KEY;

        if (!apiKey) {
            console.warn('Skipping Live E2E test: No API Key found.');
            return;
        }

        console.log(`Running Local Test with Provider: ${provider}`);

        // 1. Navigate to Local File
        const filePath = path.resolve(__dirname, '../fixtures/simple_page.html');
        await page.goto(`file://${filePath}`);

        const pilot = new PagePilot(page, {
            provider: provider as any,
            apiKey,
            param
        });

        // 2. Perform Action: Click Login Button
        console.log('Act: Click the login button');
        await pilot.act('Click the login button');

        // 3. Verify action result
        const btnText = await page.textContent('#btn-login');
        console.log('Button Text:', btnText);

        expect(btnText).toBe('Clicked!');
    }, 30000);
});
