# Cursor Handoff — Visual Redesign

## Context

The quiz app frontend has been restructured. All component logic, state management,
and UX flow changes are complete. Your job is CSS and visual polish only.
Do not change component structure, prop signatures, event handlers, or state logic.

## Design Direction

Modern, clean, minimal. Think Linear or Vercel's dashboard aesthetic.
- White/light gray backgrounds, high contrast text
- Subtle borders, no heavy shadows
- Rounded corners (md: 8px, lg: 12px)
- One accent color (suggest: indigo or sky blue) used sparingly for CTAs and active states

## Components to Style

### Page-level components
- `src/components/QuizForm.tsx` — single-page form with four sections (Quiz Info, Questions, Recipients, Send). Sections are separated by vertical spacing; the Send section has a single primary CTA button.
- `src/components/QuizResponse.tsx` — participant quiz-taking view
- `src/components/QuizResults.tsx` — paginated results table
- `src/components/Home.tsx` — landing page
- `src/components/Header.tsx` — top navigation bar
- `src/components/Footer.tsx` — footer

### Form sections (used inside QuizForm)
- `src/components/sections/QuizInfoSection.tsx` — title + duration fields
- `src/components/sections/RecipientsSection.tsx` — list of E.164 phone number inputs with add/remove

### Question components
- `src/components/questions/QuestionItem.tsx` — expandable card per question. Has a header row (question number, preview text, error dot indicator, Remove button) and a collapsible body containing QuestionEditor.
- `src/components/questions/QuestionEditor.tsx` — question text textarea + list of OptionInputs
- `src/components/steps/OptionInput.tsx` — single answer option row: checkbox ("Correct") + text input + Remove button

### AI panel
- `src/components/AiGeneratePanel.tsx` — topic input, question count radio group, Generate button, status/error messages. Shown in the Questions section when "Generate with AI" tab is active.

### Dialogs and UI primitives
- `src/components/ConfirmSendDialog.tsx` — confirmation modal before sending (uses `src/components/ui/modal.tsx`)
- `src/components/ui/modal.tsx` — base modal with backdrop, close button, optional step indicator
- `src/components/ui/button.tsx` — uses class-variance-authority; variants: default, outline, destructive
- `src/components/ui/input.tsx`, `textarea.tsx`, `label.tsx`, `checkbox.tsx` — base form elements

## Tailwind Config Notes
- Use the existing `tailwind.config.js` — do not change the theme unless extending it
- Prefer utility classes over custom CSS
- Use `@apply` only for repeated patterns (e.g., input base styles)
- Tailwind v4 is in use (`@tailwindcss/vite` plugin)

## Key UX Patterns to Style Well

1. **QuestionItem expanded/collapsed state** — collapsed shows question number + text preview; expanded shows the full editor. The toggle button should visually indicate state (chevron icon recommended).

2. **Error states** — inline error messages appear below fields (already wired with `role="alert"` and `aria-describedby`). Style with red text. Mark inputs with a red border or ring when `aria-invalid="true"`.

3. **AI mode toggle** — "Create manually" / "Generate with AI" are two adjacent buttons that act like a tab switcher (`aria-pressed` is already set). Style the active state clearly.

4. **Send Quiz button** — primary CTA at the bottom of the form. Should be visually prominent (full-width on mobile, or large on desktop).

5. **QuestionItem error indicator** — a red dot (●) appears in the question header when that question has validation errors while collapsed. Make this subtle but noticeable (small badge or icon).

## Accessibility Constraints (do not break)
- All focus rings must remain visible — do not use `outline: none` without a replacement
- Do not use color as the only indicator of state
- Do not remove `aria-*` attributes, `role` attributes, or `<label>` associations
- Do not remove `id` attributes used for `aria-describedby` / `aria-controls` / `aria-labelledby`
- The `sr-only` class is used for screen-reader-only text — do not remove it
- `aria-live="polite"` regions exist for submission status and AI generation status — do not remove them
