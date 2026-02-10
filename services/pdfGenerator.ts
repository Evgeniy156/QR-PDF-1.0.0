
import { jsPDF } from 'jspdf';
import { ScannedFile } from '../types';

/**
 * Generates a PDF from a list of scanned files.
 * @param files Array of ScannedFile to include in the PDF.
 * @param fileName Name of the output file.
 */
export async function generatePdf(files: ScannedFile[], fileName: string): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    if (i > 0) pdf.addPage();
    
    const file = files[i];
    const imgData = await getBase64Image(file.previewUrl);
    
    // Simple fitting: scale to fit width/height maintaining ratio
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  }

  pdf.save(`${fileName}.pdf`);
}

function getBase64Image(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}
