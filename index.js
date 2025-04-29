// index.js

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes   = require('./routes/auth');
const inviteRoutes = require('./routes/invite');
const entryRoutes  = require('./routes/entries');

const app = express();
const prisma = new PrismaClient();

// --- CORS Setup ---
// For production: whitelist only your origins
const allowedOrigins = [
  'http://localhost:3000',                             // React dev
  'https://glovo-hr-frontend-final4.vercel.app'        // Vercel frontend
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for ${origin}`));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

app.use(express.json());

// --- Health Check ---
app.get('/', (req, res) => {
  res.send('Glovo HR Backend is running');
});

// --- Mount Routes ---
app.use('/auth',   authRoutes);
app.use('/invite', inviteRoutes);
app.use('/entries',entryRoutes);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.message.startsWith('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'Server Error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
