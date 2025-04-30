// utils/excelExport.js
import ExcelJS from "exceljs";

export async function generateEntriesExcel(entries, columns = []) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Entries");

  // Add headers
  sheet.addRow(columns);

  // Add data
  entries.forEach((entry) => {
    const row = columns.map((col) => entry[col] ?? "");
    sheet.addRow(row);
  });

  return await workbook.xlsx.writeBuffer();
}

export async function generateSalaryHistoryExcel(entry, history = []) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Salary History");

  sheet.addRow(["Date", "Amount", "Hours", "Net"]);

  history.forEach((record) => {
    sheet.addRow([
      record.date?.toISOString?.() ?? "",
      record.oldSalary,
      record.oldHours,
      record.oldNet
    ]);
  });

  // Current/latest
  sheet.addRow([
    entry.date?.toISOString?.() ?? "",
    entry.salary,
    entry.hours,
    entry.net
  ]);

  return await workbook.xlsx.writeBuffer();
}
