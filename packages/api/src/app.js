const express = require('express');
const routes = require('./routes');

const app = express();

// Handle json
app.use(express.json());

// Register routes
app.use('/', routes);

// Error handling
app.use((err, req, res) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).send(err.message);
});

module.exports = app;
