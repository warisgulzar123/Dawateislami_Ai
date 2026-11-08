// Entry point proxy for Vercel configurations targeting backend/server.js
const app = require('../server');

module.exports = app;
module.exports.maxDuration = 60;
