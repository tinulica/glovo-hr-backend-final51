import express from "express";
import {
  listEntries,
  addEntryManually,
  updateEntry,
  deleteEntry,
  importEntries,
  exportEntries,
  getSalaryHistory,
  exportSalaryById,
  emailSalaryById,
} from "../controllers/entriesController.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// ✅ Scoped GET /entries route
router.get("/entries", authMiddleware, listEntries);

// ... other routes unchanged

export default router;
