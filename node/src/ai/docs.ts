export const PLAYWRIGHT_DOCS = `
### PLAYWRIGHT SELECTOR RULES (STRICT COMPLIANCE REQUIRED)

1. **NO 'role=generic'**: 
   - ❌ BAD: "role=generic[name='Filters']" (Too vague, matches everything)
   - ✅ GOOD: "text='Filters'" or "role=button[name='Filters']"

2. **Correct Syntax for Chaining**:
   - You CANNOT mix ARIA and CSS without a separator.
   - ❌ BAD: "role=button :has-text('Submit')" (Syntax Error)
   - ✅ GOOD: "role=button >> text='Submit'" (Use '>>' to chain)
   - ✅ BEST: "button:has-text('Submit')" (Pure CSS)

3. **Text Selectors**:
   - Prefer exact text matching when possible.
   - ✅ GOOD: "text='64 MP & Above'"
   - ✅ GOOD: ":text-is('64 MP & Above')"

4. **Handling Filters/Checkboxes**:
   - If a first input element is hard to find, target the label text.
   - ✅ GOOD: "label:has-text('64 MP & Above')"

5. **Fallback Strategy**:
   - If you are unsure of the role, use a CSS selector based on class or ID.
   - ✅ GOOD: ".filter-item:has-text('Camera')"

6. **HANDLING AMBIGUITY (Strict Mode Violations)**:
   - Playwright will ERROR if a selector matches more than one element.
   - **Strategy A (Specific Parent):** Find a unique parent container first.
     ❌ BAD: "text='8 GB RAM'"
     ✅ GOOD: "#container-filters >> text='8 GB RAM'"
   - **Strategy B (Pick First):** If you are sure they are identical, use 'nth=0'.
     ✅ GOOD: "text='8 GB RAM' >> nth=0"
   - **Strategy C (Exact Match):** Use explicit matching to avoid partial matches.
     ✅ GOOD: ":text-is('8 GB RAM')"
`;
