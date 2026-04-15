# Quiz App — Claude Code Project Guide

## Project Overview

A quiz generation and distribution platform. Users create quizzes (manually or via AI), then send them to recipients via Twilio SMS. The backend is Java, the frontend is Vite/React.

---

## Repository Structure

```
quiz-app/
├── backend/       # Java Spring Boot API
├── frontend/      # Vite + React
└── CLAUDE.md      # This file
```

---

## Tech Stack

### Backend
- Java (Spring Boot)
- Deployed on Railway (migrating from Vercel — see migration task below)
- Twilio SDK for SMS delivery

### Frontend
- Vite + React
- Tailwind CSS (styling deferred to Cursor — see handoff section)
- Gemini API for AI quiz generation

---

## Current Workstream & Task Order

Complete tasks in this order. Do not start a later task until the earlier one is done.

### 1. Infrastructure: Migrate backend from Vercel to Railway

Vercel is not suited for a Java backend (no JVM runtime support). The backend must move to Railway.

- Create a `railway.toml` or `Dockerfile` in `backend/` if not already present
- Ensure environment variables (Twilio credentials, DB config, etc.) are documented in `.env.example`
- Update any hardcoded Vercel URLs in the frontend to use an environment variable: `VITE_API_BASE_URL`
- Remove any Vercel-specific config (`vercel.json`) from the backend directory
- Verify CORS settings allow the frontend origin (Vercel-hosted frontend calling Railway-hosted backend)

### 2. Frontend: Simplify the UX flow (before CSS handoff to Cursor)

The current UI is a sequential modal chain. Replace this with a single-page, progressive form layout.

**Current pattern (to remove):** Modal → fill in → next modal → fill in → next modal...

**Target pattern:**
- All quiz creation steps visible on one page, grouped into logical sections
- Sections: Quiz Info → Questions → Recipients → Send
- Each section can be expanded/collapsed, but the full flow is visible at a glance
- No modals except for confirmation dialogs (e.g., "Are you sure you want to send?")
- Inline validation with clear error messages — no alert popups
- Focus management: when a section completes, focus moves naturally to the next

**Do not touch CSS classes or visual styling** — Cursor will handle that. Focus only on component structure, state management, and UX flow logic.

**React patterns to follow (enforced):**
- No `useEffect` for derived state or data transformations — use `useMemo` or compute inline
- `useEffect` is only acceptable for: subscriptions, focus management, third-party DOM integrations
- Prefer controlled components over uncontrolled
- Lift state to the nearest common ancestor; avoid prop drilling beyond 2 levels (use context or a small state store instead)
- No anonymous functions as event handlers in JSX — define named handlers

### 3. Frontend: Add AI Quiz Generation (Gemini API)

Add an "AI Generate" mode alongside the existing manual quiz creation flow.

**Flow:**
1. User selects "Generate with AI" (toggle or tab alongside "Create manually")
2. User types a topic (e.g., "The Roman Empire")
3. User selects number of questions (slider or input: 5, 10, 15, 20)
4. User clicks "Generate"
5. App calls Gemini API (from the frontend — no backend involvement needed)
6. Generated questions are loaded into the existing quiz form, ready to review/edit before sending

**Gemini integration:**
- Store the API key in `.env.local` as `VITE_GEMINI_API_KEY`
- Before implementing, run the following to identify available models for the user's key:
  ```
  curl https://generativelanguage.googleapis.com/v1beta/models?key=$VITE_GEMINI_API_KEY
  ```
  Use a model from the `generateContent`-capable list (prefer `gemini-1.5-flash` or `gemini-2.0-flash` if available — they have the most generous free tier).
- Prompt the model to return structured JSON. Example system prompt:
  ```
  You are a quiz generator. Return ONLY valid JSON with no markdown, no explanation.
  Format: { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 } ] }
  Generate {n} multiple-choice questions about: {topic}
  Each question must have exactly 4 options and one correct answer.
  If the topic is too narrow or obscure to generate a full quiz, return: { "error": "insufficient_topic" }
  ```
- Parse the response and handle `{ "error": "insufficient_topic" }` by showing the user:
  > "Sorry, we couldn't make a quiz about that topic — please try a broader subject."
- The generated questions load into the same quiz form as manual questions (same data shape, same backend submission)

**Input validation for AI topic:**
- Minimum 3 characters
- Must contain at least one alphabetic character (reject pure numbers/symbols)
- Max 120 characters
- Trim whitespace before sending

### 4. Security & Resilience

**Rate limiting (429 protection):**
- Backend: add a per-IP rate limiter on quiz submission and SMS-send endpoints
  - Suggested: Spring's `Bucket4j` library or a simple in-memory token bucket
  - Limit: 10 quiz submissions per IP per hour; 20 SMS sends per IP per hour
  - Return HTTP 429 with a `Retry-After` header
