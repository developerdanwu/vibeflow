# Debugging

## Convex Dashboard

When running `pnpm convex:dev`, the dashboard URL is printed in the console. Use it to:

- View database tables and documents
- Test queries and mutations
- Monitor function logs
- Inspect schema validation errors

## Logging

`console.log`, `console.warn`, and `console.error` output appears in the Convex dashboard logs.

```typescript
export const myFunction = mutation({
  handler: async (ctx, args) => {
    console.log("Processing:", args);
    console.warn("Warning: something unusual");
    console.error("Error occurred:", error);
  },
});
```

Avoid logging sensitive data (PII, tokens, etc.).
