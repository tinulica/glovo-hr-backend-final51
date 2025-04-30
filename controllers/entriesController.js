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
      companyName, iban, bankName, beneficiary
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
        createdById: req.user.id,
        organizationId: req.user.orgId,
      },
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

    // Ensure the entry belongs to this org
    const existing = await prisma.entry.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
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

// Export entries (scoped)
export const exportEntries = async (req, res) => {
  try {
    const { columns = [], date } = req.body;
    let entries = await prisma.entry.findMany({
      where: { organizationId: req.user.orgId },
      include: { salaryHistories: true },
    });

    if (date) {
      const target = new Date(date);
      entries = entries.map((e) => ({
        ...e,
        salaryHistories: e.salaryHistories.filter((s) =>
          new Date(s.date).toISOString().slice(0, 10) === target.toISOString().slice(0, 10)
        ),
      }));
    }

    const filePath = `/tmp/entries-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries(entries, columns);
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, "entries.xlsx", () => fs.unlink(filePath, () => {}));
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Failed to export entries" });
  }
};

// Get salary history (scoped)
export const getSalaryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry || entry.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
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

// Export salary by ID (scoped)
export const exportSalaryById = async (req, res) => {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: req.params.id },
      include: { salaryHistories: true },
    });

    if (!entry || entry.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const filePath = `/tmp/salary-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries([entry], ["fullName", "email", "platform"]);
    fs.writeFileSync(filePath, buffer);

    res.download(filePath, "salary-history.xlsx", () => fs.unlink(filePath, () => {}));
  } catch (error) {
    console.error("Export salary history error:", error);
    res.status(500).json({ message: "Failed to export salary history" });
  }
};

// Email salary by ID (scoped)
export const emailSalaryById = async (req, res) => {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: req.params.id },
      include: { salaryHistories: true },
    });

    if (!entry || entry.organizationId !== req.user.orgId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const filePath = `/tmp/salary-${Date.now()}.xlsx`;
    const buffer = await generateExcelFromEntries([entry], ["fullName", "email", "platform"]);
    fs.writeFileSync(filePath, buffer);

    await gmailMailer({
      to: entry.email,
      subject: "Your Salary History",
      text: "Attached is your salary history.",
      attachments: [{ filename: "salary-history.xlsx", path: filePath }],
    });

    fs.unlink(filePath, () => {});
    res.json({ message: "Email sent" });
  } catch (error) {
    console.error("Email salary history error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};
