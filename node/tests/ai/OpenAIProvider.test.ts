import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from '../../src/ai/OpenAIProvider';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the root .env
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Resolving .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));
dotenv.config({ path: envPath });

describe('OpenAIProvider Integration', () => {
    it('should generate a selector using real OpenAI API', async () => {
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('API Key present:', !!apiKey);

        if (!apiKey) {
            console.warn('Skipping OpenAI integration test: OPENAI_API_KEY not found in env.');
            return;
        }

        const provider = new OpenAIProvider(apiKey);

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

        console.log('Testing OpenAI with goal:', goal);
        const selector = await provider.generateSelector(snapshot, goal);

        console.log('Generated Selector:', selector);

        expect(selector).toBeDefined();
        // expect(typeof selector).toBe('string');
    }, 15000); // Increased timeout for API call
});
