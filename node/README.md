# PagePilot 🚀

**PagePilot** is a powerful, autonomous browser agent built on top of Playwright. It is designed to reliably execute complex web tasks by "healing" itself when selectors fail, bypassing anti-bot protections (stealth mode), and automatically parallelizing large workloads.

## Features ✨

- **Self-Healing:** Automatically recovers from broken selectors and UI changes using AI vision.
- **Stealth Mode:** Built-in evasion for anti-bot systems (Cloudflare, Akamai) using `puppeteer-extra-plugin-stealth`.
- **Auto-Parallelization:** Send a complex goal (e.g., "Compare iPhone prices on Amazon, Flipkart, Relaince"), and PagePilot automatically decomposes it into parallel sub-tasks.
- **Smart Scaling:** Enforces desktop viewports and uses "Human Scroll" logic to handle lazy-loaded content.
- **Portkey AI Integration:** Uses Portkey for reliable, observable AI inference (Gateway standard).

## Installation 📦

```bash
npm install pagepilot
```

## Configuration 🔧

PagePilot requires a **Portkey API Key** to power its AI brain. You can get one at [portkey.ai](https://portkey.ai).

Set your environment variables (or pass them in the config):

```bash
PORTKEY_API_KEY=your_key_here
PORTKEY_VIRTUAL_KEY=your_virtual_key_here # Optional
```

## Usage 💡

### 1. Basic Example (One-shot Task)

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Orchestrator } from 'pagepilot';

// 1. Setup Stealth Browser
chromium.use(StealthPlugin());
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// 2. Initialize PagePilot
const agent = new Orchestrator(page, {
  provider: 'portkey',
  apiKey: process.env.PORTKEY_API_KEY!
});

// 3. Run a Goal
const result = await agent.execute(
  "Go to amazon.in, search for 'Macbook Air M2', and extract the price of the first result."
);

console.log(result);
// Output: { amazon_price: "₹99,900" }

await browser.close();
```

### 2. Auto-Parallelization (Advanced)

PagePilot can automatically split complex requests into parallel browser sessions.

```typescript
// A complex goal involving multiple sites
const goal = `Compare the price of iPhone 15 on:
1. Amazon.in (extract as amazon_price)
2. Flipkart.com (extract as flipkart_price)
3. RelianceDigital.in (extract as reliance_price)`;

console.log("Running in parallel...");
const results = await agent.execute(goal);

console.log(results);
/* Output:
{
  amazon_price: "₹66,900",
  flipkart_price: "₹65,999",
  reliance_price: "₹66,000"
}
*/
```
## License 📄

MIT
