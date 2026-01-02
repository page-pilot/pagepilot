import os
import asyncio
from typing import Optional, Dict
from playwright.async_api import Page
from openai import AsyncOpenAI

class PagePilot:
    def __init__(self, page: Page, api_key: Optional[str] = None):
        self.page = page
        self.openai = AsyncOpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.action_cache: Dict[str, str] = {}

    async def act(self, description: str):
        # 1. Check Cache
        if description in self.action_cache:
            print(f"[Cache Hit] Executing cached action for: \"{description}\"")
            cached_code = self.action_cache[description]
            await self._execute_code(cached_code)
            return

        # 2. AI Fallback
        print(f"[AI Fallback] Generating action for: \"{description}\"")
        code = await self._generate_code(description)

        if code:
            await self._execute_code(code)
            # 3. Update Cache
            self.action_cache[description] = code
        else:
            raise Exception(f"Failed to generate action for: \"{description}\"")

    async def _generate_code(self, description: str) -> Optional[str]:
        response = await self.openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Playwright automation expert. Generate ONLY the executable Python code for the requested action on the 'page' object (variable name 'page'). Do not include markdown formatting or explanations."
                },
                {
                    "role": "user",
                    "content": f"Action: {description}"
                }
            ]
        )
        return response.choices[0].message.content

    async def _execute_code(self, code: str):
        try:
            # Dangerous in production without sandboxing, but acceptable for this scaffolding demo
            # We create a local scope with 'page' available
            local_scope = {'page': self.page}
            # Wrap code in an async function to allow await
            wrapped_code = f"async def _func():\n" + "\n".join([f"    {line}" for line in code.splitlines()]) + "\n    return"
            exec(wrapped_code, globals(), local_scope)
            await local_scope['_func']()
        except Exception as e:
            print(f"Execution failed: {e}")
            raise e
