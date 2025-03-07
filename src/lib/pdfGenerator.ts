
import { Column } from "@/components/data-display/DataTable";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

export const generatePdf = <T extends Record<string, any>>(data: T[], columns: Column<T>[]) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text("Items Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

  // Prepare table headers and data
  const headers = columns.map(column => column.header);
  
  const tableData = data.map(item => 
    columns.map(column => {
      // Check if there's a custom cell renderer
      if (column.cell) {
        // This is a simplified approach as custom renderers might return JSX
        try {
          return column.cell({ row: item }).toString();
        } catch (error) {
          return String(item[column.accessorKey]);
        }
      }
      return String(item[column.accessorKey]);
    })
  );

  // Create the table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 30,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { top: 30 },
  });

  // Save the PDF
  doc.save("items-report.pdf");
};
