import prisma from "../lib/prisma.js";
import parseXLSX from "../utils/parseXLSX.js";
import generateExcelFromEntries from "../utils/generateExcel.js";
import gmailMailer from "../utils/gmailMailer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// List entries for the user's organization
export const listEntries = async (req, res) => {
  try {
    const entries = await prisma.entry.findMany({
      where: { organizationId: req.user.orgId },
      include: { salaryHistories: true },
    });
    res.json(entries);
  } catch (error) {
    console.error("List entries error:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
};

// Add a new entry manually (scoped)
export const addEntryManually = async (req, res) => {
  try {
    const {
      fullName, email, platform, externalId,
      companyName, iban, bankName, beneficiary,
      collabType, collabDetails
    } = req.body;

    const newEntry = await prisma.entry.create({
      data: {
        fullName,
        email,
        platform,
        externalId,
        companyName,
        iban,
        bankName,
        beneficiary,
        collabType: collabType || null,
        collabDetails: collabDetails || {},
        createdById: req.user.id,
        organizationId: req.user.orgId
      }
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Manual entry error:", error);
    res.status(500).json({ message: "Failed to create entry manually." });
  }
};

// Update entry (scoped)
export const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.entry.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const {
      salary,
      fullName, email, platform, externalId,
      companyName, iban, bankName, beneficiary,
      collabType, collabDetails
    } = req.body;

    const updateData = {
      fullName,
      email,
      platform,
      externalId,
      companyName,
      iban,
      bankName,
      beneficiary,
      collabType: collabType || null,
      collabDetails: collabDetails || {}
    };

    if (typeof updateData.collabDetails === 'string') {
      try {
        updateData.collabDetails = JSON.parse(updateData.collabDetails);
      } catch (e) {
        return res.status(400).json({ message: "Invalid JSON for collabDetails." });
      }
    }

    const updated = await prisma.entry.update({
      where: { id },
      data: updateData,
    });

    if (salary !== undefined && !isNaN(salary)) {
      const latest = await prisma.salaryHistory.findFirst({
        where: { entryId: id },
        orderBy: { changedAt: 'desc' },
      });

      const different = !latest || parseFloat(latest.amount) !== parseFloat(salary);

      if (different) {
        await prisma.salaryHistory.create({
          data: {
            entryId: id,
            amount: parseFloat(salary),
            date: new Date(),
            hours: 8,
            net: parseFloat(salary),
            changedAt: new Date(),
          },
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ message: "Failed to update entry." });
  }
};

// Delete entry (scoped)
export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({ where: { id } });

    if (!entry || entry.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
    }

    await prisma.entry.delete({ where: { id } });
    res.json({ message: "Entry deleted." });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ message: "Failed to delete entry." });
  }
};

// Import entries (scoped)
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
        organizationId: req.user.orgId,
        createdById: req.user.id,
        file: { create: { name: file.originalname, url: "" } },
      },
    });

    let added = 0;
    let updated = 0;

    for (const row of rows) {
      const {
        fullName, email, amount, date, hours, net,
        externalId, companyName, iban, bankName, beneficiary
      } = row;

      let entry = await prisma.entry.findFirst({
        where: {
          fullName,
          email,
          platform: company,
          organizationId: req.user.orgId,
        },
      });

      if (!entry) {
        entry = await prisma.entry.create({
          data: {
            fullName,
            email,
            platform: company,
            externalId,
            companyName,
            iban,
            bankName,
            beneficiary,
            organizationId: req.user.orgId,
            createdById: req.user.id,
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
          hours: parseInt(hours),
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

// Email latest salary info
export const emailSalaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: { salaryHistories: true }
    });

    if (!entry || entry.organizationId !== req.user.orgId) {
      return res.status(404).json({ message: "Entry not found or access denied" });
    }

    const latestSalary = entry.salaryHistories.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )[0];

    if (!latestSalary) {
      return res.status(400).json({ message: "No salary data available for this entry" });
    }

    await gmailMailer({
      to: entry.email,
      subject: `Latest Salary Info for ${entry.fullName}`,
      text: `Dear ${entry.fullName},\n\nYour latest salary is €${latestSalary.amount.toFixed(2)} as of ${new Date(latestSalary.date).toLocaleDateString()}.\n\nBest regards,\nHR Team`,
    });

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email salary error:", error);
    res.status(500).json({ message: "Failed to send salary email." });
  }
};