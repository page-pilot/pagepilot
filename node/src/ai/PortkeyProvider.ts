import Portkey from 'portkey-ai';
import { z } from 'zod';
import { AIProvider } from './types';
import { SYSTEM_PROMPT, constructUserPrompt } from './prompts';

export class PortkeyProvider implements AIProvider {

  async determineNextAction(snapshot: any, goal: string, history: string[]): Promise<import('./types').AIDecision> {
    const historyText = history.length > 0 ? `Action History:\n${history.join('\n')}` : 'No previous actions.';
    const userPrompt = `Goal: ${goal}\n\n${historyText}\n\nAccessibility Tree:\n${JSON.stringify(snapshot, null, 2)}`;

    const { AGENT_SYSTEM_PROMPT } = await import('./prompts');

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: AGENT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== 'string') throw new Error('No content from AI');

      return JSON.parse(content) as import('./types').AIDecision;
    } catch (error) {
      console.error('Portkey Agent Error:', error);
      return {
        reasoning: "Failed to communicate with AI.",
        action: { type: "fail", reason: `AI Error: ${error}` }
      };
    }
  }

  private client: Portkey;

  constructor(apiKey: string, virtualKey?: string) {
    this.client = new Portkey({
      apiKey,
      virtualKey
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
  async generatePlan(goal: string): Promise<import('./types').TaskPlan[]> {
    const systemPrompt = `You are a QA Lead and Automation Architect.
Your role is to strictly decompose a high-level user goal into a flat JSON array of atomic execution tasks.
The available task types are:
- 'navigate': { url: string }
- 'click': { selector: string (descriptive, not code) }
- 'fill': { selector: string (descriptive), value: string, submit?: boolean } (For Search Bars, prefer setting 'submit: true' (which presses Enter) rather than creating a separate 'Click Search Button' task. Clicking icons is flaky; pressing Enter is safe.)
- 'scroll': { direction: 'down' | 'up', amount?: number }
- 'extract': { description: string } (CRITICAL: Verify the item name matches the user's search query. Ignore 'Sponsored' items or accessories. If the user wants 'iPhone 15', do NOT extract 'iPhone 13' or 'Case for iPhone'.)

PLANNING RULES:
1. **Combine Search & Submit:** If the user wants to search, create ONE 'fill' task and describe that it should also submit. Do NOT create a separate 'click search button' task immediately after, as the page will navigate away.
2. **Explicit Extraction:** If the user wants to extract data, create an 'extract' task with a clear description of what to extract.
3. **Lazy Loading:** If items might be lazy loaded, include a 'scroll' task before extraction.

Return a JSON object with a 'tasks' key containing the array of steps.
Example:
{
  "tasks": [
    { "type": "navigate", "params": { "url": "https://example.com" }, "description": "Go to example" }
  ]
}
`;
    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: goal }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== 'string') return [];

      console.log('[PortkeyProvider] Raw Content:', content);
      const parsed = JSON.parse(content);
      console.log('[PortkeyProvider] Parsed JSON:', JSON.stringify(parsed, null, 2));

      if (parsed.tasks && Array.isArray(parsed.tasks)) return parsed.tasks;
      if (Array.isArray(parsed)) return parsed;
      const values = Object.values(parsed);
      if (values.length > 0 && Array.isArray(values[0])) return values[0] as import('./types').TaskPlan[];
      return [];
    } catch (e: any) {
      console.error('Portkey Plan Error:', e);
      if (e.response) {
        console.error('Portkey Response Data:', e.response.data);
      }
      return [];
    }
  }
  async decomposeComplexGoal(goal: string): Promise<string[]> {
    const systemPrompt = `You are a Task Manager. Analyze the user's request.
- If it involves multiple distinct websites or independent tasks, break it down into a JSON array of specific sub-goals.
- If it is a single task, return an array with just that one string.
- Example Input: 'Check iPhone price on Amazon and Flipkart'
- Example Output: ['Go to Amazon, search iPhone, extract price', 'Go to Flipkart, search iPhone, extract price']

Return a JSON object with a 'goals' key containing the array of strings.`;

    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: goal }
        ],
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== 'string') return [goal];

      console.log('[PortkeyProvider] Decomposition Raw:', content);
      const parsed = JSON.parse(content);
      if (parsed.goals && Array.isArray(parsed.goals)) return parsed.goals;
      return [goal];
    } catch (e) {
      console.error('Portkey Decomposition Error:', e);
      return [goal];
    }
  }
}
