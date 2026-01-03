export interface AIProvider {
    /**
     * Generates a Playwright selector based on the accessibility snapshot and user goal.
     * @param snapshot The accessibility snapshot from Playwright.
     * @param goal The user's goal (e.g., "Click the login button").
     * @returns A promise that resolves to the selector string or null if not found.
     */
    generateSelector(snapshot: any, goal: string): Promise<string | null>;
}

export type ModelConfig = {
    provider: 'openai' | 'anthropic' | 'gemini' | 'portkey';
    apiKey: string;
    param?: string; // e.g. virtualKey or configId for Portkey
};
