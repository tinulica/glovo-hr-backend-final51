// src/routes/import.js
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// POST /import
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Example import logic
    for (const row of data) {
      await prisma.entry.create({
        data: {
          fullName: row.fullName || '',
          email: row.email || '',
          platform: row.platform || '',
          userId: row.userId || '',
        },
      });
    }

    res.json({ message: 'Import completed successfully', count: data.length });
  } catch (err) {
    console.error('Import failed:', err);
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;
