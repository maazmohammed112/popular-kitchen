import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const BUSINESS = {
  name: 'Popular Kitchen',
  address: '363/3, Jumma Masjid Road, Cross, OPH Road,\nopposite Sana Creation, Shivaji Nagar,\nBengaluru, Karnataka 560001',
  phone: '+91 88928 36046',
  email: 'mohammedusama520@gmail.com',
  whatsapp: '+91 9108167067',
};

const addLogo = (doc) => {
  try {
    const img = new Image();
    img.src = '/logo.png';
    doc.addImage(img, 'PNG', 14, 10, 30, 14);
  } catch (_) {
    // logo optional - skip silently
  }
};

/**
 * Customer copy – "PURCHASE REQUEST" highlighted in red, unpaid notice
 */
export const generateCustomerInvoice = (order) => {
  const doc = new jsPDF();

  // Logo
  addLogo(doc);

  // Business name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 22, 40);
  doc.text(BUSINESS.name, 50, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(BUSINESS.address, 50, 24, { lineHeightFactor: 1.4 });

  // ── RED "PAYMENT NOT PAID" BANNER ──
  doc.setFillColor(239, 68, 68);     // red-500
  doc.roundedRect(14, 32, 182, 12, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('⚠  PAYMENT NOT PAID — PURCHASE REQUEST DETAILS', 105, 40, { align: 'center' });

  // Sub-label
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(180, 40, 40);
  doc.text('This is NOT a tax invoice. Payment is pending. Await confirmation from Popular Kitchen before use.', 105, 50, { align: 'center' });

  // Line
  doc.setDrawColor(220);
  doc.line(14, 54, 196, 54);

  // Order meta – right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30);
  doc.text(`Order ID:`, 130, 62);
  doc.text(`Date:`, 130, 68);
  doc.text(`Status:`, 130, 74);

  doc.setFont('helvetica', 'normal');
  doc.text(`${order.id}`, 155, 62);
  doc.text(`${new Date().toLocaleDateString('en-IN')}`, 155, 68);
  doc.text('PENDING PAYMENT', 155, 74);

  // Customer info – left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Billed To:', 14, 61);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${order.customerName}`, 14, 67);
  doc.text(`Ph: ${order.phone}`, 14, 73);
  const address = doc.splitTextToSize(`${order.address}`, 100);
  doc.text(address, 14, 79);

  // Items table
  const rows = order.items.map(i => [
    i.title,
    i.size && i.size !== 'N/A' ? i.size : '-',
    i.quantity,
    `Rs. ${i.price.toLocaleString('en-IN')}`,
    `Rs. ${(i.price * i.quantity).toLocaleString('en-IN')}`,
  ]);

  doc.autoTable({
    startY: 95,
    head: [['Item Name', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } },
  });

  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Total Amount:', 140, y);
  doc.text(`Rs. ${order.totalAmount.toLocaleString('en-IN')}`, 196, y, { align: 'right' });

  // Payment notice box
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(14, y + 6, 182, 18, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('AMOUNT DUE: Rs. ' + order.totalAmount.toLocaleString('en-IN') + ' — Payment Not Yet Received', 105, y + 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Please contact us on WhatsApp: ' + BUSINESS.whatsapp + ' to complete payment.', 105, y + 19, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`${BUSINESS.name} | ${BUSINESS.phone} | ${BUSINESS.email}`, 105, 285, { align: 'center' });

  doc.save(`purchase-request-${order.id.slice(0, 8)}.pdf`);
};

/**
 * Admin / Legal Invoice — clean, professional, no red alert
 */
export const generateAdminInvoice = (order) => {
  const doc = new jsPDF();

  addLogo(doc);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 22, 40);
  doc.text(BUSINESS.name, 50, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(BUSINESS.address, 50, 24, { lineHeightFactor: 1.4 });

  // Header bar
  doc.setFillColor(30, 144, 255);
  doc.roundedRect(14, 32, 182, 10, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', 105, 39.5, { align: 'center' });

  doc.setDrawColor(220);
  doc.line(14, 44, 196, 44);

  // Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30);
  doc.text(`Invoice No:`, 130, 52);
  doc.text(`Date:`, 130, 58);
  doc.text(`Status:`, 130, 64);

  const statusLabel = order.status === 'delivered' ? 'DELIVERED' : 'CONFIRMED';
  const statusColor = order.status === 'delivered' ? [16, 185, 129] : [245, 158, 11];

  doc.setFont('helvetica', 'normal');
  doc.text(`INV-${order.id.slice(0, 8).toUpperCase()}`, 155, 52);
  doc.text(new Date().toLocaleDateString('en-IN'), 155, 58);
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, 155, 64);

  // Customer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Billed To:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${order.customerName}`, 14, 58);
  doc.text(`Phone: ${order.phone}`, 14, 64);
  const splitAddr = doc.splitTextToSize(`Address: ${order.address}`, 100);
  doc.text(splitAddr, 14, 70);

  // Items table
  const rows = order.items.map(i => [
    i.title,
    i.size && i.size !== 'N/A' ? i.size : '-',
    i.quantity,
    `Rs. ${i.price.toLocaleString('en-IN')}`,
    `Rs. ${(i.price * i.quantity).toLocaleString('en-IN')}`,
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Item Name', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 144, 255] },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } },
  });

  const y = doc.lastAutoTable.finalY + 8;

  // Totals
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('Subtotal:', 150, y);
  doc.text(`Rs. ${order.totalAmount.toLocaleString('en-IN')}`, 196, y, { align: 'right' });
  doc.text('Delivery:', 150, y + 6);
  doc.text('FREE', 196, y + 6, { align: 'right' });

  doc.setDrawColor(220);
  doc.line(140, y + 9, 196, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Grand Total:', 140, y + 16);
  doc.text(`Rs. ${order.totalAmount.toLocaleString('en-IN')}`, 196, y + 16, { align: 'right' });

  // Thank you
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text('Thank you for shopping with Popular Kitchen!', 105, y + 28, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${BUSINESS.name} | ${BUSINESS.phone} | ${BUSINESS.email}`, 105, 285, { align: 'center' });

  doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
};

// Legacy alias for existing call sites
export const generateInvoice = generateCustomerInvoice;
