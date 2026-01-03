import { AIProvider, ModelConfig } from './types';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';

import { PortkeyProvider } from './PortkeyProvider';

export class ProviderFactory {
    static create(config: ModelConfig): AIProvider {
        switch (config.provider) {
            case 'openai':
                return new OpenAIProvider(config.apiKey);
            case 'anthropic':
                return new AnthropicProvider(config.apiKey);
            case 'gemini':
                return new GeminiProvider(config.apiKey);
            case 'portkey':
                return new PortkeyProvider(config.apiKey, config.param);
            default:
                throw new Error(`Unsupported provider: ${(config as any).provider}`);
        }
    }
}
