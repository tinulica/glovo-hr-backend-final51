const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { sendMail } = require('../utils/emailService');
const prisma = new PrismaClient();
const router = express.Router();

// Admin creates invite link
router.post('/create', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const token = crypto.randomBytes(20).toString('hex');
  const invite = await prisma.inviteLink.create({
    data: {
      token,
      adminId: req.user.id,
      expiresAt: new Date(Date.now() + 7*24*3600*1000),
    }
  });
  const url = `${req.protocol}://${req.get('host')}/invite/accept/${token}`;
  await sendMail(req.body.email, 'You are invited to Glovo HR', `<p>Click to join: <a href="${url}">${url}</a></p>`);
  res.json({ link: url });
});

// Accept invite & register as Employee
router.post('/accept/:token', async (req, res) => {
  const { token } = req.params;
  const { email, password } = req.body;
  const invite = await prisma.inviteLink.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired invite' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: 'employee',
      ownerId: invite.adminId
    }
  });
  await prisma.inviteLink.delete({ where: { id: invite.id } });
  const jwtToken = jwt.sign(
    { id: user.id, role: user.role, ownerId: user.ownerId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token: jwtToken });
});

module.exports = router;
