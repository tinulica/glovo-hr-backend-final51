import prisma from "../lib/prisma.js";
import parseXLSX from "../utils/parseXLSX.js";
import generateExcel from "../utils/generateExcel.js";
import gmailMailer from "../utils/gmailMailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GET /entries
export const listEntries = async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({ include: { salaryHistories: true } });
    res.json(entries);
  } catch (error) {
    console.error("List entries error:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
};

// POST /entries (manual entry)
export const addEntryManually = async (req, res) => {
  try {
    const { fullName, email, platform, externalId, companyName } = req.body;
    const userId = req.user?.id || null;

    const newEntry = await prisma.entry.create({
      data: {
        fullName,
        email,
        platform,
        externalId,
        companyName,
        userId
      }
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Manual entry error:", error);
    res.status(500).json({ message: "Failed to create entry manually." });
  }
};

// PUT /entries/:id
export const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.entry.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ message: "Failed to update entry." });
  }
};

// DELETE /entries/:id
export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.entry.delete({ where: { id } });
    res.json({ message: "Entry deleted." });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ message: "Failed to delete entry." });
  }
};

// Other routes (import, export, email, etc.) remain unchanged...
