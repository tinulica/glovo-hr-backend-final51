// controllers/entriesController.js
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import sendGmail from "../utils/gmailMailer.js";

const prisma = new PrismaClient();

// GET /entries
export const listEntries = async (req, res) => {
  const entries = await prisma.entry.findMany({
    include: { user: true },
  });
  res.json(entries);
};

// POST /entries/import
export const importEntries = async (req, res) => {
  const { company } = req.body;
  const file = req.file;

  if (!company || !file) return res.status(400).json({ message: "Missing data" });

  const filePath = file.path;

  // Save file record
  const fileRecord = await prisma.file.create({
    data: {
      name: file.originalname,
      path: file.filename,
    },
  });

  // Save import session
  await prisma.importSession.create({
    data: {
      company,
      fileId: fileRecord.id,
    },
  });

  // Read Excel/CSV
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];

  const updated = [];
  const created = [];

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const fullName = row.getCell(1).value?.toString() || "";
    const email = row.getCell(2).value?.toString() || "";
    const salary = parseFloat(row.getCell(3).value) || 0;
    const hours = parseInt(row.getCell(4).value) || 0;
    const net = parseFloat(row.getCell(5).value) || 0;
    const date = new Date(row.getCell(6).value); // assumes 6th cell is date

    const existing = await prisma.entry.findFirst({
      where: { email, platform: company, date },
    });

    if (existing) {
      await prisma.salaryHistory.create({
        data: {
          entryId: existing.id,
          oldSalary: existing.salary,
          oldHours: existing.hours,
          oldNet: existing.net,
          date,
          importFile: file.originalname,
        },
      });

      await prisma.entry.update({
        where: { id: existing.id },
        data: { salary, hours, net, fileId: fileRecord.id },
      });

      updated.push(email);
    } else {
      const user = await prisma.user.findFirst({ where: { email } });
      const newEntry = await prisma.entry.create({
        data: {
          userId: user?.id || "",
          fullName,
          email,
          salary,
          hours,
          net,
          platform: company,
          date,
          fileId: fileRecord.id,
        },
      });
      created.push(email);
    }
  }

  res.json({
    message: `Import complete. ${updated.length} updated, ${created.length} added.`,
  });
};

// POST /entries/export
export const exportEntries = async (req, res) => {
  const { columns, date } = req.body;

  const whereClause = date
    ? {
        date: {
          equals: new Date(date),
        },
      }
    : {};

  const entries = await prisma.entry.findMany({
    where: whereClause,
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Entries");

  sheet.addRow(columns);

  entries.forEach((e) => {
    const row = columns.map((col) => e[col] || "");
    sheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=entries.xlsx");
  res.send(buffer);
};

// GET /entries/salary-history/:id
export const getSalaryHistory = async (req, res) => {
  const { id } = req.params;
  const history = await prisma.salaryHistory.findMany({
    where: { entryId: id },
    orderBy: { updatedAt: "desc" },
  });
  res.json(history);
};

// GET /export/salary/:id
export const exportSalaryById = async (req, res) => {
  const { id } = req.params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  const history = await prisma.salaryHistory.findMany({ where: { entryId: id } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Salary History");

  sheet.addRow(["Date", "Amount", "Hours", "Net"]);
  history.forEach((h) => {
    sheet.addRow([h.date.toISOString(), h.oldSalary, h.oldHours, h.oldNet]);
  });
  sheet.addRow([entry.date.toISOString(), entry.salary, entry.hours, entry.net]);

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=Salary_History_${entry.email}.xlsx`);
  res.send(buffer);
};

// POST /email/salary/:id
export const emailSalaryById = async (req, res) => {
  const { id } = req.params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  const history = await prisma.salaryHistory.findMany({ where: { entryId: id } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Salary History");

  sheet.addRow(["Date", "Amount", "Hours", "Net"]);
  history.forEach((h) => {
    sheet.addRow([h.date.toISOString(), h.oldSalary, h.oldHours, h.oldNet]);
  });
  sheet.addRow([entry.date.toISOString(), entry.salary, entry.hours, entry.net]);

  const filename = `Salary_History_${entry.email}.xlsx`;
  const filePath = `./uploads/${filename}`;
  await workbook.xlsx.writeFile(filePath);

  const sent = await sendGmail(entry.email, filePath);
  if (sent) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
};
