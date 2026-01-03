import { AIProvider, ModelConfig } from './types';
import { PortkeyProvider } from './PortkeyProvider';

export class ProviderFactory {
    static create(config: ModelConfig): AIProvider {
        if (config.provider === 'portkey') {
            return new PortkeyProvider(config.apiKey, config.param);
        }
        throw new Error(`Unsupported provider: ${(config as any).provider}`);
    }
}
