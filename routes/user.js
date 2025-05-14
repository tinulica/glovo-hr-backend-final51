// routes/user.js
import express from 'express';
import prisma from '../lib/prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.put('/display-org-name', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Missing name' });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { displayOrgName: name }
  });

  res.json({ success: true, name: user.displayOrgName });
});

router.get('/display-org-name', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { displayOrgName: true }
  });

  res.json({ displayOrgName: user?.displayOrgName || '' });
});

export default router;
