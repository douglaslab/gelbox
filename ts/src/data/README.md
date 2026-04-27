# `src/data/`

Static data lives here as TypeScript objects, not JSON or MDX.

- Type-checked at build time; schema drift is caught by `tsc`.
- Co-located with the components that render it.
- Python-generated payloads (e.g., from a separate build step) become typed
  TS files (`xs.data.ts`), not loose `xs.json` fetched at runtime.

See `dash/docs/principles.md` rule 9 for the rationale.
