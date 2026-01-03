export type AgentAction =
    | { type: 'click', selector: string, description: string }
    | { type: 'type', selector: string, value: string, submit?: boolean, description: string }
    | { type: 'scroll', direction: 'up' | 'down', amount?: number, description: string }
    | { type: 'extract', selector: string, result?: any, description: string }
    | { type: 'done', result?: any, description: string }
    | { type: 'fail', reason: string };

export interface AIDecision {
    reasoning: string;
    action: AgentAction;
}

export type TaskPlan = {
    type: 'navigate' | 'click' | 'fill' | 'extract' | 'scroll';
    params?: any;
    description: string;
};

export interface AIProvider {
    /**
     * Generates a Playwright selector based on the accessibility snapshot and user goal.
     * @param snapshot The accessibility snapshot from Playwright.
     * @param goal The user's goal (e.g., "Click the login button").
     * @returns A promise that resolves to the selector string or null if not found.
     */
    generateSelector(snapshot: any, goal: string): Promise<string | null>;

    /**
     * Determines the next action for the autonomous agent.
     * @param snapshot The accessibility snapshot.
     * @param goal The high-level user goal.
     * @param history The history of previous actions.
     * @returns A promise that resolves to the AI's decision.
     */
    determineNextAction(snapshot: any, goal: string, history: string[]): Promise<AIDecision>;

    /**
     * Decomposes a high-level goal into a sequence of atomic tasks.
     * @param goal The high-level user goal.
     * @returns A promise that resolves to a list of planned tasks.
     */
    generatePlan(goal: string): Promise<TaskPlan[]>;

    /**
     * Decomposes a complex goal into multiple sub-goals for parallel execution.
     * @param goal The high-level user goal.
     * @returns A promise that resolves to a list of sub-goals.
     */
    decomposeComplexGoal(goal: string): Promise<string[]>;
}

export type ModelConfig = {
    provider: 'openai' | 'anthropic' | 'gemini' | 'portkey';
    apiKey: string;
    param?: string; // e.g. virtualKey or configId for Portkey
};
