# PagePilot

PagePilot is a Self-Healing Playwright Automation library.

## Packages

- [Node.js Package](./node)
- [Python Package](./python)

## High-Level Architecture & Plan

### Core Philosophy: "Cache-First, AI-Fallback"
PagePilot is designed to be a resilient automation layer on top of Playwright. It solves the fragility of selector-based automation by using a hybrid approach:
1.  **Cache Lookup**: Ideally, we already know the selector/code for a semantic action (e.g., "Login").
2.  **AI Generation**: If not cached, we use an LLM (OpenAI) to inspect the DOM and generate the Playwright code on the fly.
3.  **Self-Healing**: The generated code is executed and then cached. If it fails in the future, we fall back to AI generation again to "heal" the broken selector.

```mermaid
graph TD
    A[Test Step: "Click Login"] --> B{Check Cache}
    B -- Hit --> C[Execute Cached Selector]
    B -- Miss --> D[Capture Accessibility Tree]
    D --> E[Send to OpenAI GPT-4o]
    E --> F[Receive Selector]
    F --> C
    F --> G[Update Cache]
    C --> H[Success]
```

## Quick Start

```typescript
// 1. Install
// npm install pagepilot

// 2. Use
import { PagePilot } from 'pagepilot';

const pilot = new PagePilot(page, process.env.OPENAI_API_KEY);

// 🛑 Old Way (Brittle)
// await page.click('div > .btn-primary-2'); 

// ✅ New Way (Self-Healing)
await pilot.act("Click the 'Sign Up' button inside the modal");
```

### Repository Structure
- **`node/`**: The primary TypeScript implementation. This is where the main `PagePilot` class lives, designed to be imported into existing Playwright test suites.
- **`python/`**: The Python mirror of the library, ensuring data scientists and Python-based QA engineers have the same "self-healing" capabilities.

### Roadmap
1.  **Phase 1: Foundation (Done)**
    - Monorepo setup with workspaces.
    - Basic `PagePilot` class in TS and Python.
    - Simple "Act" method implementation.

2.  **Phase 2: Enhanced Context**
    - Implement Accessibility Tree serialization (AXTree) instead of raw HTML. This reduces token usage by 90% and improves AI accuracy by removing non-interactive noise.
    - Add visual debugging (screenshots sent to GPT-4o).

3.  **Phase 3: Shared Caching**
    - Implement a persistent sidecar or cloud service to share the "Action Cache" across different test runs and even different users.

