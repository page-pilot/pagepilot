# PagePilot 🚀

**The Adaptive & Autonomous Browser Agent.**

PagePilot is a next-generation Playwright automation library that **adapts** to UI changes in real-time. It moves beyond brittle selectors by using AI vision and semantic understanding to reliably execute complex web tasks.

## Why PagePilot?

Traditional automation breaks when the UI changes. PagePilot is **Resilient**.

-   **🛡️ Adaptive Selectors:** No more broken scripts. PagePilot analyzes the page semantically to find elements even when classes or IDs change.
-   **⚡ Autonomous Parallelization:** Give it a high-level goal (e.g., "Compare prices on Amazon, Flipkart, & Croma"), and it automatically decomposes the task and spins up parallel workers.
-   **🥷 Advanced Stealth:** Built-in integration with `puppeteer-extra-plugin-stealth` allows you to navigate sites with sophisticated bot protections.
-   **🧠 Human-Like Interaction:** Features "Human Scroll" and passive scanning to interact with pages naturally and efficiently.

## Installation 📦

```bash
npm install @pagepilot/pagepilot
```

## Configuration 🔧

PagePilot allows you to plug in your preferred AI provider via **Portkey**.

```bash
# .env
PORTKEY_API_KEY=your_key
```

## Usage 💡

### 1. Sequential Task (Resilient Execution)

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Orchestrator } from 'pagepilot';

chromium.use(StealthPlugin());
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const agent = new Orchestrator(page, {
  provider: 'portkey',
  apiKey: process.env.PORTKEY_API_KEY!
});

// The agent will find the search bar and price semantically
const result = await agent.execute(
  "Go to amazon.in, search for 'Sony WH-1000XM5', and extract the price."
);

console.log(result);
await browser.close();
```

### 2. Autonomous Parallel Scaling

Automatically split complex goals into concurrent browser sessions.

```typescript
const goal = `
  Compare the price of 'iPhone 15' on:
  1. Amazon.in
  2. Flipkart.com
  3. RelianceDigital.in
`;

const results = await agent.execute(goal);
console.table(results);
```

## License 📄

MIT
