// src/middleware/auth.js

import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const auth = async (req, res, next) => {
  try {
    // 1. Grab token from Authorization header or x-access-token
    const header = req.headers.authorization || req.headers['x-access-token'];
    if (!header) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // 2. Handle Bearer <token> and raw tokens
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
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

    // 4. Look up user
    const lookup = payload.id ? { id: payload.id } : payload.email ? { email: payload.email } : null;
    if (!lookup) {
      return res.status(401).json({ message: 'Token payload missing user identifier' });
    }

    // 5. Fetch user data
    const user = await prisma.user.findUnique({
      where: lookup,
      select: {
        id: true,
        email: true,
        organizationId: true,
        organization: {
          select: { hasCompletedSetup: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // 6. Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      orgId: user.organizationId || null,
      hasCompletedSetup: user.organization?.hasCompletedSetup || false,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal authentication error' });
  }
};

export default auth;