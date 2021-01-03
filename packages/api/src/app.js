const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const publicDir = path.join(__dirname, '/public');

// Handle json
app.use(express.json());

// Serve app
app.use(express.static(publicDir));

// Register routes
app.use('/', routes);

app.get('/*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).send(err.message);
});

module.exports = app;
