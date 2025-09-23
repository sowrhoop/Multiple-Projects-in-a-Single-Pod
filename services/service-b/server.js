const path = require('path');
const express = require('express');
const app = express();

// Default ports: align with supervisor (9090)
const PORT = parseInt(process.env.PORT || '9090', 10);

// Where to reach service-a. In docker-compose, this should be http://service-a:8080
const SERVICE_A_URL = process.env.SERVICE_A_URL || 'http://127.0.0.1:8080';

// Serve static assets from ./public
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Health/Status endpoint (JSON)
app.get('/api/status', async (_req, res) => {
  try {
    const r = await fetch(`${SERVICE_A_URL}/`);
    const a = await r.json();
    res.json({ service: 'b', status: 'ok', serviceA: a });
  } catch (err) {
    res.status(502).json({ service: 'b', status: 'degraded', error: String(err) });
  }
});

// Simple proxy to service-a
app.get('/api/a', async (_req, res) => {
  try {
    const r = await fetch(`${SERVICE_A_URL}/`);
    const data = await r.text();
    res.set('content-type', r.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach service-a', detail: String(err) });
  }
});

// Root: serve the UI
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Service B listening on ${PORT}`);
  console.log(`Using SERVICE_A_URL=${SERVICE_A_URL}`);
});
