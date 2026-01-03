import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { AIProvider } from './types';
import { SYSTEM_PROMPT, constructUserPrompt } from './prompts';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;

    constructor(apiKey: string) {
        this.client = new Anthropic({
            apiKey,
        });
    }

    async generateSelector(snapshot: any, goal: string): Promise<string | null> {
        const userPrompt = constructUserPrompt(goal, snapshot);

        try {
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: userPrompt }
                ],
            });

            // Anthropic response content is a list of blocks
            const textBlock = response.content.find(block => block.type === 'text');
            if (!textBlock || textBlock.type !== 'text') return null;

            const content = textBlock.text;

            // Extract JSON from potential markdown code blocks if present, though system prompt asks for ONLY JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : content;

            const schema = z.object({
                selector: z.string(),
                confidence: z.number(),
            });

            const parsed = schema.parse(JSON.parse(jsonString));
            return parsed.selector;
        } catch (error) {
            console.error('Anthropic Provider Error:', error);
            return null;
        }
    }
}
