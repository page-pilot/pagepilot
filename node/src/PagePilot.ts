import { Page } from 'playwright';
import { ModelConfig } from './ai/types';
import { ProviderFactory } from './ai/ProviderFactory';
import { CacheManager } from './cache/CacheManager';
import { AIProvider } from './ai/types';
import { getAccessibilityTree } from './utils/accessibility';

export class PagePilot {
    private page: Page;
    private aiProvider: AIProvider;
    private cacheManager: CacheManager;

    constructor(page: Page, config: ModelConfig) {
        this.page = page;
        this.aiProvider = ProviderFactory.create(config);
        this.cacheManager = new CacheManager();
    }

    async act(goal: string): Promise<void> {
        // 1. Check Cache
        const cachedSelector = this.cacheManager.get(goal);
        if (cachedSelector) {
            console.log(`[PagePilot] Cache Hit for goal: "${goal}" -> ${cachedSelector}`);
            try {
                await this.page.locator(cachedSelector).click({ timeout: 2000 }); // Short timeout for cache check
                return;
            } catch (error) {
                console.log(`[PagePilot] Cache Stale. Element not clickable: ${error}`);
                // Proceed to AI fallback
            }
        }

        // 2. AI Fallback
        console.log(`[PagePilot] Analyzing page for goal: "${goal}"...`);

        // Get Accessibility Snapshot
        const snapshot = await getAccessibilityTree(this.page);

        if (!snapshot) {
            throw new Error('Failed to capture accessibility snapshot.');
        }

        console.log('Snapshot Size:', JSON.stringify(snapshot).length);
        console.log('Snapshot Keys:', Object.keys(snapshot));

        // Generate Selector
        const selector = await this.aiProvider.generateSelector(snapshot, goal);

        if (selector) {
            console.log(`[PagePilot] AI found selector: ${selector}`);
            try {
                await this.page.locator(selector).click({ force: true });

                // 3. Update Cache
                this.cacheManager.set(goal, selector);
            } catch (error) {
                throw new Error(`AI generated selector "${selector}" failed to interact: ${error}`);
            }
        } else {
            throw new Error('AI could not find a suitable element for the goal.');
        }
    }
}
