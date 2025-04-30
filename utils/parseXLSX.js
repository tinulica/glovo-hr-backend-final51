// utils/parseXLSX.js
import xlsx from "xlsx";

export default function parseXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const extracted = rows
    .filter(row => row["Id curier"] && row["Nume"]) // skip empty rows
    .map(row => ({
      externalId: String(row["Id curier"]),
      fullName: row["Nume"],
      email: row["Email"],
      companyName: row["Nume Companie"],
      amount: parseFloat(row["Total Venituri de transferat"]),
      platform: "GLOVO",
      date: new Date(),
    }));

  return extracted;
}