- Frontend: on 429 response, show a user-friendly message: "You've sent too many requests. Please wait a few minutes before trying again."
- Gemini AI requests: debounce the Generate button (disable for 3 seconds after click); catch HTTP 429 from Gemini and show: "AI generation is temporarily unavailable — please try again shortly."

**Input validation (nonsensical input protection):**
- Quiz title: required, 3–120 chars, no pure whitespace
- Question text: required, 10–500 chars
- Answer options: all 4 required, each 1–200 chars, must be distinct
- Recipient phone numbers: validate E.164 format (`+[country code][number]`) before sending to Twilio
- AI topic field: see rules in section 3 above
- Apply validation on both frontend (inline, immediate feedback) and backend (return 400 with field-level error messages)

**Accessibility:**
- All interactive elements must have visible focus indicators
- Form fields must have associated `<label>` elements (not just placeholder text)
- Error messages must be linked to their fields via `aria-describedby`
- Color alone must not convey meaning (pair colors with text or icons)
- The quiz creation flow must be navigable by keyboard only
- Use `aria-live="polite"` regions for dynamic content (generation status, send confirmation)
- Test with a screen reader or axe-core before considering a feature done

---

## Testing Requirements

Write meaningful tests for main functionality. Coverage completeness is not the goal — correctness of critical paths is.

### Backend (Java)

Use JUnit 5 + Mockito. Focus on:

- `QuizService`: quiz creation, retrieval, validation edge cases
- `SmsService`: Twilio call construction; test that invalid phone numbers are rejected before Twilio is called
- `RateLimiter`: verify that the 11th request within the window returns 429
- Controller layer: test 400 responses for missing/invalid fields; test 429 response

**Non-happy-path cases to cover:**
- Submitting a quiz with no questions → 400
- Submitting with duplicate answer options → 400
- Phone number in wrong format → 400
- Exceeding rate limit → 429
- Twilio API failure → 502 with meaningful error, not a raw stack trace

### Frontend (React)

Use Vitest + React Testing Library. Focus on:

- Quiz creation form: all required fields enforced; invalid inputs show inline errors
- AI generation: successful generation populates the form; `insufficient_topic` error shows the user message; network error is handled gracefully
- Rate limit response (429): correct user-facing message shown
- Recipient phone field: accepts valid E.164, rejects garbage input
- Accessibility: all form fields have labels; error messages are associated via `aria-describedby`

**Do not write tests for:**
- CSS or visual appearance
- Library internals (React, Axios, etc.)
- Every possible input permutation — pick representative edge cases

---

## Cursor Handoff (CSS / Visual Styling)

Claude Code will complete the structural and logic changes above first, then generate this handoff document for Cursor.

**When all Claude Code tasks are done, create a file at `cursor-handoff.md` in the repo root containing:**

```markdown
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
[Claude Code: list the actual component files here]

## Tailwind Config Notes
- Use the existing tailwind.config.js — do not change the theme unless extending it
- Prefer utility classes over custom CSS
- Use `@apply` only for repeated patterns (e.g., input base styles)

## Accessibility Constraints (do not break)
- All focus rings must remain visible — do not use `outline: none` without a replacement
- Do not use color as the only indicator of state
- Do not remove aria attributes or label associations
```

---

## Environment Variables

### Backend (`backend/.env.example`)
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
DATABASE_URL=
RAILWAY_ENVIRONMENT=production
```

### Frontend (`frontend/.env.example`)
```
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_GEMINI_API_KEY=
```

---

## Skills & Conventions

### Java (Backend)
- Spring Boot conventions: controllers thin, services own business logic, repositories for data access
- Use `@Valid` and Bean Validation annotations for input validation at the controller layer
- Return `ProblemDetail` (RFC 7807) for error responses — consistent structure for the frontend to parse
- No raw `System.out.println` — use SLF4J logger
- Exceptions: define a small set of domain exceptions (`QuizNotFoundException`, `RateLimitExceededException`, etc.) and handle them in a `@ControllerAdvice`

### React (Frontend)
- No `useEffect` for derived state — see section 2
- State shape should mirror the backend's request body where possible — reduces mapping code
- Async operations: use `async/await` with try/catch, not `.then().catch()` chains
- Loading and error states are first-class — every async operation has three states: idle, loading, error/success
- File structure: one component per file; co-locate tests (`ComponentName.test.tsx` next to `ComponentName.tsx`)

---

## Out of Scope (for this workstream)

- User authentication / accounts (not in scope)
- Quiz analytics or response tracking (not in scope)
- Email delivery (SMS only via Twilio)
- Backend AI integration (Gemini calls are frontend-only; backend handles quiz storage/sending the same way regardless of origin)
