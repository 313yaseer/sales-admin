import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const numberToWords = (num) => {
  const ones = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (num < 20) return ones[num];
  if (num < 100) {
    const t = Math.floor(num / 10);
    const r = num % 10;
    return r ? `${tens[t]} ${ones[r]}` : tens[t];
  }
  if (num < 1000) {
    const h = Math.floor(num / 100);
    const r = num % 100;
    return r ? `${ones[h]} hundred ${numberToWords(r)}` : `${ones[h]} hundred`;
  }
  if (num < 1000000) {
    const k = Math.floor(num / 1000);
    const r = num % 1000;
    return r ? `${numberToWords(k)} thousand ${numberToWords(r)}` : `${numberToWords(k)} thousand`;
  }
  return `${num}`;
};

const amountInWords = (amount) => {
  const whole = Math.floor(Number(amount || 0));
  return `${numberToWords(whole)} naira only`;
};

export const generateReceipt = (invoice, items, assets = {}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let cursorY = 14;

  if (assets.logoDataUrl) {
    const logoSize = 18;
    doc.addImage(
      assets.logoDataUrl,
      "PNG",
      centerX - logoSize / 2,
      cursorY,
      logoSize,
      logoSize
    );
    cursorY += logoSize + 4;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DR APPLE MOBILE STORE", centerX, cursorY, { align: "center" });
  cursorY += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("No 12 Rahama Plaza, Farmcenter Kano", centerX, cursorY, { align: "center" });
  cursorY += 4;
  doc.text("Phone: +234 813 784 3328", centerX, cursorY, { align: "center" });
  cursorY += 4;
  doc.text("Email: sales@drapple.com", centerX, cursorY, { align: "center" });
  cursorY += 6;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SALES RECEIPT", centerX, cursorY, { align: "center" });
  cursorY += 6;

  if (invoice.status === "paid") {
    const stampWidth = 36;
    const stampHeight = 14;
    const stampX = pageWidth - stampWidth - 16;
    const stampY = 16;
    doc.setTextColor(220, 38, 38);
    doc.setDrawColor(220, 38, 38);
    doc.setFontSize(18);
    doc.rect(stampX, stampY, stampWidth, stampHeight);
    doc.text("PAID", stampX + stampWidth / 2, stampY + 9.5, {
      align: "center",
    });
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${invoice.id}`, 14, cursorY);
  cursorY += 4;
  doc.text(`Customer: ${invoice.customer_name || ""}`, 14, cursorY);
  cursorY += 4;
  doc.text(`Phone: ${invoice.customer_phone || ""}`, 14, cursorY);
  cursorY += 4;

  const tableRows = items.map((item) => [
    item.name,
    item.quantity,
    `₦${Number(item.price || 0).toFixed(2)}`,
    `₦${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: cursorY + 4,
    head: [["Product", "Qty", "Price", "Total"]],
    body: tableRows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [241, 245, 249], textColor: 20, halign: "left" },
    theme: "grid",
  });

  const total = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );

  const finalY = doc.lastAutoTable?.finalY || cursorY + 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: NGN ${total.toFixed(2)}`, 14, finalY + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Amount in words: ${amountInWords(total)}`, 14, finalY + 11);

  let footerY = finalY + 22;
  if (assets.qrDataUrl) {
    const qrSize = 22;
    doc.addImage(
      assets.qrDataUrl,
      "PNG",
      centerX - qrSize / 2,
      footerY,
      qrSize,
      qrSize
    );
    footerY += qrSize + 4;
    doc.setFontSize(8);
    doc.text("Scan to verify receipt", centerX, footerY, { align: "center" });
    footerY += 6;
  }

  doc.setFontSize(9);
  doc.line(30, footerY + 10, 90, footerY + 10);
  doc.line(pageWidth - 90, footerY + 10, pageWidth - 30, footerY + 10);
  doc.text("Manager Signature", 60, footerY + 14, { align: "center" });
  doc.text("Customer Signature", pageWidth - 60, footerY + 14, { align: "center" });

  doc.setFontSize(8);
  doc.text("Thank you for your purchase.", centerX, footerY + 22, {
    align: "center",
  });

  doc.save(`receipt-${invoice.id}.pdf`);
};
