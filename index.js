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

// index.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/password', passwordRoutes);
app.use('/import', importRoutes);
app.use('/uploads', uploadsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/entries', entriesRoutes);
app.use('/invite', inviteRoutes);
app.use('/api/organizations', organizationsRoute);

// Health check
app.get('/', (req, res) => {
  res.send('✅ Glovo HR Backend Running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});