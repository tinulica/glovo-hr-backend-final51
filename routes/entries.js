// src/routes/entries.js

import express from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import {
  listEntries,
  addEntryManually,
  importEntries,
  exportEntries,
  getSalaryHistory,
  exportSalaryById,
  emailSalaryById,
  updateEntry,
  deleteEntry,
} from "../controllers/entriesController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });


::contentReference[oaicite:8]{index=8}
 
