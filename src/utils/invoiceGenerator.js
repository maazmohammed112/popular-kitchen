import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BUSINESS = {
  name: 'Primkart Kitchenware',
  address: '363/3, Jumma Masjid Road, Cross, OPH Road,\nopposite Sana Creation, Shivaji Nagar,\nBengaluru, Karnataka 560001',
  phone: '+91 88928 36046',
  email: 'info@primkart.app',
  whatsapp: '+91 9108167067',
};

/** Load logo as base64 so jsPDF can embed it synchronously */
const getLogoBase64 = async () => {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const drawHeader = (doc, logoBase64, isAdmin) => {
  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', 12, 8, 28, 14); } catch {}
  }

  // Brand name next to logo
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 22, 40);
  doc.text(BUSINESS.name, logoBase64 ? 44 : 14, 17);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`${BUSINESS.phone}  |  ${BUSINESS.email}`, logoBase64 ? 44 : 14, 23);

  // Divider
  doc.setDrawColor(220);
  doc.line(12, 28, 198, 28);
};

/**
 * CUSTOMER invoice — red "PAYMENT NOT PAID" banner, purchase request style
 */
export const generateCustomerInvoice = async (order) => {
  if (order.status === 'delivered') {
    return generateAdminInvoice(order);
  }
  const doc = new jsPDF();
  const logo = await getLogoBase64();

  drawHeader(doc, logo, false);

  // Red warning banner
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(12, 31, 186, 11, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('⚠  PAYMENT NOT PAID — PURCHASE REQUEST', 105, 38.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(185, 28, 28);
  doc.text(
    'This is NOT a tax invoice. Payment is pending. Do not treat this as a legal receipt.',
    105, 47, { align: 'center' }
  );

  // Divider
  doc.setDrawColor(230);
  doc.line(12, 51, 198, 51);

  // Meta info (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40);
  doc.text('Order ID:', 130, 59);
  doc.text('Date:', 130, 65);
  doc.text('Payment:', 130, 71);
  doc.setFont('helvetica', 'normal');
  doc.text(order.id.slice(0, 20), 152, 59);
  doc.text(new Date().toLocaleDateString('en-IN'), 152, 65);
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.text('UNPAID', 152, 71);

  // Customer info (left)
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Bill To:', 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(order.customerName || '', 14, 65);
  doc.text(`Ph: ${order.phone || ''}`, 14, 71);
  const splitAddr = doc.splitTextToSize(`Addr: ${order.address || ''}`, 110);
  doc.text(splitAddr, 14, 77);

  // Items table
  const rows = (order.items || []).map(i => [
    i.title || '',
    i.size && i.size !== 'N/A' ? i.size : '-',
    String(i.quantity || 1),
    `Rs. ${Number(i.price || 0).toLocaleString('en-IN')}`,
    `Rs. ${(Number(i.price || 0) * Number(i.quantity || 1)).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['Item Name', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 4: { halign: 'right' } },
  });

  const y = doc.lastAutoTable.finalY + 8;

  // Total box
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(12, y, 186, 24, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  
  const baseTotal = order.customTotal || order.totalAmount || 0;
  const delivery = order.deliveryCharge || 0;
  const grandTotal = baseTotal + delivery;
  
  const amountText = `TOTAL PAYABLE: Rs. ${Number(grandTotal).toLocaleString('en-IN')} — Payment Pending`;
  
  doc.text(amountText, 105, y + 8, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  
  let offset = 13;
  if (order.discountAmount && order.discountAmount > 0) {
    doc.text(`(Includes special discount of Rs. ${Number(order.discountAmount).toLocaleString('en-IN')})`, 105, y + offset, { align: 'center' });
    offset += 5;
  }
  
  if (delivery > 0) {
    doc.text(`+ Delivery Charges: Rs. ${Number(delivery).toLocaleString('en-IN')}`, 105, y + offset, { align: 'center' });
    offset += 5;
  }
  
  doc.text(`Contact us: ${BUSINESS.whatsapp} or ${BUSINESS.email}`, 105, y + offset, { align: 'center' });

  if (order.status === 'pending' || order.status === 'confirmed') {
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('* Free delivery upto 15km in Bangalore. If more than 15km, delivery charges applied.', 105, y + 25, { align: 'center' });
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(160);
  doc.text(`${BUSINESS.name}  |  ${BUSINESS.address.replace(/\n/g, ', ')}`, 105, 286, { align: 'center' });

  doc.save(`purchase-request-${order.id.slice(0, 8)}.pdf`);
};

/**
 * ADMIN invoice — clean legal tax invoice
 */
export const generateAdminInvoice = async (order) => {
  const doc = new jsPDF();
  const logo = await getLogoBase64();

  drawHeader(doc, logo, true);

  // Blue header bar
  doc.setFillColor(30, 144, 255);
  doc.roundedRect(12, 31, 186, 11, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', 105, 38.5, { align: 'center' });

  doc.setDrawColor(220);
  doc.line(12, 44, 198, 44);

  // Meta info (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40);
  doc.text('Invoice No:', 130, 52);
  doc.text('Date:', 130, 58);
  doc.text('Status:', 130, 64);

  doc.setFont('helvetica', 'normal');
  doc.text(`INV-${order.id.slice(0, 8).toUpperCase()}`, 155, 52);
  doc.text(new Date().toLocaleDateString('en-IN'), 155, 58);

  const statusColor = order.status === 'delivered' ? [16, 185, 129] : [245, 158, 11];
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text((order.status || 'confirmed').toUpperCase(), 155, 64);

  // Customer info (left)
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Billed To:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(order.customerName || '', 14, 58);
  doc.text(`Phone: ${order.phone || ''}`, 14, 64);
  const splitAddr = doc.splitTextToSize(`Address: ${order.address || ''}`, 110);
  doc.text(splitAddr, 14, 70);

  // Items table
  const rows = (order.items || []).map(i => [
    i.title || '',
    i.size && i.size !== 'N/A' ? i.size : '-',
    String(i.quantity || 1),
    `Rs. ${Number(i.price || 0).toLocaleString('en-IN')}`,
    `Rs. ${(Number(i.price || 0) * Number(i.quantity || 1)).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Item Name', 'Size', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 144, 255], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 4: { halign: 'right' } },
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // Totals
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Subtotal:', 148, currentY);
  doc.text(`Rs. ${Number(order.totalAmount || 0).toLocaleString('en-IN')}`, 196, currentY, { align: 'right' });
  
  if (order.discountAmount && order.discountAmount > 0) {
    currentY += 6;
    doc.setTextColor(220, 38, 38);
    doc.text('Special Discount:', 148, currentY);
    doc.text(`- Rs. ${Number(order.discountAmount).toLocaleString('en-IN')}`, 196, currentY, { align: 'right' });
    doc.setTextColor(100);
  }

  if (order.deliveryCharge && order.deliveryCharge > 0) {
    currentY += 6;
    doc.text('Delivery Charges:', 148, currentY);
    doc.text(`Rs. ${Number(order.deliveryCharge).toLocaleString('en-IN')}`, 196, currentY, { align: 'right' });
  }

  doc.setDrawColor(210);
  doc.line(140, currentY + 3, 196, currentY + 3);

  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text('Grand Total (Payable):', 140, currentY);
  const payableAmount = (order.customTotal || order.totalAmount || 0) + (order.deliveryCharge || 0);
  doc.text(`Rs. ${Number(payableAmount).toLocaleString('en-IN')}`, 196, currentY, { align: 'right' });

  // Thank you
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120);
  doc.text('Thank you for shopping with Primkart Kitchenware!', 105, currentY + 12, { align: 'center' });

  if (order.status === 'pending' || order.status === 'confirmed') {
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text('* Free delivery upto 15km in Bangalore. If more than 15km, delivery charges applied.', 105, currentY + 18, { align: 'center' });
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160);
  doc.text(`${BUSINESS.name}  |  ${BUSINESS.address.replace(/\n/g, ', ')}  |  ${BUSINESS.phone}`, 105, 286, { align: 'center' });

  const fileName = order.status === 'delivered' ? `tax-invoice-${order.id.slice(0, 8)}.pdf` : `invoice-${order.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
};

// Backwards-compat alias
export const generateInvoice = generateCustomerInvoice;
