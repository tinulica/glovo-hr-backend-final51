// src/routes/invite.js
import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';    // <- add the “.js” here
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /invite — send an invitation to join your organization
router.post('/', auth, async (req, res) => {
  try {
    const { email } = req.body;
    // generate a one-time invite token
    const token = uuidv4();
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        inviterId: req.user.id,
        organizationId: req.user.orgId,
      },
    });
    // TODO: send email containing `${process.env.FRONTEND_URL}/accept-invite?token=${token}`
    res.status(201).json({ message: 'Invitation created', invitation });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ message: 'Failed to create invitation' });
  }
});

export default router;
