// routes/entries.ts
import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/authenticate';

const router = express.Router();

router.get('/entries', authenticateJWT, async (req, res) => {
  const { organizationId } = req.user;

  try {
    const entries = await prisma.entry.findMany({
      where: { organizationId },
      include: { createdBy: { select: { email: true } } },
    });
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

router.post('/entries', authenticateJWT, async (req, res) => {
  const { name, amount, date } = req.body;
  const { organizationId, userId } = req.user;

  try {
    const entry = await prisma.entry.create({
      data: {
        name,
        amount,
        date: new Date(date),
        createdById: userId,
        organizationId,
      },
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

export default router;
