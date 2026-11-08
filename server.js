const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const connectDB = require('./config/db');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Dawat-e-Islami AI Assistant & Knowledge Base API',
    version: '1.2.0',
    endpoints: {
      chat: 'POST /api/chat',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/me'
      },
      knowledgeCrud: {
        list: 'GET /api/knowledge',
        create: 'POST /api/knowledge',
        update: 'PUT /api/knowledge/:id',
        delete: 'DELETE /api/knowledge/:id'
      }
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api', chatRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// Start Express Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Dawat-e-Islami AI & Admin Backend on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth API:     http://localhost:${PORT}/api/auth/login`);
    console.log(`📚 Knowledge:    http://localhost:${PORT}/api/knowledge`);
    console.log(`💬 Chat API:     http://localhost:${PORT}/api/chat`);
    console.log(`====================================================`);
  });
}

module.exports = app;
