import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(10, 22, 40); // Dark Blue roughly
  doc.text("POPULAR KITCHEN", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("TAX INVOICE", 14, 28);
  
  // Date and Order ID
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`Order ID: ${order.id}`, 130, 20);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 26);
  
  // Line
  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);
  
  // Customer Info
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Billed To:", 14, 45);
  doc.setFontSize(10);
  doc.text(`Name: ${order.customerName}`, 14, 52);
  doc.text(`Phone: ${order.phone}`, 14, 58);
  
  // Handled multiline address
  const splitAddress = doc.splitTextToSize(`Address: ${order.address}`, 80);
  doc.text(splitAddress, 14, 64);

  // Table Data
  const tableData = order.items.map(item => [
    item.title,
    item.size !== 'N/A' ? item.size : '-',
    item.quantity.toString(),
    `Rs. ${item.price}`,
    `Rs. ${item.price * item.quantity}`
  ]);

  // Using autoTable plugin
  doc.autoTable({
    startY: 85,
    head: [['Item Name', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 144, 255] }, // pk-accent
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable.finalY || 85;

  // Subtotal & Total
  doc.setFontSize(10);
  doc.text("Subtotal:", 140, finalY + 10);
  doc.text(`Rs. ${order.totalAmount}`, 170, finalY + 10);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Grand Total:", 140, finalY + 18);
  doc.text(`Rs. ${order.totalAmount}`, 170, finalY + 18);

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text("Thank you for shopping with Popular Kitchen!", 105, finalY + 40, null, null, "center");

  // Download
  doc.save(`invoice-${order.id}.pdf`);
};
