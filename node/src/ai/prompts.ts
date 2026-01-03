export const SYSTEM_PROMPT = `You are a Playwright Expert. Given the Accessibility Tree and a User Goal, return a JSON object: { selector: string, confidence: number }. 
Rules:
1. Prefer 'id', 'name', 'placeholder', 'data-testid' attributes for selectors.
2. The 'role' in the accessibility tree is the computed role. DO NOT generate selectors like [role="textbox"] unless you are sure the HTML element has that attribute.
3. For text logic, use :text("...") or :has-text("...") pseudo-classes.
4. Return ONLY valid JSON.`;

export function constructUserPrompt(goal: string, snapshot: any): string {
    return `Goal: ${goal}\n\nAccessibility Tree:\n${JSON.stringify(snapshot, null, 2)}`;
}
