// src/routes/dashboard.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to protect the route and extract user info
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // user = { id, email, etc. }
    next();
  });
}

// GET /dashboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      message: 'Dashboard data fetched successfully.',
      data: entries
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Something went wrong while fetching dashboard data.' });
  }
});

export default router;
