// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes     = require('./routes/auth');
const inviteRoutes   = require('./routes/invite');
const entryRoutes    = require('./routes/entries');
const passwordRoutes = require('./routes/password');

const app    = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/', (req, res) => {
  res.send('Glovo HR Backend is running');
});

// Mount routers
app.use('/auth', authRoutes);
app.use('/invite', inviteRoutes);
app.use('/entries', entryRoutes);
app.use('/password', passwordRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
