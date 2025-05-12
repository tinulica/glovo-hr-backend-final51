// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export async function auth(req, res, next) {
  try {
    // 0. Check JWT secret exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET in environment");
      return res.status(500).json({ message: 'Server misconfigured' });
    }

    // 1. Read Authorization header
    const header = req.headers.authorization || req.headers['x-access-token'];
    if (!header) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : header.trim();

    if (!token) {
      return res.status(401).json({ message: 'Empty authentication token' });
    }

    // 2. Decode and verify token
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // 3. Find user by id or email
    const lookup = payload.id ? { id: payload.id } : payload.email ? { email: payload.email } : null;
    if (!lookup) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await prisma.user.findUnique({
      where: lookup,
      select: {
        id: true,
        email: true,
        organizationId: true,
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }

    // 4. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      orgId: user.organizationId || null
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal authentication error' });
  }
}