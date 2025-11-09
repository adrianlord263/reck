const axios = require('axios');
const fs = require('fs');

async function run() {
  try {
    const searchPayload = JSON.parse(fs.readFileSync(__dirname + '/payloads/search.json', 'utf8'));
    console.log('Calling /api/search with payload:', searchPayload);
    const searchResp = await axios.post('http://localhost:3001/api/search', searchPayload, { timeout: 15000 });
    console.log('Search raw response:');
    console.log(JSON.stringify(searchResp.data, null, 2));

    // Try to extract a usable flight from the aviationstack response
    const flights = searchResp.data && searchResp.data.data ? searchResp.data.data : [];
    if (!flights.length) {
      console.error('No flights returned from /api/search');
      process.exit(3);
    }

    const first = flights[0];
    // Build a simple fareQuote payload using available details
    const farePayload = {
      flight_number: first.flight && first.flight.iata ? first.flight.iata : (first.flight && first.flight.number ? first.flight.number : undefined),
      departureDate: (first.departure && first.departure.scheduled) ? first.departure.scheduled.split('T')[0] : searchPayload.departureDate,
      origin: (first.departure && (first.departure.iata || first.departure.iata_code || first.departure.iata)) ? (first.departure.iata || first.departure.iata_code) : searchPayload.origin,
      destination: (first.arrival && (first.arrival.iata || first.arrival.iata_code)) ? (first.arrival.iata || first.arrival.iata_code) : searchPayload.destination,
      limit: 1
    };

    console.log('\nCalling /api/fareQuote with payload:', farePayload);
    const fareResp = await axios.post('http://localhost:3001/api/fareQuote', farePayload, { timeout: 15000 });
    console.log('FareQuote response:');
    console.log(JSON.stringify(fareResp.data, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Test flow error:', err.response?.data || err.message || err);
    process.exit(2);
  }
}

run();
