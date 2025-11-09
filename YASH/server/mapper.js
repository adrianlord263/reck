// Simple mapper to convert friendly payloads into Aviationstack query params

function mapSimpleSearchToQuery(simple) {
  const q = {};
  if (simple.origin) q.dep_iata = simple.origin;
  if (simple.destination) q.arr_iata = simple.destination;
  if (simple.departureDate) q.flight_date = simple.departureDate;
  if (simple.limit) q.limit = simple.limit;
  // cabinClass, passengers, returnDate are not used by Aviationstack (data API)
  return q;
}

function mapSimpleFareQuoteToQuery(simple) {
  // We'll try to look up by flight number + date or by flight id if provided
  const q = {};
  if (simple.flight_number) q.flight_iata = simple.flight_number;
  if (simple.departureDate) q.flight_date = simple.departureDate;
  if (simple.origin) q.dep_iata = simple.origin;
  if (simple.destination) q.arr_iata = simple.destination;
  if (simple.limit) q.limit = simple.limit || 1;
  return q;
}

module.exports = { mapSimpleSearchToQuery, mapSimpleFareQuoteToQuery };
