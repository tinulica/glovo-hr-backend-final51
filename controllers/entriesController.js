// controllers/entriesController.js
import prisma from "../lib/prisma.js";
import parseXLSX from "../utils/parseXLSX.js";
import generateExcelFromEntries from '../utils/generateExcel.js';
import gmailMailer from "../utils/gmailMailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

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

    const xlsx = await parseXLSX(file.path);
    const session = await prisma.importSession.create({
      data: {
        platform: company,
        file: {
          create: {
            name: file.originalname,
            url: "",
          }
        }
      }
    });

    let count = 0;

    for (const row of xlsx) {
      const fullName = row['Nume']?.trim();
      const email = row['Email']?.trim();
      const amount = parseFloat(row['Venituri'] || 0);
      const net = parseFloat(row['Total Venituri de transferat'] || 0);
      const tips = parseFloat(row['Tips'] || 0);
      const fee = parseFloat(row['Taxa aplicatie'] || 0);
      const adjustments = parseFloat(row['Ajustari Totale'] || 0);
      const userId = req.user.id;

      if (!fullName || !email) continue;

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
            userId,
            importSessionId: session.id
          }
        });
      }

      await prisma.salaryHistory.create({
        data: {
          entryId: entry.id,
          amount,
          net,
          tips,
          fee,
          adjustments,
          date: new Date(),
        }
      });

      count++;
    }

    res.json({ message: "Import completed", count });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Failed to import entries" });
  }
};

// Other controller functions remain unchanged...
