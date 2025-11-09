const axios = require('axios');

async function run() {
  try {
    console.log('Calling /api/price (provider=aviationstack) - expect 501 and explanatory message');
    const r = await axios.post('http://localhost:3001/api/price', { provider: 'aviationstack' }, { timeout: 5000 });
    console.log('price response:', r.data);
  } catch (err) {
    console.error('price flow error:', err.response?.data || err.message || err);
  }

  try {
    console.log('\nCalling /api/book (provider=aviationstack) - expect 501');
    const r2 = await axios.post('http://localhost:3001/api/book', { provider: 'aviationstack' }, { timeout: 5000 });
    console.log('book response:', r2.data);
  } catch (err) {
    console.error('book flow error:', err.response?.data || err.message || err);
  }

  process.exit(0);
}

run();
