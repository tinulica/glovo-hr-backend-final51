// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export default async function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    // attach to request
    req.user = { id: user.id, orgId: user.organizationId };
    next();
  } catch (e) {
    console.error('Auth error', e);
    res.status(401).json({ message: 'Unauthorized' });
  }
}
