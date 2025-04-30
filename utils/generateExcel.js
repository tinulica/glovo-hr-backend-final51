// utils/generateExcel.js
import ExcelJS from 'exceljs';

const generateExcelFromEntries = async (entries, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Entries');

  // Define the headers using the columns array
  worksheet.columns = columns.map((col) => ({
    header: col.charAt(0).toUpperCase() + col.slice(1),
    key: col,
    width: 20,
  }));

  // Add rows
  entries.forEach((entry) => {
    const row = {};
    columns.forEach((col) => {
      row[col] = entry[col] || '';
    });
    worksheet.addRow(row);
  });

  // Create buffer to return
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default generateExcelFromEntries;
