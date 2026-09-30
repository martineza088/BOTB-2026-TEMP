# Business MCP starter

A local, beginner-friendly setup interface for preparing a business packet before creating an MCP server.

## Run locally

Install Node.js 22.12 or newer, then run:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. `npm run build` creates the production frontend in `dist`. `npm test` checks the document validation rules.

## Included

- Responsive three-step setup guide.
- PDF selection and browser-side text extraction with PDF.js; 20 MB and 100-page limits.
- Visible requirements for products/menu, pricing, inventory, policies, location, hours, and branding.
- Conservative keyword-based evidence suggestions with excerpts and page numbers.
- Manual confirmation before continuing and a downloadable JSON review report.
- Helpful errors for unreadable, protected, or scanned documents.

## Deliberate integration boundaries

This is a frontend starter. The Account setup button explains that authentication is not connected. It does not simulate login. No PDF, progress, or account data is stored or uploaded. Refreshing clears the review. Scanned pages need OCR; mixed scanned/text documents may have missing evidence.

Keyword matches cannot establish completeness, factual accuracy, or freshness. Prices receive a basic currency/number check; other categories require manual review and may produce false positives or negatives. Heading-only matches remain unclear. Replace or augment these rules with structured extraction and semantic validation before production use. The review report includes excerpts rather than a full business dataset.

## Next implementation steps

1. Connect an authentication provider and enforce session/ownership checks on every backend route. Never put secrets in browser code.
2. Add authenticated packet storage and processing if needed; define retention and deletion behavior.
3. Add OCR and structured extraction that returns fields plus source-page evidence; let users correct results.
4. Connect the chosen MCP product through a backend adapter. See `docs/backend-contract.md`.
5. Implement the server tools, an authenticated MCP endpoint, and a connection test. The current starter does not create or host MCP servers.

Files: `src/main.js` (workflow), `src/pdf.js` (extraction), `src/requirements.js` (validation), `src/style.css` (design).
