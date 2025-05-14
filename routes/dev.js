// src/routes/dev.js
import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// DELETE /dev/reset - Delete all users and orgs and create a default admin
router.delete('/reset', async (req, res) => {
  try {
    // Delete everything (order matters due to relations)
    await prisma.resetToken.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.salaryHistory.deleteMany();
    await prisma.entry.deleteMany();
    await prisma.importSession.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    // Create admin
    const hashed = await bcrypt.hash('supersecurepassword', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: supersecurepassword,
        fullName: 'Admin User',
        hasCompletedSetup: true
      }
    });

    return res.json({ message: 'All data reset. Admin created.', admin });
  } catch (err) {
    console.error('Reset error:', err);
    return res.status(500).json({ message: 'Reset failed' });
  }
});

export default router;