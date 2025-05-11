import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export default async function auth(req, res, next) {
  try {
    // 1. Grab token from either Authorization header or x-access-token
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

    // 4. Determine how to look up the user
    const lookup = {};
    if (payload.id) {
      lookup.id = payload.id;
    } else if (payload.email) {
      lookup.email = payload.email;
    } else {
      return res.status(401).json({ message: 'Token payload missing user identifier' });
    }

    // 5. Fetch user to confirm validity and fetch latest org info
    const user = await prisma.user.findUnique({
      where: lookup,
      select: {
        id: true,
        email: true,
        organizationId: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // 6. If detached user is visiting another org's entry, we allow orgId to be optional
    req.user = {
      id: user.id,
      email: user.email,
      orgId: user.organizationId || null, // May be null for external collaborators
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Internal authentication error' });
  }
}
