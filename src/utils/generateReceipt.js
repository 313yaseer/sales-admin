import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (invoice, items) => {
  const doc = new jsPDF();
  const createdAt = invoice.created_at ? new Date(invoice.created_at) : new Date();

  doc.setFontSize(16);
  doc.text("Dr Phone Store", 14, 18);
  doc.setFontSize(14);
  doc.text("SALES RECEIPT", 14, 28);

  doc.setFontSize(10);
  doc.text(`Invoice ID: ${invoice.id}`, 14, 38);
  doc.text(`Date: ${createdAt.toLocaleDateString()}`, 14, 44);
  doc.text(`Customer Name: ${invoice.customer_name || ""}`, 14, 50);
  doc.text(`Customer Phone: ${invoice.customer_phone || ""}`, 14, 56);

  const tableRows = items.map((item) => [
    item.name,
    item.quantity,
    Number(item.price || 0).toFixed(2),
    (Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2),
  ]);

  autoTable(doc, {
    startY: 64,
    head: [["Product", "Quantity", "Price", "Total"]],
    body: tableRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 23, 42] },
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );

  const finalY = doc.lastAutoTable?.finalY || 70;
  doc.setFontSize(12);
  doc.text(`Total: $${total.toFixed(2)}`, 14, finalY + 10);

  doc.save(`receipt-${invoice.id}.pdf`);
};
