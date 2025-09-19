# LangSmith load testing

Runs 100 concurrent traces of ~400KB each with timing.

1. Copy `.env.example` into `.env`, populating your `LANGSMITH_API_KEY`.
2. Run `pnpm i`
3. Run `pnpm tsx index.ts`

You can tweak the number of concurrent traces in `index.ts`.
