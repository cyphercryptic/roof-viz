import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import sharp from 'sharp';
import { CATEGORY_LABELS, type ProductCategory } from '@/types';

interface ProposalInput {
  companyName?: string | null;
  customerName?: string | null;
  customerAddress?: string | null;
  date?: Date;
  originalImage: Uint8Array;
  resultImage: Uint8Array;
  logoImage?: Uint8Array | null;
  product?: {
    category?: ProductCategory;
    name: string;
    brand: string;
    color: string;
    style?: string | null;
    material?: string | null;
    description?: string | null;
  } | null;
}

// Helvetica is WinAnsi. Preserve readable Latin text without throwing on names
// outside that character set; a full Unicode font can be embedded separately.
export function pdfSafe(text: string): string {
  return text.replace(/\s+/g, ' ').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E\xA1-\xFF]/g, '?').trim();
}

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of pdfSafe(text).split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    // Also wrap long URLs/SKUs with no spaces instead of drawing off the page.
    for (const character of word) {
      if (font.widthOfTextAtSize(line + character, size) > width) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function createProposalPdf(input: ProposalInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  const width = 612;
  const height = 792;
  const contentWidth = width - margin * 2;
  const category = CATEGORY_LABELS[input.product?.category || 'roofing'] || 'Exterior';
  const title = `${category} Concept Proposal`;
  doc.setTitle(title);
  doc.setCreator('ExteriorViz');
  function newPage() {
    const next = doc.addPage([width, height]);
    next.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
    return next;
  }
  let page = newPage();
  let y = height - margin;

  function room(required: number) {
    if (y - required >= 75) return;
    page = newPage();
    y = height - margin;
    page.drawText(`${title} (continued)`, { x: margin, y: y - 12, size: 12, font: bold, color: rgb(0.2, 0.2, 0.2) });
    y -= 34;
  }
  function paragraph(text: string, size = 10, strong = false) {
    const font = strong ? bold : regular;
    for (const line of wrapText(text, font, size, contentWidth)) {
      room(size + 6);
      page.drawText(line, { x: margin, y: y - size, size, font, color: rgb(0.15, 0.15, 0.15) });
      y -= size + 5;
    }
  }
  async function embedImage(bytes: Uint8Array) {
    // Accept genuine PNG/JPEG/WebP regardless of a legacy filename's suffix.
    const normalized = await sharp(Buffer.from(bytes), { limitInputPixels: 40_000_000 })
      .rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    return doc.embedPng(normalized);
  }

  if (input.logoImage) {
    try {
      const logo = await embedImage(input.logoImage);
      const scale = Math.min(120 / logo.width, 40 / logo.height);
      page.drawImage(logo, { x: margin, y: y - logo.height * scale, width: logo.width * scale, height: logo.height * scale });
      y -= logo.height * scale + 12;
    } catch { /* An unreadable optional logo must not hide the proposal. */ }
  }
  if (input.companyName) paragraph(input.companyName.slice(0, 100), 17, true);
  y -= 10;
  paragraph(title, 22, true);
  y -= 12;
  paragraph(`Date: ${(input.date || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  if (input.customerName) paragraph(`Customer: ${input.customerName.slice(0, 200)}`);
  if (input.customerAddress) paragraph(`Address: ${input.customerAddress.slice(0, 500)}`);
  y -= 18;

  const [before, after] = await Promise.all([embedImage(input.originalImage), embedImage(input.resultImage)]);
  const imageWidth = (contentWidth - 20) / 2;
  const imageHeight = 180;
  room(imageHeight + 40);
  for (const [index, image] of [before, after].entries()) {
    const x = margin + index * (imageWidth + 20);
    page.drawText(index ? 'After' : 'Before', { x, y: y - 11, size: 11, font: bold });
    const scale = Math.min(imageWidth / image.width, imageHeight / image.height);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    page.drawImage(image, {
      x: x + (imageWidth - scaledWidth) / 2,
      y: y - 24 - imageHeight + (imageHeight - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });
  }
  y -= imageHeight + 44;

  if (input.product) {
    const product = input.product;
    room(50);
    paragraph('Product Details', 14, true);
    y -= 5;
    for (const [label, value] of [
      ['Category', category], ['Name', product.name.slice(0, 300)],
      ['Brand', product.brand.slice(0, 100)], ['Color', product.color.slice(0, 100)],
      ['Style', product.style?.slice(0, 100)], ['Material', product.material?.slice(0, 100)],
    ]) {
      if (value) paragraph(`${label}: ${value}`);
    }
    if (product.description) {
      y -= 10;
      room(45);
      paragraph('Description', 11, true);
      paragraph(product.description.slice(0, 2000));
    }
  }

  const pages = doc.getPages();
  for (const [index, current] of pages.entries()) {
    current.drawLine({ start: { x: margin, y: 55 }, end: { x: width - margin, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    current.drawText('ExteriorViz | AI concept preview. Verify products and measurements before ordering.', { x: margin, y: 38, size: 8, font: regular, color: rgb(0.45, 0.45, 0.45) });
    current.drawText(`${index + 1} / ${pages.length}`, { x: width - margin - 30, y: 24, size: 8, font: regular });
  }
  return doc.save();
}
