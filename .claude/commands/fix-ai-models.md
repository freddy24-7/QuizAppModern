# Fix AI Model Configuration

Use this command when the app stops working due to a Gemini model or quota change.

## Step 1 — Identify the current model configuration

Read the AI provider config file (typically `src/lib/ai-provider.ts` or similar). Note:
- The primary model ID (OpenRouter or direct Gemini)
- The fallback chain for free/direct models
- Any hardcoded model ID strings

## Step 2 — Get the list of available models for the API key

Ask the user to run this and paste the output:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | python3 -m json.tool | grep -E '"name"|"generateContent"'
```

From the output, identify which models support `generateContent` — those are the ones usable for text generation.

## Step 3 — Check the error logs

Ask the user for error logs (Vercel dashboard or similar). Diagnose each failure:
- **404** on OpenRouter: model ID no longer exists on OpenRouter
- **400** on OpenRouter: model ID format is wrong
- **429 with limit: 0**: free tier quota permanently removed for this model on the API key
- **503**: model overloaded (temporary, keep in fallback but deprioritise)

## Step 4 — Update the model configuration

Based on steps 2 and 3:

1. **Remove broken models**: any model returning 404, 400, or 429 with `limit: 0`
2. **Update OpenRouter free model IDs**: verify at `https://openrouter.ai/models?q=gemini&supported_parameters=free`
3. **Reorder the direct Gemini fallback chain**: prefer `gemini-2.5-*` over `gemini-2.0-*`; prefer `-lite` variants first (more free tier quota)
4. **Update the primary model** if it was broken

Typical priority order for direct Gemini fallback (validate against available models list):
1. `gemini-2.5-flash-lite` — lightest, most quota
2. `gemini-2.5-flash` — better quality
3. Others as available

## Step 5 — Verify with the health check endpoint

If the project has a `/api/health` endpoint, curl it after deploying:
```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{ "status": "ok", "models": [...] }
```

For each model in the response:
- `ok: false` with 400/404 → remove from config
- `ok: false` with 429 → remove if `limit: 0`, keep if rate-limited temporarily
- `ok: false` with 503 → keep but move lower in fallback chain
- `ok: true` → good, keep

## Step 6 — Set up health monitoring (if not already in place)

If the project has no `/api/health` endpoint, create one at `src/app/api/health/route.ts` that:
- Tests each model in the fallback chain with a minimal prompt (`Reply with exactly one word: OK`)
- Uses `abortSignal: AbortSignal.timeout(8000)` per model to prevent hangs
- Returns 200 if any model works, 503 if all fail
- Sets `export const maxDuration = 60` to handle sequential model tests

Then configure a daily monitor at [UptimeRobot](https://uptimerobot.com):
- Type: HTTPS
- URL: `https://your-domain.com/api/health`
- Interval: 1440 minutes (once daily)
- Alert: email on non-200 response
