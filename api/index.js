// Serverless entrypoint proxy for Vercel
const app = require('../server');

module.exports = app;
module.exports.maxDuration = 60;
