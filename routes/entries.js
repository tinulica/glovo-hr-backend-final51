// src/routes/entries.js
import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  listEntries,
  importEntries,
  addEntryManually,
  updateEntry,
  deleteEntry,
  exportEntries,
  getSalaryHistory,
  exportSalaryById,
  emailSalaryById
} from "../controllers/entriesController.js";

const router = express.Router();

// GET all entries
router.get("/", auth, listEntries);

// POST import file with smart update/insert
router.post("/import", auth, upload.single("file"), importEntries);

// POST manual entry
router.post("/", auth, addEntryManually);

// PUT update an entry
router.put("/:id", auth, updateEntry);

// DELETE an entry
router.delete("/:id", auth, deleteEntry);

// POST export Excel (optional date + selected columns)
router.post("/export", auth, exportEntries);

// GET salary history for a specific entry
router.get("/salary-history/:id", auth, getSalaryHistory);

// GET Excel file of salary history by entry
router.get("/export/salary/:id", auth, exportSalaryById);

// POST send Gmail email with salary doc
router.post("/email/salary/:id", auth, emailSalaryById);

export default router;
