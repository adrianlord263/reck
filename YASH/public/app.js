async function apiPost(path, body){
  try{
    const r = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    const json = await r.json();
    return { ok: r.ok, status: r.status, data: json };
  }catch(e){
    return { ok:false, error: e.message };
  }
}

document.getElementById('searchBtn').addEventListener('click', async ()=>{
  const origin = document.getElementById('origin').value.trim();
  const destination = document.getElementById('destination').value.trim();
  const departureDate = document.getElementById('departureDate').value.trim();
  const limit = Number(document.getElementById('limit').value) || 5;
  const payload = { origin, destination, departureDate, limit };
  document.getElementById('searchResult').textContent = 'Searching...';
  const r = await apiPost('/api/search', payload);
  if (r.ok) document.getElementById('searchResult').textContent = JSON.stringify(r.data, null, 2);
  else document.getElementById('searchResult').textContent = `Error (${r.status}): ${JSON.stringify(r.data || r.error)}`;
});

// Fare button: will attempt to use last search's first flight, otherwise do a lookup
let lastSearchData = null;

// Update lastSearchData when search runs
(function patchFetchForLast(){
  const original = window.fetch;
  window.fetch = async function(input, init){
    const res = await original(input, init);
    try{
      if (typeof input === 'string' && input.endsWith('/api/search')){
        const cloned = res.clone();
        const json = await cloned.json();
        lastSearchData = json;
      }
    }catch(e){}
    return res;
  }
})();

document.getElementById('fareBtn').addEventListener('click', async ()=>{
  // If we have lastSearchData, pick the first flight details
  let payload = {};
  if (lastSearchData && lastSearchData.data && lastSearchData.data.length){
    const f = lastSearchData.data[0];
    payload.flight_number = f.flight && (f.flight.iata || f.flight.number) ? (f.flight.iata || f.flight.number) : undefined;
    payload.departureDate = f.departure && f.departure.scheduled ? f.departure.scheduled.split('T')[0] : document.getElementById('departureDate').value;
    payload.origin = f.departure && (f.departure.iata || f.departure.iata_code) ? (f.departure.iata || f.departure.iata_code) : document.getElementById('origin').value;
    payload.destination = f.arrival && (f.arrival.iata || f.arrival.iata_code) ? (f.arrival.iata || f.arrival.iata_code) : document.getElementById('destination').value;
    payload.limit = 1;
  } else {
    payload = { origin: document.getElementById('origin').value, destination: document.getElementById('destination').value, departureDate: document.getElementById('departureDate').value, limit:1 };
  }
  document.getElementById('fareResult').textContent = 'Loading...';
  const r = await apiPost('/api/fareQuote', payload);
  if (r.ok) document.getElementById('fareResult').textContent = JSON.stringify(r.data, null, 2);
  else document.getElementById('fareResult').textContent = `Error (${r.status}): ${JSON.stringify(r.data || r.error)}`;
});
