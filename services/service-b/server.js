const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.json({ service: 'b', status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Service B listening on ${PORT}`);
});

