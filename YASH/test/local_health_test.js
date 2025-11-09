const axios = require('axios');

async function healthCheck() {
  try {
    const r = await axios.get('http://localhost:3001/api/health', { timeout: 3000 });
    console.log('health:', r.data);
    process.exit(0);
  } catch (err) {
    console.error('health check failed:', err.message);
    process.exit(2);
  }
}

healthCheck();
