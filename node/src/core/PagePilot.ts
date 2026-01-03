import { Page } from 'playwright';
import { ModelConfig, TaskPlan } from '../ai/types';
import { ProviderFactory } from '../ai/ProviderFactory';
import { CacheManager } from '../cache/CacheManager';
import { AIProvider } from '../ai/types';
import { getAccessibilityTree } from '../utils/accessibility';

export class PagePilot {
    private page: Page;
    private aiProvider: AIProvider;
    private cacheManager: CacheManager;

    constructor(page: Page, config: ModelConfig) {
        this.page = page;
        this.aiProvider = ProviderFactory.create(config);
        this.cacheManager = new CacheManager();
    }

    /**
     * Executes a single atomic task from the Orchestrator plan.
     * @param task The task plan object (type, params, description).
     * @returns The result of the task, if any.
     */
    async executeTask(task: TaskPlan, globalGoal?: string): Promise<any> {
        console.log(`[PagePilot] Worker received task: [${task.type}] ${task.description}`);

        if (task.type === 'navigate' && task.params?.url) {
            console.log(`[PagePilot] Navigating to ${task.params.url}...`);
            await this.page.goto(task.params.url);
            await this.page.waitForLoadState('domcontentloaded');
            return;
        }

        const localGoal = task.description;
        const combinedGoal = globalGoal
            ? `Task: ${localGoal}. Global Goal: ${globalGoal}. PASSIVE SCAN: If you see the global goal (e.g. price) achieved, extract it and return 'done' IMMEDIATELY.`
            : localGoal;

        const maxSteps = 5;
        const history: string[] = [];
        let collectedData: any = null;

        for (let i = 0; i < maxSteps; i++) {
            console.log(`[PagePilot] Worker Step ${i + 1}/${maxSteps}`);

            let snapshot = await this.getSnapshotWithRetry();
            if (!snapshot) throw new Error('Failed to capture accessibility snapshot.');

            const decision = await this.aiProvider.determineNextAction(snapshot, combinedGoal, history);
            console.log(`[PagePilot] Action: ${JSON.stringify(decision.action)}`);

            if (decision.action.type !== 'fail') {
                history.push(`Step ${i + 1}: ${decision.action.description}`);
            } else {
                history.push(`Step ${i + 1}: Failed - ${decision.action.reason}`);
            }

            const action = decision.action;

            if ('result' in action && action.result) {
                if (!collectedData) collectedData = action.result;
                else if (typeof collectedData === 'object' && typeof action.result === 'object') {
                    collectedData = { ...collectedData, ...action.result };
                } else {
                    collectedData = action.result;
                }
            }

            if (action.type === 'fail') throw new Error(`Agent failed: ${action.reason}`);

            if (action.type === 'done') {
                console.log('[PagePilot] Task Done (Early Exit Triggered?).');
                return collectedData || action.result;
            }

            try {
                await this.performAction(action);
            } catch (error: any) {
                console.warn(`[PagePilot] Action execution failed: ${error}`);

                let tip = "";
                if (error.message && error.message.includes("InvalidSelector")) {
                    tip = " You generated invalid Playwright syntax. Review the RULES in your instructions. Do not mix 'role=' and CSS without '>>'.";
                }
                if (error.message && error.message.includes("strict mode violation")) {
                    tip = " AMBIGUITY ERROR: Your selector matched multiple elements. You MUST make it unique. Use a parent container (e.g. '#filters >> ...') OR append '>> nth=0' to pick the first one.";
                }

                history.push(`Step ${i + 1} Execution Failed: ${error}.${tip} Try a simpler or more specific selector.`);
            }
        }

        console.warn('[PagePilot] Worker exceeded max steps without explicit "done". Returning collected data.');
        return collectedData;
    }

    private async getSnapshotWithRetry() {
        for (let attempt = 0; attempt < 3; attempt++) {
            const snapshot = await getAccessibilityTree(this.page);
            if (snapshot) return snapshot;
            await this.page.waitForTimeout(500);
        }
        return null;
    }

    private async performAction(action: any) {
        try {
            if (action.type === 'click') {
                const locator = this.page.locator(action.selector);
                if (await locator.count() === 0) throw new Error(`Selector '${action.selector}' not found.`);
                await locator.click({ force: true, timeout: 5000 });
                await this.page.waitForLoadState('networkidle').catch(() => { });
            } else if (action.type === 'type') {
                const locator = this.page.locator(action.selector);
                if (await locator.count() === 0) throw new Error(`Selector '${action.selector}' not found.`);
                await locator.fill(action.value, { force: true, timeout: 5000 });
                if (action.submit) {
                    await locator.press('Enter');
                    await this.page.waitForLoadState('networkidle').catch(() => { });
                }
            } else if (action.type === 'scroll') {
                const amount = action.amount || 1000;
                const direction = action.direction || 'down';

                await this.page.evaluate(async (dir) => {
                    const scrollHeight = document.body.scrollHeight;
                    if (dir === 'down') {
                        window.scrollTo(0, scrollHeight);
                        await new Promise(r => setTimeout(r, 1000));
                        window.scrollBy(0, -100);
                        await new Promise(r => setTimeout(r, 500));
                        window.scrollTo(0, document.body.scrollHeight);
                    } else {
                        window.scrollTo(0, 0);
                    }
                }, direction);
                await this.page.waitForTimeout(1000);
            }
            await this.page.waitForTimeout(500);
        } catch (error) {
            console.warn(`[PagePilot] Action failed: ${error}`);
            throw error;
        }
    }
}
