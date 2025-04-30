// controllers/entriesController.js
import prisma from "../lib/prisma.js";
import parseXLSX from "../utils/parseXLSX.js";
import { generateExcel } from '../utils/generateExcel.js';
import gmailMailer from "../utils/gmailMailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Fixes __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GET /entries
export const listEntries = async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      include: { salaryHistories: true }
    });
    res.json(entries);
  } catch (error) {
    console.error("List entries error:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
};

// POST /entries (manual entry)
export const addEntryManually = async (req, res) => {
  try {
    const { fullName, email, platform } = req.body;
    const userId = req.user.id;

    const newEntry = await prisma.entry.create({
      data: {
        fullName,
        email,
        platform,
        userId
      }
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Manual entry error:", error);
    res.status(500).json({ message: "Failed to create entry manually." });
  }
};

// POST /entries/import
export const importEntries = async (req, res) => {
  try {
    const file = req.file;
    const company = req.body.company;

    if (!file || !company) {
      return res.status(400).json({ message: "Missing file or company" });
    }

    const rows = await parseXLSX(file.path);

    const session = await prisma.importSession.create({
      data: {
        platform: company,
        file: {
          create: {
            name: file.originalname,
            url: "", // Optional: could upload to S3 or static folder
          }
        }
      }
    });

    for (const row of rows) {
      const { fullName, email, amount, date, hours, net } = row;
      let entry = await prisma.entry.findFirst({
        where: {
          fullName,
          email,
          platform: company
        }
      });

      if (!entry) {
        entry = await prisma.entry.create({
          data: {
            fullName,
            email,
            platform: company,
            userId: req.user.id,
            importSessionId: session.id
          }
        });
      }

      await prisma.salaryHistory.create({
        data: {
          entryId: entry.id,
          amount: parseFloat(amount),
          date: new Date(date),
          hours: parseInt(hours),
          net: parseFloat(net)
        }
      });
    }

    res.json({ message: "Import completed", count: rows.length });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Failed to import entries" });
  }
};

// POST /entries/export
export const exportEntries = async (req, res) => {
  try {
    const { columns = [], date } = req.body;

    let entries = await prisma.entry.findMany({
      include: {
        salaryHistories: true
      }
    });

    if (date) {
      const target = new Date(date);
      entries = entries.map(e => ({
        ...e,
        salaryHistories: e.salaryHistories.filter(s => {
          const d = new Date(s.date);
          return d.toISOString().slice(0, 10) === target.toISOString().slice(0, 10);
        })
      }));
    }

    const filePath = await generateExcel(entries, columns);
    res.download(filePath, "entries.xlsx", () => {
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Failed to export entries" });
  }
};

// GET /salary-history/:id
export const getSalaryHistory = async (req, res) => {
  try {
    const history = await prisma.salaryHistory.findMany({
      where: { entryId: req.params.id },
      orderBy: { date: "desc" }
    });
    res.json(history);
  } catch (error) {
    console.error("Salary history error:", error);
    res.status(500).json({ message: "Failed to fetch salary history" });
  }
};

// GET /export/salary/:id
export const exportSalaryById = async (req, res) => {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: req.params.id },
      include: { salaryHistories: true }
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const filePath = await generateExcel([entry], ["fullName", "email", "platform"]);
    res.download(filePath, "salary-history.xlsx", () => {
      fs.unlink(filePath, () => {});
    });
  } catch (error) {
    console.error("Export salary history error:", error);
    res.status(500).json({ message: "Failed to export salary history" });
  }
};

// POST /email/salary/:id
export const emailSalaryById = async (req, res) => {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: req.params.id },
      include: { salaryHistories: true }
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const filePath = await generateExcel([entry], ["fullName", "email", "platform"]);

    await gmailMailer({
      to: entry.email,
      subject: "Your Salary History",
      text: "Attached is your salary history.",
      attachments: [
        {
          filename: "salary-history.xlsx",
          path: filePath
        }
      ]
    });

    fs.unlink(filePath, () => {});
    res.json({ message: "Email sent" });
  } catch (error) {
    console.error("Email salary history error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};
