import { describe, it, expect } from 'vitest';
import { PortkeyProvider } from '../../src/ai/PortkeyProvider';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the root .env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

describe('PortkeyProvider Integration', () => {
    it('should generate a selector using Portkey (routing to ChatGPT)', async () => {
        const apiKey = process.env.PORTKEY_API_KEY;
        const virtualKey = process.env.PORTKEY_VIRTUAL_KEY;

        if (!apiKey) {
            console.warn('Skipping Portkey integration test: PORTKEY_API_KEY not found in env.');
            return;
        }

        console.log('Testing Portkey with API Key present.');
        if (virtualKey) console.log('Using Virtual Key:', virtualKey);

        const provider = new PortkeyProvider(apiKey, virtualKey);

        // Mock snapshot of a simple login page
        const snapshot = {
            role: 'WebArea',
            name: 'Login Page',
            children: [
                { role: 'button', name: 'Submit Login', description: 'Click to log in' },
                { role: 'textbox', name: 'Username' },
                { role: 'textbox', name: 'Password' }
            ]
        };

        const goal = 'Click the login button';

        console.log('Testing Portkey generation...');
        const selector = await provider.generateSelector(snapshot, goal);

        console.log('Generated Selector:', selector);

        expect(selector).toBeDefined();
        // expect(typeof selector).toBe('string');
    }, 20000);
});
