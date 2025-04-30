// File: routes/entries.js (Backend API Route - Updated)

const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');

// GET all entries
router.get('/', async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      include: { salaries: true }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload Excel + update/insert
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const updated = [];
    const created = [];

    for (const row of rows) {
      const existing = await prisma.entry.findUnique({ where: { email: row.email } });
      if (existing) {
        await prisma.salary.create({
          data: {
            amount: row.salary,
            date: new Date(row.date),
            entryId: existing.id
          }
        });
        updated.push(row.fullName);
      } else {
        const newEntry = await prisma.entry.create({
          data: {
            fullName: row.fullName,
            email: row.email,
            platform: row.platform,
            salaries: {
              create: [{ amount: row.salary, date: new Date(row.date) }]
            }
          }
        });
        created.push(newEntry.fullName);
      }
    }

    fs.unlinkSync(req.file.path);
    res.json({ updated, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export all entries + salary to Excel
router.get('/export', async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      include: { salaries: true }
    });

    const data = [];
    entries.forEach(entry => {
      entry.salaries.forEach(salary => {
        data.push({
          FullName: entry.fullName,
          Email: entry.email,
          Platform: entry.platform,
          Salary: salary.amount,
          Date: salary.date.toISOString().split('T')[0]
        });
      });
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Salaries');
    const filename = 'salaries_export.xlsx';
    xlsx.writeFile(workbook, filename);

    res.download(filename, () => fs.unlinkSync(filename));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send email with attachment
router.post('/email', upload.single('file'), async (req, res) => {
  try {
    const { to, subject } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text: 'Attached is your requested salary export.',
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    });

    fs.unlinkSync(req.file.path);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
