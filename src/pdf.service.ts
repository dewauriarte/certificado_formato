import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { CertificateData, PDFGenerationOptions } from './types';

/**
 * Servicio para generar certificados oficiales de estudios en formato PDF
 * Replica el diseño oficial del Ministerio de Educación
 */
export class PDFCertificateService {
  private doc: PDFKit.PDFDocument;
  private readonly PAGE_WIDTH = 595.28; // A4 width in points
  private readonly PAGE_HEIGHT = 841.89; // A4 height in points
  private readonly MARGIN_LEFT = 50;
  private readonly MARGIN_RIGHT = 50;
  private readonly MARGIN_TOP = 40;
  private readonly MARGIN_BOTTOM = 50;

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.MARGIN_TOP,
        bottom: this.MARGIN_BOTTOM,
        left: this.MARGIN_LEFT,
        right: this.MARGIN_RIGHT,
      },
    });
  }

  /**
   * Genera el certificado PDF completo
   */
  async generateCertificate(
    data: CertificateData,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const { outputPath, qrEnabled = true } = options;

    // Generar el contenido del PDF
    await this.drawHeader(data);
    await this.drawIntroText(data);
    await this.drawGradesTable(data);
    await this.drawFooter(data, qrEnabled);

    // Finalizar el documento
    this.doc.end();

    // Convertir a buffer
    const buffer = await this.getPDFBuffer();

    // Guardar en archivo si se especifica ruta
    if (outputPath) {
      fs.writeFileSync(outputPath, buffer);
    }

    return buffer;
  }

  /**
   * Dibuja el encabezado del certificado
   */
  private async drawHeader(data: CertificateData): Promise<void> {
    let currentY = this.MARGIN_TOP;

    // Dibujar logo del Ministerio (lado izquierdo)
    this.drawMinistryLogo(this.MARGIN_LEFT, currentY);

    // Código virtual (esquina superior derecha)
    const rightX = this.PAGE_WIDTH - this.MARGIN_RIGHT;
    this.doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('CÓDIGO VIRTUAL', rightX - 100, currentY, {
        width: 100,
        align: 'right',
      });

    this.doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(data.virtualCode, rightX - 100, currentY + 12, {
        width: 100,
        align: 'right',
      });

    // Número de certificado
    this.doc
      .fontSize(9)
      .font('Helvetica')
      .text(`N.° ${data.certificateNumber}`, rightX - 100, currentY + 28, {
        width: 100,
        align: 'right',
      });

    // Títulos centrales
    currentY += 15;

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('MINISTERIO DE EDUCACIÓN', this.MARGIN_LEFT, currentY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT,
        align: 'center',
      });

    currentY += 18;
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('CERTIFICADO OFICIAL DE ESTUDIOS', this.MARGIN_LEFT, currentY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT,
        align: 'center',
      });

    currentY += 20;
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('NIVEL SECUNDARIA', this.MARGIN_LEFT, currentY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT,
        align: 'center',
      });

    currentY += 16;
    this.doc
      .fontSize(11)
      .font('Helvetica')
      .text('EDUCACIÓN BÁSICA REGULAR', this.MARGIN_LEFT, currentY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT,
        align: 'center',
      });

    // Mover el cursor hacia abajo para el siguiente contenido
    this.doc.y = currentY + 25;
  }

  /**
   * Dibuja el logo del Ministerio de Educación
   */
  private drawMinistryLogo(x: number, y: number): void {
    // Logo simplificado del Ministerio
    // Rectángulo rojo (bandera peruana)
    this.doc.save();
    this.doc.rect(x, y, 20, 28).fill('#D91023');

    // Rectángulo blanco
    this.doc.rect(x + 20, y, 20, 28).fill('#FFFFFF');
    this.doc.rect(x + 20, y, 20, 28).stroke('#000000');

    // Rectángulo gris oscuro
    this.doc.rect(x + 40, y, 80, 28).fill('#4A4A4A');

    // Texto "PERÚ" en el rectángulo rojo/blanco
    this.doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text('PERÚ', x + 3, y + 10, { width: 34, align: 'center' });

    // Texto "Ministerio de Educación" en el rectángulo gris
    this.doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#FFFFFF')
      .text('Ministerio', x + 44, y + 6, { width: 72, align: 'left' });

    this.doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#FFFFFF')
      .text('de Educación', x + 44, y + 16, { width: 72, align: 'left' });

    this.doc.restore();
    this.doc.fillColor('#000000'); // Restaurar color negro
  }

  /**
   * Dibuja el texto introductorio
   */
  private async drawIntroText(data: CertificateData): Promise<void> {
    const currentY = this.doc.y;
    const { student, years } = data;

    // Construir el texto de grados
    const gradesText = student.grades.join(', ');

    const introText = `Que ${student.fullName}, con DNI del estudiante N.° ${student.dni}, ha concluido estudios correspondiente(s) a ${gradesText} grado de ${student.educationType}, nivel de ${student.educationLevel}, con los niveles de logro alcanzados, según consta en las actas de evaluación respectivas:`;

    this.doc
      .fontSize(9)
      .font('Helvetica')
      .text(introText, this.MARGIN_LEFT, currentY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT,
        align: 'justify',
        lineGap: 2,
      });

    this.doc.moveDown(1.5);
  }

  /**
   * Dibuja la tabla de notas
   */
  private async drawGradesTable(data: CertificateData): Promise<void> {
    const startY = this.doc.y;
    const tableWidth = this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;
    const numYears = data.years.length;

    // Ancho de columnas
    const labelColumnWidth = tableWidth * 0.38; // 38% para la columna de etiquetas
    const yearColumnWidth = (tableWidth - labelColumnWidth) / numYears;

    let currentY = startY;

    // Función auxiliar para dibujar una celda
    const drawCell = (
      text: string,
      x: number,
      y: number,
      width: number,
      height: number,
      options: {
        align?: 'left' | 'center' | 'right';
        bold?: boolean;
        fontSize?: number;
        borders?: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
      } = {}
    ) => {
      const {
        align = 'center',
        bold = false,
        fontSize = 7,
        borders = { top: true, bottom: true, left: true, right: true },
      } = options;

      // Dibujar bordes
      this.doc.save();
      if (borders.left) this.doc.moveTo(x, y).lineTo(x, y + height).stroke();
      if (borders.right) this.doc.moveTo(x + width, y).lineTo(x + width, y + height).stroke();
      if (borders.top) this.doc.moveTo(x, y).lineTo(x + width, y).stroke();
      if (borders.bottom) this.doc.moveTo(x, y + height).lineTo(x + width, y + height).stroke();
      this.doc.restore();

      // Dibujar texto
      this.doc
        .fontSize(fontSize)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(text, x + 2, y + (height - fontSize) / 2, {
          width: width - 4,
          align: align,
          lineBreak: false,
        });
    };

    const rowHeight = 18;

    // Encabezado: Año lectivo
    let currentX = this.MARGIN_LEFT;
    drawCell('Año lectivo:', currentX, currentY, labelColumnWidth, rowHeight, {
      align: 'left',
      fontSize: 7,
    });

    currentX += labelColumnWidth;
    data.years.forEach((yearData) => {
      drawCell(yearData.year.toString(), currentX, currentY, yearColumnWidth, rowHeight, {
        fontSize: 8,
      });
      currentX += yearColumnWidth;
    });

    currentY += rowHeight;

    // Fila: Grado
    currentX = this.MARGIN_LEFT;
    drawCell('Grado:', currentX, currentY, labelColumnWidth, rowHeight, {
      align: 'left',
      fontSize: 7,
    });

    currentX += labelColumnWidth;
    data.years.forEach((yearData) => {
      drawCell(yearData.grade, currentX, currentY, yearColumnWidth, rowHeight, {
        fontSize: 8,
      });
      currentX += yearColumnWidth;
    });

    currentY += rowHeight;

    // Fila: Código modular
    currentX = this.MARGIN_LEFT;
    drawCell('Código modular de la IE:', currentX, currentY, labelColumnWidth, rowHeight, {
      align: 'left',
      fontSize: 7,
    });

    currentX += labelColumnWidth;
    data.years.forEach((yearData) => {
      drawCell(yearData.moduleCode, currentX, currentY, yearColumnWidth, rowHeight, {
        fontSize: 7,
      });
      currentX += yearColumnWidth;
    });

    currentY += rowHeight;

    // Áreas Curriculares
    const areaLabelHeight = rowHeight * 1.2;
    currentX = this.MARGIN_LEFT;

    // Celda combinada para "Áreas Curriculares"
    const totalAreasHeight =
      data.curricularAreas.length * rowHeight + data.transversalCompetences.length * rowHeight;

    this.doc.save();
    this.doc.rect(currentX, currentY, 80, totalAreasHeight).stroke();
    this.doc.restore();

    this.doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('Áreas Curriculares', currentX + 2, currentY + 5, {
        width: 76,
        align: 'left',
      });

    // Dibujar áreas curriculares
    let areaY = currentY;
    data.curricularAreas.forEach((area) => {
      currentX = this.MARGIN_LEFT + 80;
      const areaNameWidth = labelColumnWidth - 80;

      drawCell(area.area, currentX, areaY, areaNameWidth, rowHeight, {
        align: 'left',
        fontSize: 6.5,
      });

      currentX += areaNameWidth;
      area.scores.forEach((score) => {
        const scoreText = score === null || score === undefined ? '-' : score.toString();
        drawCell(scoreText, currentX, areaY, yearColumnWidth, rowHeight, {
          fontSize: 7,
        });
        currentX += yearColumnWidth;
      });

      areaY += rowHeight;
    });

    // Competencias Transversales
    const compY = areaY;
    currentX = this.MARGIN_LEFT;

    // Celda combinada para "Competencias Transversales"
    const compHeight = data.transversalCompetences.length * rowHeight;
    this.doc.save();
    this.doc.rect(currentX, compY, 80, compHeight).stroke();
    this.doc.restore();

    this.doc
      .fontSize(6.5)
      .font('Helvetica-Bold')
      .text('Competencias\nTransversales', currentX + 2, compY + 5, {
        width: 76,
        align: 'left',
      });

    // Dibujar competencias transversales
    let compRowY = compY;
    data.transversalCompetences.forEach((comp) => {
      currentX = this.MARGIN_LEFT + 80;
      const compNameWidth = labelColumnWidth - 80;

      drawCell(comp.competence, currentX, compRowY, compNameWidth, rowHeight, {
        align: 'left',
        fontSize: 6,
      });

      currentX += compNameWidth;
      comp.scores.forEach((score) => {
        const scoreText = score === null || score === undefined ? '-' : score.toString();
        drawCell(scoreText, currentX, compRowY, yearColumnWidth, rowHeight, {
          fontSize: 7,
        });
        currentX += yearColumnWidth;
      });

      compRowY += rowHeight;
    });

    currentY = compRowY;

    // Situación final
    currentX = this.MARGIN_LEFT;
    drawCell('Situación final', currentX, currentY, labelColumnWidth, rowHeight, {
      align: 'right',
      bold: true,
      fontSize: 7,
    });

    currentX += labelColumnWidth;
    data.finalStatus.forEach((status) => {
      drawCell(status, currentX, currentY, yearColumnWidth, rowHeight, {
        bold: true,
        fontSize: 7,
      });
      currentX += yearColumnWidth;
    });

    currentY += rowHeight;

    // Actualizar posición Y del documento
    this.doc.y = currentY + 20;
  }

  /**
   * Dibuja el pie de página con QR, información legal y firma
   */
  private async drawFooter(data: CertificateData, qrEnabled: boolean): Promise<void> {
    const footerStartY = this.PAGE_HEIGHT - 150;

    // Generar código QR si está habilitado
    if (qrEnabled) {
      const qrData = `CERT:${data.certificateNumber}|VC:${data.virtualCode}|DNI:${data.student.dni}`;
      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 80,
        margin: 1,
        errorCorrectionLevel: 'M',
      });

      // Dibujar QR en la esquina inferior izquierda
      this.doc.image(qrBuffer, this.MARGIN_LEFT, footerStartY, {
        width: 70,
        height: 70,
      });
    }

    // Texto legal
    const legalText =
      'El certificado de estudios debe contar con la firma del funcionario responsable de la emisión para tener validez, conforme con la\nResolución Ministerial N° 432-2020-MINEDU.';

    this.doc
      .fontSize(7)
      .font('Helvetica')
      .text(legalText, this.MARGIN_LEFT + 90, footerStartY, {
        width: this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT - 90,
        align: 'center',
        lineGap: 2,
      });

    // Fecha y hora de emisión
    const emissionY = footerStartY + 35;
    this.doc
      .fontSize(7)
      .font('Helvetica')
      .text(`Fecha de emisión: ${data.emissionDate}`, this.MARGIN_LEFT + 90, emissionY, {
        width: 250,
        align: 'left',
      });

    this.doc
      .fontSize(7)
      .font('Helvetica')
      .text(`Hora de emisión: ${data.emissionTime}`, this.MARGIN_LEFT + 90, emissionY + 10, {
        width: 250,
        align: 'left',
      });

    // Nombre y cargo del director (lado derecho)
    const directorX = this.PAGE_WIDTH - this.MARGIN_RIGHT - 200;
    this.doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(data.directorName, directorX, emissionY, {
        width: 200,
        align: 'left',
      });

    this.doc
      .fontSize(7)
      .font('Helvetica')
      .text(data.directorTitle, directorX, emissionY + 12, {
        width: 200,
        align: 'left',
      });

    // Línea separadora superior
    this.doc
      .moveTo(this.MARGIN_LEFT + 90, footerStartY + 30)
      .lineTo(this.PAGE_WIDTH - this.MARGIN_RIGHT, footerStartY + 30)
      .stroke();

    // Número de certificado en la parte inferior
    this.doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(`N.° ${data.certificateNumber}`, this.MARGIN_LEFT, this.PAGE_HEIGHT - 40, {
        width: 150,
        align: 'left',
      });
  }

  /**
   * Obtiene el PDF como Buffer
   */
  private getPDFBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      this.doc.on('data', buffers.push.bind(buffers));
      this.doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      this.doc.on('error', reject);
    });
  }

  /**
   * Genera hash SHA-256 del PDF para verificación de integridad
   */
  static generateHash(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  }
}
