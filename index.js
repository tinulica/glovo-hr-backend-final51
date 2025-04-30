// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load env variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import loginRoutes from './routes/login.js';
import uploadsRoutes from './routes/uploads.js';
import dashboardRoutes from './routes/dashboard.js';
import importRoutes from './routes/import.js';
import reportRoutes from './routes/report.js';
import salaryRoutes from './routes/salary.js';
import usersRoutes from './routes/users.js';

app.use('/api/login', loginRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/import', importRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Glovo HR Manager API is running ✅');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
