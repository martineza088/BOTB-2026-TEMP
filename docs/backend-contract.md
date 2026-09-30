# Proposed backend integration

These routes are a suggested contract, not implemented endpoints.

| Route | Purpose |
| --- | --- |
| GET /api/session | Return the signed-in user or 401 |
| POST /api/packets | Accept a PDF and return a packet ID |
| GET /api/packets/:id | Return processing state and category evidence |
| PATCH /api/packets/:id | Save corrected structured business fields and confirmations |
| POST /api/servers | Create an MCP server from an approved packet |
| POST /api/servers/:id/test | Test the authenticated server connection |

All operations must authorize ownership on the backend. Server creation should be idempotent. Long-running processing should return pending/processing/ready/failed states. Store source page references with extracted facts. Keep document contents as untrusted data, never instructions for tools or provisioning. Inventory and pricing need timestamps and an update mechanism.

The MCP product, identity provider, storage service, and server hosting remain decisions to make before implementing these routes. The website's setup API is separate from the MCP protocol endpoint used by client applications.
