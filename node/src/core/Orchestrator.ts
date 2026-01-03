import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'playwright';

chromium.use(StealthPlugin());
import { PagePilot } from './PagePilot';
import { ModelConfig, AIProvider, TaskPlan } from '../ai/types';
import { ProviderFactory } from '../ai/ProviderFactory';

export class Orchestrator {
    private page: Page;
    private config: ModelConfig;
    private aiProvider: AIProvider;
    private worker: PagePilot;
    private globalContext: any = {};

    constructor(page: Page, config: ModelConfig) {
        this.page = page;
        this.config = config;
        this.aiProvider = ProviderFactory.create(config);
        this.worker = new PagePilot(page, config);
    }

    /**
     * High-level entry point.
     * 1. Generates a plan (JSON array of tasks).
     * 2. Iterates and executes each task using the Worker.
     * 3. Aggregates results.
     */
    async execute(goal: string): Promise<any> {
        console.log(`[Orchestrator] Analying goal: "${goal}"...`);

        const subGoals = await this.aiProvider.decomposeComplexGoal(goal);

        if (subGoals.length > 1) {
            console.log(`[Orchestrator] Detected ${subGoals.length} parallel sub-goals.`);
            const results = await this.runBatch(subGoals);
            results.forEach(res => {
                if (res && !res.error) this.mergeContext(res);
            });
            return this.globalContext;
        }

        const refinedGoal = subGoals[0];
        console.log(`[Orchestrator] Executing single goal: "${refinedGoal}"`);

        const plan = await this.aiProvider.generatePlan(refinedGoal);
        if (!plan || plan.length === 0) {
            throw new Error('AI failed to generate a valid plan.');
        }

        console.log(`[Orchestrator] Generated ${plan.length} steps:`);
        plan.forEach((step, i) => console.log(`  ${i + 1}. [${step.type}] ${step.description}`));

        for (let i = 0; i < plan.length; i++) {
            const task = plan[i];

            if (!task.description && task.params?.description) {
                task.description = task.params.description;
            }
            if (!task.description) {
                task.description = `Execute ${task.type} action`;
            }

            console.log(`\n[Orchestrator] Executing Step ${i + 1}/${plan.length}: ${task.description}`);
            try {
                const result = await this.worker.executeTask(task, refinedGoal);

                if (result) {
                    this.mergeContext(result);
                }
            } catch (error) {
                console.error(`[Orchestrator] Step ${i + 1} failed: ${error}`);
                throw error;
            }
        }

        console.log('[Orchestrator] Execution Complete.');
        return this.globalContext;
    }

    async runBatch(goals: string[]): Promise<any[]> {
        console.log(`[Orchestrator] Running batch of ${goals.length} goals in parallel...`);

        const browser = this.page.context().browser();
        if (!browser) {
            throw new Error('Orchestrator requires a Page created from a Browser to run batch operations (browser instance missing).');
        }

        const results = await Promise.all(goals.map(async (goal, index) => {
            console.log(`[Batch Worker ${index + 1}] Starting...`);
            let context = null;
            try {
                context = await browser.newContext({
                    viewport: { width: 1920, height: 1080 },
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                });
                const page = await context.newPage();

                const orchestrator = new Orchestrator(page, this.config);
                const result = await orchestrator.execute(goal);

                console.log(`[Batch Worker ${index + 1}] Completed.`);
                return result;
            } catch (error) {
                console.error(`[Batch Worker ${index + 1}] Failed: ${error}`);
                return { error: String(error) };
            } finally {
                if (context) await context.close();
            }
        }));

        return results;
    }

    private mergeContext(newResult: any) {
        if (typeof newResult === 'object' && newResult !== null && !Array.isArray(newResult)) {
            this.globalContext = { ...this.globalContext, ...newResult };
        } else if (Array.isArray(newResult)) {
            if (!this.globalContext.results) this.globalContext.results = [];
            this.globalContext.results.push(...newResult);
        } else {
            if (!this.globalContext.values) this.globalContext.values = [];
            this.globalContext.values.push(newResult);
        }
    }
}
