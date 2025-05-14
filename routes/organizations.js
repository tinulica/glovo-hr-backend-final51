// src/routes/organization.js
import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET current org info
router.get('/info', auth, async (req, res) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user.orgId },
    select: { id: true, name: true, bio: true }
  });

  if (!org) return res.status(404).json({ message: 'Organization not found' });
  res.json({ organization: org });
});

// PUT update org info
router.put('/', auth, async (req, res) => {
  const { name, bio } = req.body;

  const updated = await prisma.organization.update({
    where: { id: req.user.orgId },
    data: { name, bio }
  });

  res.json({ success: true, organization: updated });
});

export default router;