import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'playwright';

chromium.use(StealthPlugin());
import { Orchestrator } from '../../src/core/Orchestrator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Price Comparison E2E (Auto-Parallel)', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        browser = await chromium.launch({ headless: false });
        page = await browser.newPage();
    });

    afterAll(async () => {
        await browser?.close();
    });

    it('should decompose and compare iPhone prices in parallel', async () => {
        const apiKey = process.env.PORTKEY_API_KEY;
        const param = process.env.PORTKEY_VIRTUAL_KEY;

        if (!apiKey) {
            console.warn('Skipping Price Comparison Test: No API Key found.');
            return;
        }

        const orchestrator = new Orchestrator(page, {
            provider: 'portkey',
            apiKey,
            param
        });

        const product = "iPhone 15 128GB Black";
        const parsePrice = (priceStr: string): number | null => {
            if (!priceStr) return null;
            const numeric = priceStr.replace(/[^0-9.]/g, '');
            return numeric ? parseFloat(numeric) : null;
        };

        const complexGoal = `Compare the price of ${product} on Flipkart, Amazon.in, and RelianceDigital.in. Extract the price as flipkart_price_text, amazon_price_text, and reliance_price_text respectively.`;

        console.log('Starting Auto-Parallel Price Comparison...');
        const results = await orchestrator.execute(complexGoal);

        console.log('\n--- Final Context ---');
        console.log(JSON.stringify(results, null, 2));

        const finalResults: Record<string, number> = {};

        if (results.flipkart_price_text) finalResults['Flipkart'] = parsePrice(results.flipkart_price_text) || 0;
        if (results.amazon_price_text) finalResults['Amazon'] = parsePrice(results.amazon_price_text) || 0;
        if (results.reliance_price_text) finalResults['Reliance Digital'] = parsePrice(results.reliance_price_text) || 0;

        console.log('\n--- Price Comparison Summary ---');
        const validResults = Object.entries(finalResults).filter(([_, p]) => p > 0).sort((a, b) => a[1] - b[1]);

        if (validResults.length === 0) {
            console.warn('No prices found on any platform.');
        } else {
            console.table(validResults.map(([store, price]) => ({ Store: store, Price: `₹${price}` })));
            console.log(`\n🏆 Winner: ${validResults[0][0]} at ₹${validResults[0][1]}`);
        }

        expect(Object.keys(results).length).toBeGreaterThan(0);

    }, 300000);
});
