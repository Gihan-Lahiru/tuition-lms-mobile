import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfWatermarkService {
  private readonly logger = new Logger(PdfWatermarkService.name);

  async addWatermarkToPdfBuffer(
    pdfBuffer: Buffer,
    studentName: string,
    studentGrade: string,
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const name = studentName || 'Student';
      const watermarkText = studentGrade ? `${name} | Grade ${studentGrade}` : name;
      const footerText = 'MW Tuition LMS • Confidential Student Copy';

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textSize = 32;
        const textWidth = font.widthOfTextAtSize(watermarkText, textSize);
        const yPositions = [height * 0.72, height * 0.48, height * 0.24];

        for (const y of yPositions) {
          const x = Math.max(24, width / 2 - textWidth / 2);
          page.drawText(watermarkText, {
            x,
            y,
            size: textSize,
            font,
            color: rgb(0.45, 0.45, 0.55),
            opacity: 0.22,
            rotate: degrees(0),
          });
        }

        const footerSize = 11;
        const footerWidth = font.widthOfTextAtSize(footerText, footerSize);
        page.drawText(footerText, {
          x: Math.max(20, width / 2 - footerWidth / 2),
          y: 24,
          size: footerSize,
          font,
          color: rgb(0.3, 0.3, 0.4),
          opacity: 0.55,
        });
      }

      const modified = await pdfDoc.save();
      return Buffer.from(modified);
    } catch (err) {
      this.logger.warn(`PDF watermark fallback to original buffer: ${err?.message}`);
      return pdfBuffer;
    }
  }

  async resolveAndWatermarkLocalOrRemote(
    fileUrl: string,
    studentName: string,
    studentGrade: string,
  ): Promise<Buffer | null> {
    try {
      const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
      if (fileUrl.includes('/uploads/')) {
        const rel = fileUrl.split('/uploads/')[1];
        const abs = path.join(uploadRoot, rel);
        if (fs.existsSync(abs)) {
          const raw = fs.readFileSync(abs);
          return this.addWatermarkToPdfBuffer(raw, studentName, studentGrade);
        }
      }
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        const res = await fetch(fileUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          return this.addWatermarkToPdfBuffer(buf, studentName, studentGrade);
        }
      }
      return null;
    } catch (err) {
      this.logger.warn(`Failed to watermark ${fileUrl}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Generates a real, readable multi-line PDF document for seeded sample papers/notes
   * so students can immediately preview and test watermarked downloads locally.
   */
  async createSamplePdfFile(
    targetPath: string,
    title: string,
    subtitle: string,
    lines: string[],
  ): Promise<void> {
    if (fs.existsSync(targetPath)) return;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const pdfDoc = await PDFDocument.create();
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([595, 842]); // A4

    page.drawText('MW TUITION LMS — STUDY MATERIAL', {
      x: 50,
      y: 790,
      size: 11,
      font: bold,
      color: rgb(0.15, 0.35, 0.75),
    });
    page.drawText(title, {
      x: 50,
      y: 758,
      size: 20,
      font: bold,
      color: rgb(0.08, 0.1, 0.18),
    });
    page.drawText(subtitle, {
      x: 50,
      y: 734,
      size: 12,
      font: regular,
      color: rgb(0.35, 0.4, 0.48),
    });

    let y = 690;
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 12,
        font: regular,
        color: rgb(0.12, 0.15, 0.2),
      });
      y -= 24;
    }

    const bytes = await pdfDoc.save();
    fs.writeFileSync(targetPath, Buffer.from(bytes));
  }
}

