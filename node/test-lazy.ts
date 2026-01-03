import { chromium } from 'playwright';
import { Orchestrator } from './src/core/Orchestrator';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env file (parent dir)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
    console.log('Starting Lazy User Test...');

    // 1. Setup
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 2. Config
    const config = {
        provider: 'portkey' as const,
        apiKey: process.env.PORTKEY_API_KEY || '',
        param: process.env.PORTKEY_VIRTUAL_KEY
    };

    if (!config.apiKey) {
        console.error('Error: OPENAI_API_KEY is missing in .env');
        process.exit(1);
    }

    // 3. Initialize Orchestrator
    const orchestrator = new Orchestrator(page, config);

    // 4. Run Goal
    const goal = "Go to Wikipedia, search for 'Turing', and save the first paragraph.";

    try {
        const result = await orchestrator.execute(goal);
        console.log('\nFinal Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
})();
