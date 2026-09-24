const { jsPDF } = require('jspdf');

const generateCertificateBuffer = async ({ recipientName, rollNumber, eventTitle, category, certificateNumber, issueDate }) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Certificate Dimensions: 297mm x 210mm
  // Draw elegant border
  doc.setDrawColor(99, 102, 241); // Indigo
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setDrawColor(218, 165, 32); // Gold inner border
  doc.setLineWidth(1);
  doc.rect(15, 15, 267, 180);

  // Background subtle tint
  doc.setFillColor(248, 250, 252);

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(30, 27, 75); // Dark Indigo
  doc.text('COLLEGEHUB SMART CAMPUS', 148.5, 42, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(99, 102, 241);
  doc.text('CERTIFICATE OF PARTICIPATION', 148.5, 54, { align: 'center' });

  // Body
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This is proudly presented to', 148.5, 75, { align: 'center' });

  // Recipient Name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recipientName.toUpperCase(), 148.5, 92, { align: 'center' });

  // Roll Number / ID
  if (rollNumber) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Roll / College ID: ${rollNumber}`, 148.5, 102, { align: 'center' });
  }

  // Event & Achievement details
  doc.setFontSize(13);
  doc.setTextColor(51, 65, 85);
  doc.text(`for active participation in the campus event`, 148.5, 118, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text(`"${eventTitle}"`, 148.5, 130, { align: 'center' });

  // Metadata Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate ID: ${certificateNumber}`, 30, 170);
  doc.text(`Issued On: ${new Date(issueDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 30, 178);

  // Signatures
  doc.line(190, 168, 260, 168);
  doc.text('Dean of Student Affairs', 225, 175, { align: 'center' });
  doc.text('CollegeHub Campus Authority', 225, 181, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
};

module.exports = {
  generateCertificateBuffer,
};
