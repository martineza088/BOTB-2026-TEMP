# Business MCP starter

A guided business-packet review interface with heading-based extraction and server-side Gemini semantic assessment.

## Run

Use Node.js 22.12 or newer:

```
npm install
```

Copy `.env.example` to `.env`, set `GEMINI_API_KEY` using a key from https://aistudio.google.com/apikey, then run `npm run dev`. Open http://127.0.0.1:5173. Never put the key in a VITE_ variable or commit `.env`.

`npm test` runs parser and mocked Gemini checks. `npm run build` builds the browser files. `npm run preview` serves the build AND the review API. Static hosting alone cannot run Gemini review.

## Document headings

Put each heading on a separate line. Case is ignored; numeric prefixes like `01 /` are supported:

1. Business Profile: business identity, owner, model, location, contact details, hours and time zone.
2. Products and Pricing: names, descriptions, units, prices, currency, taxes and fees.
3. Inventory and Availability: inventory table linked to products, quantities and availability definitions.
4. Sample Business Policies: payments, returns, warranty, fulfillment, cancellations and customer information.
5. Branding: brand name, voice, colors and logo guidance.

Content continues until the next recognized section heading, including across pages. Subheadings such as Opening hours stay inside Business Profile. Duplicate headings append to the same section. Cover material before the first heading is ignored. PDF line geometry is preserved; complex column layouts or scans may still require a cleaner text-based export. Limit: 20 MB, 100 pages, 200,000 extracted text characters for Gemini review.

## Gemini review

Selecting a PDF extracts text locally. The user explicitly selects Send to Gemini for review before text is sent through POST /api/review to Google. This starter does not persist the PDF or review. Free-tier Google data-use terms apply; check https://ai.google.dev/gemini-api/docs/pricing before sending business information.

The default model is `gemini-2.5-flash-lite`, configurable through server-only `GEMINI_MODEL`. Google lists a free tier, subject to eligibility, availability and quotas. Paid project settings can incur charges; this code cannot guarantee no billing.

The NLP prompt compares each heading-delimited section to a shared expected-content summary. Structured JSON returns section id, similarity score (0-100), explanatory feedback, and missing requirements. This is a model-assigned semantic suitability score, not cosine similarity, calibrated confidence, or real-world verification. There is no separate NLP service or code execution tool.

A section passes when its score is at least 80 AND the model lists no missing requirements. Missing/empty headings never pass. Malformed responses, timeouts, missing keys and quota errors fail closed. All five sections must pass and receive human confirmation before continuing. Edit PASS_SCORE in src/requirements.js to tune the threshold; validate it on representative good/incomplete packets before production use.

## Implementation

- src/requirements.js: headings, expected summaries, section parser and threshold.
- src/pdf.js: PDF.js text extraction preserving lines.
- server/review.js: prompt, response schema, validation and pass decision.
- server/index.js: same-origin local review API, request limits, timeout and basic throttling; dev and production frontend serving.
- src/main.js: review UI, explicit submission, scores, feedback, confirmation and JSON export.

Authentication and MCP server creation are not connected. The server binds to loopback for local development. Before public hosting, add authentication, per-user authorization/rate limits, proper proxy origin handling and transport security. The current global throttle is only a local starter safeguard. See docs/backend-contract.md for the broader integration plan.

## Troubleshooting: review returns a page instead of JSON

An error like `Unexpected token 'T', "The page c"... is not valid JSON` means POST /api/review received text or HTML from a web host, proxy or missing-route handler, rather than the Node review API. This is not a PDF similarity error. Serving only dist or using a frontend-only Vite server does not provide the Gemini API.

For local use, run npm run dev and open the address it prints. For production on a Node-capable host, run npm install, npm run build, then npm start. Set GEMINI_API_KEY as a server environment secret, PORT as required by the host, HOST=0.0.0.0 when the host needs an externally reachable listener, and REVIEW_ALLOWED_ORIGIN to the exact public website origin (for example https://your-site.example). GET /api/health should return JSON with status ok; it never returns the key.

If the frontend is on a static host, run the backend separately on a Node host. Set VITE_REVIEW_API_URL to the HTTPS backend origin before building the frontend, and REVIEW_ALLOWED_ORIGIN to the exact frontend origin on the backend. Rebuild and redeploy the frontend after changing VITE_REVIEW_API_URL. Configure the backend API key there; a local .env file does not configure a deployed service. Do not deploy this local starter publicly without the authentication and per-user controls described above.

Unknown API paths now return JSON 404 responses rather than the frontend HTML. The browser checks response content type, status and assessment shape, so host errors show an actionable message instead of a JSON parsing exception.
