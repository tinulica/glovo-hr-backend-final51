// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import entriesRoutes from './routes/entries.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import importRoutes from './routes/import.js';
import uploadsRoutes from './routes/uploads.js';
import dashboardRoutes from './routes/dashboard.js';
import inviteRoutes from './routes/invite.js';
import organizationsRoute from './routes/organizations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);           // /auth/login, /auth/register
app.use('/password', passwordRoutes);   // /password/forgot, /password/reset
app.use('/import', importRoutes);       // Excel import logic
app.use('/uploads', uploadsRoutes);     // File upload routes
app.use('/dashboard', dashboardRoutes); // Admin dashboard data
app.use('/entries', entriesRoutes);
app.use('/invite', inviteRoutes);
app.use('/api/organizations', organizationsRoute);

// Health check
app.get('/', (req, res) => {
  res.send('✅ Glovo HR Backend Running');
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
