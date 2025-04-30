// src/routes/entries.js
import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  listEntries,
  addEntryManually,
  updateEntry,
  deleteEntry,
  importEntries,
  exportEntries,
  getSalaryHistory,
  exportSalaryById,
  emailSalaryById
} from '../controllers/entriesController.js';

const router = express.Router();

// All /entries routes require a valid JWT and will be scoped to the user's organization
router.use(auth);

// GET    /entries                     → list all entries for this user's org
router.get('/', listEntries);

// POST   /entries                     → manually add a new entry
router.post('/', addEntryManually);

// PUT    /entries/:id                 → update an existing entry
router.put('/:id', updateEntry);

// DELETE /entries/:id                 → delete an entry
router.delete('/:id', deleteEntry);

// POST   /entries/import              → bulk import from Excel (file + company)
router.post('/import', upload.single('file'), importEntries);

// POST   /entries/export              → export selected columns & date to Excel
router.post('/export', exportEntries);

// GET    /entries/salary-history/:id  → get salary history for a given entry
router.get('/salary-history/:id', getSalaryHistory);

// GET    /entries/export/salary/:id   → download salary-history Excel for one entry
router.get('/export/salary/:id', exportSalaryById);

// POST   /entries/email/salary/:id    → email salary-history to the entry’s email
router.post('/email/salary/:id', emailSalaryById);

export default router;
