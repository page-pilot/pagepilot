import Portkey from 'portkey-ai';
import { z } from 'zod';
import { AIProvider } from './types';
import { SYSTEM_PROMPT, constructUserPrompt } from './prompts';

export class PortkeyProvider implements AIProvider {
  private client: Portkey;

  constructor(apiKey: string, virtualKey?: string) {
    this.client = new Portkey({
      apiKey,
      virtualKey // Optional: Portkey Virtual Key to route requests
    });
  }

  async generateSelector(snapshot: any, goal: string): Promise<string | null> {
    const userPrompt = constructUserPrompt(goal, snapshot);

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        // Portkey handles model routing via Virtual Key, but we can default to 'gpt-4o' if needed
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== 'string') return null;

      const schema = z.object({
        selector: z.string(),
        confidence: z.number(),
      });

      const parsed = schema.parse(JSON.parse(content));
      return parsed.selector;
    } catch (error) {
      console.error('Portkey Provider Error:', error);
      return null;
    }
  }
}
