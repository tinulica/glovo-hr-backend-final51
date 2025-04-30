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

// All routes use authMiddleware to extract user + orgId

router.get("/entries", authMiddleware, listEntries);

router.post("/entries", authMiddleware, addEntryManually);

router.put("/entries/:id", authMiddleware, updateEntry);

router.delete("/entries/:id", authMiddleware, deleteEntry);

router.post("/entries/import", authMiddleware, upload.single("file"), importEntries);

router.post("/entries/export", authMiddleware, exportEntries);

router.get("/entries/salary-history/:id", authMiddleware, getSalaryHistory);

router.get("/entries/export/:id", authMiddleware, exportSalaryById);

router.get("/entries/email/:id", authMiddleware, emailSalaryById);

export default router;
