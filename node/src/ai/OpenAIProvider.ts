import OpenAI from 'openai';
import { z } from 'zod';
import { AIProvider } from './types';
import { SYSTEM_PROMPT, constructUserPrompt } from './prompts';

export class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, baseURL?: string, model: string = 'gpt-4o') {
        this.client = new OpenAI({
            apiKey,
            baseURL, // Optional, useful for Gemini compatibility via OpenAI SDK
        });
        this.model = model;
    }

    async generateSelector(snapshot: any, goal: string): Promise<string | null> {
        const userPrompt = constructUserPrompt(goal, snapshot);

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content;
            if (!content) return null;

            const schema = z.object({
                selector: z.string(),
                confidence: z.number(),
            });

            const parsed = schema.parse(JSON.parse(content));
            return parsed.selector;
        } catch (error) {
            console.error('OpenAI Provider Error:', error);
            return null;
        }
    }
}
