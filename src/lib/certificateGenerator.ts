import { jsPDF } from 'jspdf';

export const generateCertificate = async (data: {
  studentName: string;
  topicName: string;
  date: string;
  certId: string;
}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(5, 7, 10);
  doc.rect(0, 0, width, height, 'F');

  // Border
  doc.setDrawColor(0, 242, 255);
  doc.setLineWidth(1);
  doc.rect(10, 10, width - 20, height - 20, 'D');
  
  doc.setDrawColor(0, 242, 255, 0.2);
  doc.setLineWidth(5);
  doc.rect(15, 15, width - 30, height - 30, 'D');

  // Content
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  
  doc.setFontSize(10);
  doc.text('EXAMKRAFT MASTER PROTOCOL', width / 2, 40, { align: 'center' });

  doc.setFontSize(50);
  doc.setTextColor(0, 242, 255);
  doc.text('CERTIFICATE', width / 2, 70, { align: 'center' });
  doc.text('OF MASTERY', width / 2, 85, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('THESE PRESENTS VERIFY THAT', width / 2, 105, { align: 'center' });

  doc.setFontSize(30);
  doc.setFont('courier', 'bolditalic');
  doc.text(data.studentName.toUpperCase(), width / 2, 125, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.text('HAS SUCCESSFULLY DECODED AND MASTERED', width / 2, 145, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(0, 242, 255);
  doc.text(data.topicName.toUpperCase(), width / 2, 160, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`CERTIFICATE ID: ${data.certId}`, width / 2, 180, { align: 'center' });
  doc.text(`VALIDATION DATE: ${data.date}`, width / 2, 185, { align: 'center' });

  // Signature Simulated
  doc.setDrawColor(0, 242, 255, 0.5);
  doc.line(width / 2 - 30, 210, width / 2 + 30, 210);
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('MASTER CURATOR', width / 2, 220, { align: 'center' });

  return doc;
};
