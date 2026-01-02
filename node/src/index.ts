import { Page } from 'playwright';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export class PagePilot {
    private page: Page;
    private openai: OpenAI;
    private actionCache: Map<string, string>;

    constructor(page: Page, apiKey?: string) {
        this.page = page;
        this.openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        this.actionCache = new Map();
    }

    async act(description: string): Promise<void> {
        // 1. Check Cache
        if (this.actionCache.has(description)) {
            console.log(`[Cache Hit] Executing cached action for: "${description}"`);
            const cachedCode = this.actionCache.get(description)!;
            await this.executeCode(cachedCode);
            return;
        }

        // 2. AI Fallback
        console.log(`[AI Fallback] Generating action for: "${description}"`);
        const code = await this.generateCode(description);

        if (code) {
            await this.executeCode(code);
            // 3. Update Cache
            this.actionCache.set(description, code);
        } else {
            throw new Error(`Failed to generate action for: "${description}"`);
        }
    }

    private async generateCode(description: string): Promise<string | null> {
        const response = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a Playwright automation expert. Generate ONLY the executable JavaScript code for the requested action on the 'page' object. Do not include markdown formatting or explanations."
                },
                {
                    role: "user",
                    content: `Action: ${description}`
                }
            ]
        });

        return response.choices[0].message.content;
    }

    private async executeCode(code: string): Promise<void> {
        try {
            // Use Function constructor to limit scope slightly, but still risky in prod without sandbox
            // In a real scenario, this would need more robust sandboxing
            const func = new Function('page', `return (async () => { ${code} })();`);
            await func(this.page);
        } catch (error) {
            console.error("Execution failed:", error);
            throw error;
        }
    }
}
