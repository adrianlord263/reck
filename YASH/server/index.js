const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { validate, schemas } = require('./validate');
const { mapSimpleSearchToQuery, mapSimpleFareQuoteToQuery } = require('./mapper');
const pricing = require('./pricing');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
// Use Aviationstack as the data provider
const AVIATION_BASE = process.env.AVIATION_BASE_URL || 'https://api.aviationstack.com';
const AVIATION_API_KEY = process.env.TBO_API_KEY || process.env.AVIATION_API_KEY; // reuse provided key

if (!AVIATION_API_KEY) console.warn('Warning: AVIATION API key not set. Add it to .env before calling remote endpoints.');

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: !!TBO_API_KEY });
});

// Generic forwarder for known TBO endpoints
async function callAviation(path, params = {}) {
  if (!AVIATION_API_KEY) throw new Error('AVIATION API key not configured on server');
  const url = `${AVIATION_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  // Aviationstack uses access_key query parameter
  const fullParams = Object.assign({}, params, { access_key: AVIATION_API_KEY });
  const resp = await axios.get(url, { params: fullParams, headers });
  return resp.data;
}
// Basic rate limiter for API endpoints to avoid accidental abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

// Predefined endpoints (update paths according to TBO docs if needed)
// Accept friendly search payload and call Aviationstack /v1/flights
app.post('/api/search', async (req, res) => {
  try {
    await validate(schemas.searchSchema)(req, res, async () => {
      const query = mapSimpleSearchToQuery(req.body);
      // Aviationstack uses GET /v1/flights
      const data = await callAviation('/v1/flights', query);
      // Return raw aviationstack response for now
      res.json(data);
    });
  } catch (err) {
    console.error('search error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

// Aviationstack does not provide fares/pricing. We'll implement a lookup endpoint
// that fetches flight details (best-effort) and returns them as a "fareQuote" stub.
app.post('/api/fareQuote', async (req, res) => {
  try {
    // No strict validation here because fields vary; use mapper to build query
    const query = mapSimpleFareQuoteToQuery(req.body);
    const data = await callAviation('/v1/flights', query);
    // Return the first matching flight as a fareQuote-like response (no pricing)
    const first = (data && data.data && data.data.length) ? data.data[0] : null;
    if (!first) return res.status(404).json({ error: 'No matching flight details found' });
    const stub = {
      id: first.flight && first.flight.number ? `${first.flight.iata || ''}_${first.flight.number}` : first.flight.iata || first.flight.icao || null,
      airline: first.airline,
      departure: first.departure,
      arrival: first.arrival,
      flight: first.flight,
      note: 'This response contains flight details from Aviationstack. Aviationstack does not return fare/pricing information. For real fare quotes use a pricing/booking API (Amadeus/Travelport/Sabre/TBO).'
    };
    res.json({ fareQuote: stub, raw: first });
  } catch (err) {
    console.error('fareQuote error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

// Pricing endpoint scaffold
app.post('/api/price', async (req, res) => {
  try {
    const provider = req.body.provider || process.env.PRICING_PROVIDER || 'aviationstack';
    // Aviationstack doesn't provide pricing. Return an explanatory response.
    if (provider === 'aviationstack') {
      return res.status(501).json({
        error: 'Aviationstack does not provide pricing/fare quotes. Use a pricing/booking provider (Amadeus, Sabre, Travelport, or TBO).',
        note: 'Set "provider":"amadeus" (or another connector) and implement a provider connector in server/pricing.js to enable pricing.'
      });
    }

    // If other provider requested, attempt to call scaffold (will throw by default)
    const result = await pricing.priceSearch(provider, req.body);
    res.json(result);
  } catch (err) {
    console.error('price error', err.message || err);
    res.status(500).json({ error: err.message || err });
  }
});

// Booking endpoint scaffold
app.post('/api/book', async (req, res) => {
  try {
    const provider = req.body.provider || process.env.PRICING_PROVIDER || 'aviationstack';
    if (provider === 'aviationstack') {
      return res.status(501).json({
        error: 'Aviationstack does not support booking. Integrate a booking provider (Amadeus/TBO/Travelport).',
      });
    }

    const result = await pricing.book(provider, req.body);
    res.json(result);
  } catch (err) {
    console.error('book error', err.message || err);
    res.status(500).json({ error: err.message || err });
  }
});

app.post('/api/book', async (req, res) => {
  try {
    await validate(schemas.bookSchema)(req, res, async () => {
      const data = await callTbo('post', '/v1/flight/book', req.body);
      res.json(data);
    });
  } catch (err) {
    console.error('book error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

app.post('/api/pnrStatus', async (req, res) => {
  try {
    const data = await callTbo('post', '/v1/flight/pnrStatus', req.body);
    res.json(data);
  } catch (err) {
    console.error('pnrStatus error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

app.post('/api/cancel', async (req, res) => {
  try {
    const data = await callTbo('post', '/v1/flight/cancel', req.body);
    res.json(data);
  } catch (err) {
    console.error('cancel error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

// Flexible proxy (use carefully) - expects { path, method, body }
app.post('/api/proxy', async (req, res) => {
  try {
    const { path, method = 'post', body = {}, headers = {} } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });
    const data = await callTbo(method, path, body, headers);
    res.json(data);
  } catch (err) {
    console.error('proxy error', err.message || err);
    res.status(500).json({ error: err.response?.data || err.message || err });
  }
});

// apply rate limiter to API routes
app.use('/api', apiLimiter);

// Serve a minimal frontend from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => console.log(`TBO proxy server listening on http://localhost:${PORT}`));
