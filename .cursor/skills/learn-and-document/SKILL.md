---
name: learn-and-document
description: Analyzes conversations for mistakes, corrections, and learnings, then updates relevant documentation in AGENTS.md files and repo-specific docs folders. Use when mistakes are corrected, patterns are clarified, or new learnings emerge during development.
---

# Learn and Document

Captures learnings from conversations and updates documentation to prevent repeating mistakes and preserve knowledge.

## When to Use

Apply this skill when:
- Mistakes are corrected during development
- Patterns or conventions are clarified
- New learnings emerge about the codebase
- User provides corrections or feedback
- Edge cases or gotchas are discovered

## Documentation Structure

### Primary Documentation Files
- **Root level**: `AGENTS.md` - Main project documentation
- **Scope-specific**: `src/AGENTS.md`, `convex/AGENTS.md` (if they exist) - Scope-specific guides

### Repo-Specific Docs
- **Frontend**: `src/docs/*.md` - Referenced from `src/AGENTS.md` or root `AGENTS.md`
- **Backend**: `convex/docs/*.md` - Referenced from `convex/AGENTS.md` or root `AGENTS.md`
- **General**: `docs/*.md` - Referenced from root `AGENTS.md`

### Reference Pattern
Docs are referenced in AGENTS.md files like:
```markdown
- **UI Components:** See [src/docs/ui.md](src/docs/ui.md) for patterns
- **Convex patterns:** See [src/docs/convex.md](src/docs/convex.md) for mutations
```

## Process

### Step 1: Identify Learning

Extract from conversation:
- **What was the mistake?** (incorrect approach, wrong assumption)
- **What was the correction?** (correct approach, proper pattern)
- **Why did it happen?** (missing context, unclear docs, common pitfall)
- **What scope?** (frontend, backend, general, specific feature)

### Step 2: Determine Location

**Scope-based routing:**

| Scope | AGENTS.md Location | Docs Folder | Example |
|-------|------------------|-------------|---------|
| Frontend/React | `src/AGENTS.md` or root `AGENTS.md` | `src/docs/` | UI patterns, React hooks |
| Backend/Convex | Root `AGENTS.md` | `convex/docs/` | Schema patterns, mutations |
| General/Project | Root `AGENTS.md` | `docs/` or root | Build process, tooling |
| Feature-specific | Root `AGENTS.md` | `src/docs/` or feature folder | Calendar patterns, DnD |

**Decision logic:**
1. If it's about a specific feature module → `src/docs/[feature].md` or feature folder
2. If it's about React/UI patterns → `src/docs/ui.md` or create new doc
3. If it's about Convex/backend → `convex/docs/[topic].md`
4. If it's general → root `docs/` or appropriate scope folder

### Step 3: Update Documentation

**For existing docs:**
- Add a new section if topic doesn't exist
- Update existing section if pattern is clarified
- Add examples showing wrong vs. right approach
- Use clear headings and code examples

**For new docs:**
- Create file in appropriate `docs/` folder
- Use clear filename: `[topic].md` (e.g., `dialog-patterns.md`, `dnd-handling.md`)
- Follow existing doc structure (see `src/docs/ui.md` as template)
- Add reference in relevant AGENTS.md file

**Documentation format:**
```markdown
## [Topic Name]

**When this applies:** One sentence context

### ❌ Wrong
```tsx
// Minimal example showing the mistake
```

### ✅ Correct
```tsx
// Minimal example showing the fix
```

**Why:** One sentence explanation
```

**Keep it concise:**
- Use minimal code examples - only show what's relevant
- One sentence explanations are usually enough
- Skip obvious context (assume reader knows React/TypeScript basics)
- Don't repeat what's already clear from the code

### Step 4: Update AGENTS.md Reference

Add or update reference in appropriate AGENTS.md:

```markdown
### Related Documentation
- **Dialog patterns:** See [src/docs/dialog-patterns.md](src/docs/dialog-patterns.md) for discriminated union pattern
```

