// src/controllers/entriesController.js

import prisma from "../lib/prisma.js";
import parseXLSX from "../utils/parseXLSX.js";
import generateExcelFromEntries from "../utils/generateExcel.js";
import gmailMailer from "../utils/gmailMailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * List all entries for the current organization
 */
export const listEntries = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const entries = await prisma.entry.findMany({
      where: { organizationId: orgId },
      include: { salaryHistories: true },
    });
    res.json(entries);
  } catch (error) {
    console.error("List entries error:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
};

/**
 * Manually add one entry under your org
 */
export const addEntryManually = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const createdBy = req.user.id;
    const {
      fullName,
      email,
      platform,
      externalId,
      companyName,
      iban,
      bankName,
      beneficiary,
    } = req.body;

    const newEntry = await prisma.entry.create({
      data: {
        organizationId: orgId,
        createdById: createdBy,
        fullName,
        email,
        platform,
        externalId,
        companyName,
        iban,
        bankName,
        beneficiary,
      },
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Manual entry error:", error);
    res.status(500).json({ message: "Failed to create entry manually." });
  }
};

/**
 * Update one entry (only if it belongs to your org)
 */
export const updateEntry = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;
    // ensure the entry exists in your org
    const existing = await prisma.entry.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Entry not found" });
    }

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

/**
 * Delete one entry (only if it belongs to your org)
 */
export const deleteEntry = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;
    // verify ownership
    const existing = await prisma.entry.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Entry not found" });
    }

    await prisma.entry.delete({ where: { id } });
    res.json({ message: "Entry deleted." });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ message: "Failed to delete entry." });
  }
};

/**
 * Import many from Excel; update existing or create new under your org
 */
export const importEntries = async (req, res) => {
  try {
    const file = req.file;
    const company = req.body.company;
    const orgId = req.user.organizationId;
    const createdBy = req.user.id;

    if (!file || !company) {
      return res.status(400).json({ message: "Missing file or company" });
    }

    const rows = await parseXLSX(file.path);

    const session = await prisma.importSession.create({
      data: {
        organizationId: orgId,
        platform: company,
        file: {
          create: {
            name: file.originalname,
            url: "", // optional upload URL
          },
        },
      },
    });

    let added = 0;
    let updated = 0;

    for (const row of rows) {
      const {
        fullName,
        email,
        amount,
        date,
        hours,
        net,
        externalId,
        companyName,
        iban,
        bankName,
        beneficiary,
      } = row;

      let entry = await prisma.entry.findFirst({
        where: {
          organizationId: orgId,
          fullName,
          email,
          platform: company,
        },
      });

      if (!entry) {
        entry = await prisma.entry.create({
          data: {
            organizationId: orgId,
            createdById: createdBy,
            fullName,
            email,
            platform: company,
            externalId,
            companyName,
            iban,
            bankName,
            beneficiary,
            importSessionId: session.id,
          },
        });
        added++;
      } else {
        updated++;
      }

      await prisma.salaryHistory.create({
        data: {
          entryId: entry.id,
          amount: parseFloat(amount),
          date: new Date(date),
          hours: parseInt(hours, 10),
          net: parseFloat(net),
        },
      });
    }

    res.json({ message: "Import completed", added, updated });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Failed to import entries" });
  }
};

/**
 * Export your org’s entries into Excel
 */
export const exportEntries = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { columns = [], date } = req.body;

    let entries = await prisma.entry.findMany({
      where: { organizationId: orgId },
      include: { salaryHistories: true },
    });

    if (date) {
      const target = new Date(date).toISOString().slice(0, 10);
      entries = entries.map((e) => ({
        ...e,
        salaryHistories: e.salaryHistories.filter((s) =>
          new Date(s.date).toISOString().slice(0, 10) === target
        ),
      }));
    }

    const filePath = `/tmp/entries-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries(entries, columns);
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, "entries.xlsx", () => fs.unlinkSync(filePath));
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Failed to export entries" });
  }
};

/**
 * Get salary history for one entry (scoped to org)
 */
export const getSalaryHistory = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;

    // ensure the entry belongs to you
    const entry = await prisma.entry.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const history = await prisma.salaryHistory.findMany({
      where: { entryId: id },
      orderBy: { date: "desc" },
    });
    res.json(history);
  } catch (error) {
    console.error("Salary history error:", error);
    res.status(500).json({ message: "Failed to fetch salary history" });
  }
};

/**
 * Export a single entry’s salary history as Excel
 */
export const exportSalaryById = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;

    const entry = await prisma.entry.findFirst({
      where: { id, organizationId: orgId },
      include: { salaryHistories: true },
    });
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const filePath = `/tmp/salary-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries([entry], [
      "fullName",
      "email",
      "platform",
      // you can add other columns here if you like
    ]);
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, "salary-history.xlsx", () => fs.unlinkSync(filePath));
  } catch (error) {
    console.error("Export salary history error:", error);
    res.status(500).json({ message: "Failed to export salary history" });
  }
};

/**
 * Email a single entry’s salary history (scoped to org)
 */
export const emailSalaryById = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { id } = req.params;

    const entry = await prisma.entry.findFirst({
      where: { id, organizationId: orgId },
      include: { salaryHistories: true },
    });
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const filePath = `/tmp/salary-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries([entry], [
      "fullName",
      "email",
      "platform",
    ]);
    fs.writeFileSync(filePath, buffer);

    await gmailMailer({
      to: entry.email,
      subject: "Your Salary History",
      text: "Attached is your salary history.",
      attachments: [{ filename: "salary-history.xlsx", path: filePath }],
    });

    fs.unlinkSync(filePath);
    res.json({ message: "Email sent" });
  } catch (error) {
    console.error("Email salary history error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};
