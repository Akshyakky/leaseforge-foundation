import * as XLSX from "xlsx";
import { Column } from "@/components/data-display/DataTable";

export const generateExcel = <T extends Record<string, any>>(data: T[], filename: string) => {
  // Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => {
      // Create a plain object for each item
      const row: Record<string, any> = {};

      // Get all keys from the item
      Object.keys(item).forEach((key) => {
        row[key] = item[key];
      });

      return row;
    })
  );

  // Create a workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

  // Generate the Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
