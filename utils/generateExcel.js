// src/utils/generateExcel.js
import ExcelJS from 'exceljs';

export async function generateExcelFromEntries(entries, selectedColumns) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Entries');

  // Header
  worksheet.columns = selectedColumns.map(col => ({ header: col, key: col }));

  // Rows
  entries.forEach(entry => {
    const row = {};
    selectedColumns.forEach(col => {
      row[col] = entry[col] || '';
    });
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
