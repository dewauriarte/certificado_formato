import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';

/**
 * Ejemplo de uso del generador de certificados
 * Datos basados en el certificado oficial de ejemplo
 */

const exampleData: CertificateData = {
  // Información del estudiante
  student: {
    fullName: 'EDWARD RODRIGO URIARTE ANCCOTA',
    dni: '77027939',
    grades: ['PRIMER', 'SEGUNDO', 'TERCER', 'CUARTO', 'QUINTO'],
    educationLevel: 'EDUCACIÓN SECUNDARIA',
    educationType: 'EBR',
  },

  // Información de años lectivos
  years: [
    { year: 2018, grade: '1.°', moduleCode: '0474494-0' },
    { year: 2019, grade: '2.°', moduleCode: '0474494-0' },
    { year: 2020, grade: '3.°', moduleCode: '0474494-0' },
    { year: 2021, grade: '4.°', moduleCode: '0474494-0' },
    { year: 2022, grade: '5.°', moduleCode: '0474494-0' },
  ],

  // Áreas curriculares con notas
  curricularAreas: [
    { area: 'ARTE', scores: [17, '-', '-', '-', '-'] },
    { area: 'ARTE Y CULTURA', scores: ['-', 16, '-', '-', '-'] },
    { area: 'CIENCIA Y TECNOLOGÍA', scores: ['-', 16, '-', '-', '-'] },
    { area: 'CIENCIA, TECNOLOGÍA Y AMBIENTE', scores: [15, '-', '-', '-', '-'] },
    { area: 'CIENCIAS SOCIALES', scores: ['-', 16, '-', '-', '-'] },
    { area: 'COMPORTAMIENTO', scores: ['AD', '-', '-', '-', '-'] },
    { area: 'COMUNICACIÓN', scores: [14, 14, '-', '-', '-'] },
    { area: 'DESARROLLO PERSONAL, CIUDADANÍA Y CÍVICA', scores: ['-', 16, '-', '-', '-'] },
    { area: 'EDUCACIÓN FÍSICA', scores: [16, 17, '-', '-', '-'] },
    { area: 'EDUCACIÓN PARA EL TRABAJO', scores: [17, 15, '-', '-', '-'] },
    { area: 'EDUCACIÓN RELIGIOSA', scores: [15, 15, '-', '-', '-'] },
    { area: 'FORMACIÓN CIUDADANA Y CÍVICA', scores: [16, '-', '-', '-', '-'] },
    { area: 'HISTORIA, GEOGRAFÍA Y ECONOMÍA', scores: [16, '-', '-', '-', '-'] },
    { area: 'INGLÉS', scores: [16, 16, '-', '-', '-'] },
    { area: 'MATEMÁTICA', scores: [16, 16, '-', '-', '-'] },
    { area: 'PERSONA, FAMILIA Y RELACIONES HUMANAS', scores: [17, '-', '-', '-', '-'] },
  ],

  // Competencias transversales
  transversalCompetences: [
    {
      competence: 'GESTIONA SU APRENDIZAJE DE MANERA AUTÓNOMA',
      scores: ['-', 16, '-', '-', '-'],
    },
    {
      competence: 'SE DESENVUELVE EN ENTORNOS VIRTUALES GENERADOS POR LAS TIC',
      scores: ['-', 16, '-', '-', '-'],
    },
  ],

  // Situación final
  finalStatus: ['APROBADO', 'APROBADO', 'APROBADO', 'APROBADO', 'APROBADO'],

  // Información del certificado
  certificateNumber: '04033529',
  virtualCode: '39DE9B1F',

  // Información de emisión
  emissionDate: 'ACORA, 30 de diciembre del 2022',
  emissionTime: '20:20:52',

  // Información del director
  directorName: 'LEANDRO FLORENTINO HUANACUNI CUSI',
  directorTitle: 'Director',

  // Ubicación
  location: 'ACORA',
};

// Generar el certificado
async function generateExample() {
  console.log('Generando certificado oficial de estudios...');

  const pdfService = new PDFCertificateService();

  try {
    const pdfBuffer = await pdfService.generateCertificate(exampleData, {
      outputPath: './certificado_generado.pdf',
      qrEnabled: true,
    });

    // Generar hash SHA-256 para verificación de integridad
    const hash = PDFCertificateService.generateHash(pdfBuffer);

    console.log('✓ Certificado generado exitosamente!');
    console.log(`  Archivo: certificado_generado.pdf`);
    console.log(`  Tamaño: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`  Hash SHA-256: ${hash}`);
    console.log(`  Código virtual: ${exampleData.virtualCode}`);
    console.log(`  N° Certificado: ${exampleData.certificateNumber}`);
  } catch (error) {
    console.error('Error al generar el certificado:', error);
    process.exit(1);
  }
}

// Ejecutar ejemplo
generateExample();
