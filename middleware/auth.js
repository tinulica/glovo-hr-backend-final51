import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export default async function auth(req, res, next) {
  try {
    // 1. Grab token from either header
    const header = req.headers.authorization || req.headers['x-access-token'];
    if (!header) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // 2. Allow both “Bearer <token>” and raw tokens
    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : header.trim();

    if (!token) {
      return res.status(401).json({ message: 'Empty authentication token' });
    }

    // 3. Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // 4. Payload must contain at least user id or email
    const userLookup = {};
    if (payload.id) {
      userLookup.id = payload.id;
    } else if (payload.email) {
      userLookup.email = payload.email;
    } else {
      return res.status(401).json({ message: 'Token payload missing user identifier' });
    }

    // 5. Fetch user to rehydrate orgId & guard against deleted accounts
    const user = await prisma.user.findUnique({
      where: userLookup,
      select: { id: true, email: true, organizationId: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // 6. Attach to req for all downstream routes
    req.user = {
      id: user.id,
      email: user.email,
      orgId: user.organizationId
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal auth error' });
  }
}
