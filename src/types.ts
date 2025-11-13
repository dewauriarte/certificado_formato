/**
 * Interfaces y tipos para el generador de certificados oficiales
 */

export interface StudentData {
  fullName: string;
  dni: string;
  grades: string[]; // Ej: ["PRIMER", "SEGUNDO", "TERCER", "CUARTO", "QUINTO"]
  educationLevel: string; // Ej: "EDUCACIÓN SECUNDARIA"
  educationType: string; // Ej: "EBR"
}

export interface YearData {
  year: number;
  grade: string; // Ej: "1.°", "2.°", etc.
  moduleCode: string; // Código modular de la IE
}

export interface GradeEntry {
  area: string; // Nombre del área curricular
  scores: (number | string)[]; // Notas por año (puede ser número, "AD", "-", etc.)
}

export interface TransversalCompetence {
  competence: string;
  scores: (number | string)[];
}

export interface CertificateData {
  // Información del estudiante
  student: StudentData;

  // Información de años lectivos
  years: YearData[];

  // Áreas curriculares con notas
  curricularAreas: GradeEntry[];

  // Competencias transversales
  transversalCompetences: TransversalCompetence[];

  // Situación final por año
  finalStatus: string[]; // Ej: ["APROBADO", "APROBADO", ...]

  // Información del certificado
  certificateNumber: string;
  virtualCode: string;

  // Información de emisión
  emissionDate: string; // Ej: "ACORA, 30 de diciembre del 2022"
  emissionTime: string; // Ej: "20:20:52"

  // Información del director
  directorName: string;
  directorTitle: string; // Ej: "Director"

  // Ubicación de la institución
  location: string; // Ej: "ACORA"
}

export interface PDFGenerationOptions {
  outputPath?: string;
  hashEnabled?: boolean; // Para generar hash SHA-256
  qrEnabled?: boolean; // Para incluir código QR
  verificationUrl?: string; // URL base para verificación
}
