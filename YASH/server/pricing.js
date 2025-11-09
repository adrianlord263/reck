/**
 * Pricing/Booking scaffold
 *
 * Aviationstack is a flight data API (flight status/schedules) and does NOT
 * provide pricing or booking functionality. This module provides a scaffold
 * for integrating a real pricing/booking provider (Amadeus, TBO, Travelport,
 * Sabre, etc.).
 *
 * To implement: add provider connectors that implement `priceSearch` and
 * `book` using the provider's APIs and credentials from environment variables.
 */

async function priceSearch(provider, payload) {
  // provider: string like 'amadeus'|'tbo'|'travelport'
  // payload: friendly search payload
  // Return a promise that resolves with pricing results from the provider
  throw new Error('Not implemented: priceSearch. Aviationstack does not support pricing. Integrate a pricing provider like Amadeus or TBO.');
}

async function book(provider, payload) {
  // payload: booking payload (passengers, selected fares, payment info)
  throw new Error('Not implemented: book. This is a scaffold only.');
}

module.exports = { priceSearch, book };