## Examples

### Example 1: Dialog Store Pattern

**Learning:** Dialog store should use discriminated union pattern with single `dialog` field, not separate fields.

**Location:** `src/docs/dialog-patterns.md` (new), referenced in root `AGENTS.md`

**Action:**
1. Create `src/docs/dialog-patterns.md` with pattern explanation
2. Add reference in root `AGENTS.md` under "Related Documentation"

### Example 2: Recurring Event Dialog

**Learning:** Recurring event dialog should not have a `mode` parameter - dialog text stays the same, only callbacks differ.

**Location:** Update `src/docs/dialog-patterns.md` (if exists) or create it

**Action:**
1. Add section about recurring event dialogs
2. Show wrong (with mode) vs. right (without mode) patterns

### Example 3: Drag Prevention for Locked Events

**Learning:** To prevent visual drag of locked events, intercept `onPointerDown` and call `e.preventDefault()`/`e.stopPropagation()`, don't just use `disabled` prop.

**Location:** `src/docs/dnd-handling.md` (new) or update existing DnD docs

**Action:**
1. Create or update DnD documentation
2. Add reference in `src/AGENTS.md` or root `AGENTS.md`

## Best Practices

### Content Guidelines
- **Be concise and to the point:** Get straight to the learning. Avoid verbose explanations or unnecessary context.
- **Be specific:** Include concrete code examples when they clarify the point
- **Show contrast:** Always show wrong vs. right when applicable - this is the most effective way to communicate the correct pattern
- **Explain why briefly:** A one-sentence explanation is usually enough. Don't over-explain.
- **Add examples when needed:** Use examples to illustrate patterns, but only when they add clarity. Don't add examples just for the sake of it.
- **Link related:** Reference other relevant docs instead of duplicating content
- **Keep current:** Update docs when patterns change

### Writing Style
- **Simple language:** Use clear, direct language. Avoid jargon unless necessary.
- **Short sentences:** Break complex ideas into shorter sentences.
- **One idea per section:** Each section should cover one concept.
- **Skip obvious context:** Assume the reader knows React/TypeScript basics. Don't explain what `useState` does.

### Organization
- **Group related learnings:** Don't create a new doc for every small learning. Consolidate related patterns.
- **Use clear headings:** Make it easy to find information quickly
- **Cross-reference:** Link between related docs instead of repeating content
- **Maintain structure:** Follow existing doc patterns for consistency

### When NOT to Document
- One-off typos or syntax errors
- Temporary workarounds
- Things already well-documented elsewhere
- Very obvious mistakes (unless they're common)

## Workflow Checklist

When documenting a learning:

- [ ] Identify the mistake/learning clearly (one sentence)
- [ ] Determine appropriate scope (frontend/backend/general)
- [ ] Check if relevant doc exists
- [ ] Create or update doc file
- [ ] Add/update reference in AGENTS.md
- [ ] Use wrong/right pattern with minimal examples (only if needed)
- [ ] Add brief "why" explanation (one sentence)
- [ ] Review for conciseness - remove any unnecessary words or context
- [ ] Verify doc structure matches existing patterns

## Common Scopes and Locations

| Topic Area | Docs Location | AGENTS.md Reference |
|------------|---------------|---------------------|
| React/UI components | `src/docs/ui.md` | `src/AGENTS.md` or root |
| State management | `src/docs/state.md` | `src/AGENTS.md` |
| Forms | `src/docs/ui.md` (forms section) | Root `AGENTS.md` |
| Drag & Drop | `src/docs/dnd-handling.md` | `src/AGENTS.md` |
| Convex mutations | `src/docs/convex.md` | Root `AGENTS.md` |
| Convex schema | `convex/docs/schema.md` | Root `AGENTS.md` |
| API integration | `convex/docs/google-calendar-setup.md` | Root `AGENTS.md` |
| Build/deployment | Root `docs/` or root `AGENTS.md` | Root `AGENTS.md` |
