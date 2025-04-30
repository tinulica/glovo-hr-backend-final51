// src/routes/invite.js
import express from 'express';
import crypto from 'crypto';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import gmailMailer from '../utils/gmailMailer.js';

const router = express.Router();

// POST /invite  — inviter sends an invite to an email
router.post('/', auth, async (req, res) => {
  const { email } = req.body;
  const inviterId = req.user.id;
  try {
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const invite = await prisma.invitation.create({
      data: {
        email,
        token,
        inviterId,
        organizationId: req.user.orgId,
        expiresAt
      }
    });

    // send email
    const link = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    await gmailMailer({
      to: email,
      subject: 'You’re invited!',
      text: `Join our team: ${link}`
    });

    res.json({ message: 'Invitation sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Invite failed' });
  }
});

// POST /invite/accept  — new user accepts and signs up
router.post('/accept', async (req, res) => {
  const { token, password, fullName } = req.body;
  try {
    const invite = await prisma.invitation.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite invalid/expired' });
    }
    // create user under that org
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        password: hashed,
        fullName,
        organization: { connect: { id: invite.organizationId } }
      }
    });
    // mark accepted
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { accepted: true, inviteeId: user.id }
    });
    // issue token
    const jwtToken = jwt.sign(
      { userId: user.id, orgId: invite.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user, token: jwtToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Accept failed' });
  }
});

export default router;
