// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes         = require('./routes/auth');
const inviteRoutes       = require('./routes/invite');
const entryRoutes        = require('./routes/entries');
const collabRoutes       = require('./routes/collaborations');
const passwordRoutes     = require('./routes/password'); // if you have password reset
const app                = express();
const prisma             = new PrismaClient();

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,    // e.g. https://glovo-hr-frontend-final4.vercel.app
  'http://localhost:3000',     // local React dev
];
const corsOptions = {
  origin(origin, callback) {
    // allow requests with no origin (e.g. mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed for ' + origin));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // enable pre-flight

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Glovo HR Backend is running');
});

// Routes
app.use('/auth', authRoutes);
app.use('/invite', inviteRoutes);
app.use('/entries', entryRoutes);
app.use('/collaborations', collabRoutes);
app.use('/password', passwordRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(401).json({ message: err.message });
  }
  res.status(500).json({ message: 'Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
