// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export default async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch fresh user data from DB
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        hasCompletedSetup: true,
        organizationId: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      hasCompletedSetup: user.hasCompletedSetup,
      orgId: user.organizationId,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('❌ Auth error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}