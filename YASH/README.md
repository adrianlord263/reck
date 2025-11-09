# TBO Proxy (example)

This small project is an Express-based backend proxy to call the TBO (Travel Boutique Online) API from a safe server-side location.

Files created:
- `server/index.js` - Express server with endpoints: `/api/search`, `/api/fareQuote`, `/api/book`, `/api/pnrStatus`, `/api/cancel`, `/api/proxy`
- `package.json` - minimal dependencies and scripts
- `.env.example` - example env vars

Setup
1. Copy `.env.example` to `.env` and add your TBO API key and base URL.
2. Install dependencies:

```powershell
cd "c:\Users\manoj kumar gupta\YASH"
npm install
```

3. Start server:

```powershell
npm start
```

Notes
- Update the endpoint paths in `server/index.js` to match the exact routes from your TBO account/docs (paths like `/v1/flight/search` are placeholders and may differ).
- Never expose `TBO_API_KEY` in the frontend. Use these server endpoints instead.
- After providing your API key, you can call `/api/search` with the payload expected by TBO.

Quick local test

1) Install deps and start the server (open a PowerShell in the project folder):

```powershell
npm install
npm start
```

2) In another PowerShell window, run the local health test:

```powershell
npm run test-local
```

You should see a JSON response like:

```json
{ "ok": true, "hasKey": true }
```

If `hasKey` is false, copy your API key into `.env`.

Next steps (I can do for you):
- Wire real TBO endpoint paths after you share TBO docs or confirm endpoints.
- Add input validation and rate limiting.
- Add unit tests and a simple React UI to call the proxy endpoints.

Pricing & booking note
----------------------
This project currently uses Aviationstack for flight data (schedules and real-time flights). Aviationstack does NOT provide fares/pricing or booking capabilities. For real fare quotes and booking you must integrate a pricing/booking provider such as Amadeus, Travelport, Sabre, or TBO.

What I added to help you move forward:
- `server/pricing.js` — scaffold file where provider connectors should be implemented (functions: `priceSearch`, `book`).
- `/api/price` and `/api/book` endpoints — these currently return HTTP 501 when called with `provider: "aviationstack"` and include an explanatory message.
- `test/price_flow.js` — simple script demonstrating the 501 responses and what to expect.

How to integrate a pricing provider (brief):
1. Choose a provider (e.g., Amadeus Self-Service). Create an account and get API credentials.
2. Implement the connector inside `server/pricing.js`. Use env vars for credentials (don't commit them).
3. Update `.env` with provider credentials and set `PRICING_PROVIDER=amadeus` (or pass `provider` in the request body).
4. The `/api/price` endpoint will call your connector and return pricing results. The `/api/book` endpoint should call the provider's booking API.

If you want, I can implement an Amadeus pricing scaffold next (I will need the Amadeus client_id/client_secret or you can run the tests locally and paste results). I can also generate a Postman collection for the end-to-end flow.

Aviationstack flights endpoint
--------------------------------
The server uses Aviationstack's flights endpoint for search: https://api.aviationstack.com/v1/flights
Common query parameters you can use (the mapper translates friendly fields to these):
- dep_iata (origin IATA code)
- arr_iata (destination IATA code)
- flight_date (YYYY-MM-DD)
- flight_iata (flight code like AI123)
- limit, offset

Refer to https://api.aviationstack.com/v1/flights for full parameter details.
