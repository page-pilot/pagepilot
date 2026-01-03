import { OpenAIProvider } from './OpenAIProvider';
import { AIProvider } from './types';

export class GeminiProvider implements AIProvider {
    private provider: OpenAIProvider;

    constructor(apiKey: string) {
        this.provider = new OpenAIProvider(
            apiKey,
            'https://generativelanguage.googleapis.com/v1beta/openai/',
            'gemini-1.5-pro'
        );
    }

    async generateSelector(snapshot: any, goal: string): Promise<string | null> {
        return this.provider.generateSelector(snapshot, goal);
    }
}
