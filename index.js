// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadsRouter from './routes/uploads.js';
// Add more route imports as needed

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mount your routes
app.use('/uploads', uploadsRouter);

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Glovo HR Backend is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
