// routes/password.js
const express = require('express');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { sendMail } = require('../utils/emailService');
const router  = express.Router();
const prisma  = new PrismaClient();

// 1. Request password reset
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // avoid revealing whether email exists
    return res.json({ message: 'If that email is in our system, you’ll receive a reset link shortly.' });
  }
  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
  await prisma.resetToken.create({
    data: { token, userId: user.id, expiresAt }
  });
  const resetUrl = `${req.protocol}://${req.get('host')}/reset/${token}`;
  await sendMail(
    email,
    'Password Reset Request',
    `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
  );
  res.json({ message: 'If that email is in our system, you’ll receive a reset link shortly.' });
});

// 2. Reset password
router.post('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const record = await prisma.resetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashed }
  });
  await prisma.resetToken.deleteMany({ where: { userId: record.userId }});
  res.json({ message: 'Password has been reset. You can now log in.' });
});

module.exports = router;
