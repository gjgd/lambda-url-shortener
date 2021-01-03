const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();

// Handle json
app.use(express.json());

// Serve app
app.use('/', express.static(path.join(__dirname, '/public')));

// Register routes
app.use('/', routes);

// Error handling
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).send(err.message);
});

module.exports = app;
