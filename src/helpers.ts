/**
 * Funciones auxiliares para el generador de certificados
 */

import { CertificateData } from './types';

/**
 * Genera un código virtual aleatorio de 8 caracteres hexadecimales
 */
export function generateVirtualCode(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join('');
}

/**
 * Genera un número de certificado secuencial
 */
export function generateCertificateNumber(lastNumber?: string): string {
  if (!lastNumber) {
    return '00000001';
  }
  const num = parseInt(lastNumber, 10) + 1;
  return num.toString().padStart(8, '0');
}

/**
 * Formatea la fecha de emisión en el formato del certificado
 * @param date - Fecha a formatear
 * @param location - Ubicación de emisión
 * @returns String formateado: "UBICACIÓN, DD de mes del YYYY"
 */
export function formatEmissionDate(date: Date, location: string): string {
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${location.toUpperCase()}, ${day} de ${month} del ${year}`;
}

/**
 * Formatea la hora de emisión en el formato HH:MM:SS
 */
export function formatEmissionTime(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

/**
 * Valida los datos del certificado antes de generar el PDF
 */
export function validateCertificateData(data: CertificateData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar datos del estudiante
  if (!data.student.fullName || data.student.fullName.trim() === '') {
    errors.push('El nombre del estudiante es requerido');
  }

  if (!data.student.dni || !/^\d{8}$/.test(data.student.dni)) {
    errors.push('El DNI debe tener 8 dígitos');
  }

  if (!data.student.grades || data.student.grades.length === 0) {
    errors.push('Debe especificar al menos un grado');
  }

  // Validar años
  if (!data.years || data.years.length === 0) {
    errors.push('Debe especificar al menos un año lectivo');
  }

  // Validar áreas curriculares
  if (!data.curricularAreas || data.curricularAreas.length === 0) {
    errors.push('Debe especificar al menos un área curricular');
  }

  // Validar que todas las áreas tengan el mismo número de calificaciones que años
  const numYears = data.years.length;
  data.curricularAreas?.forEach((area, index) => {
    if (area.scores.length !== numYears) {
      errors.push(
        `El área "${area.area}" debe tener ${numYears} calificaciones (tiene ${area.scores.length})`
      );
    }
  });

  // Validar competencias transversales
  data.transversalCompetences?.forEach((comp, index) => {
    if (comp.scores.length !== numYears) {
      errors.push(
        `La competencia "${comp.competence}" debe tener ${numYears} calificaciones (tiene ${comp.scores.length})`
      );
    }
  });

  // Validar situación final
  if (data.finalStatus.length !== numYears) {
    errors.push(
      `La situación final debe tener ${numYears} estados (tiene ${data.finalStatus.length})`
    );
  }

  // Validar código virtual
  if (!data.virtualCode || !/^[0-9A-F]{8}$/.test(data.virtualCode)) {
    errors.push('El código virtual debe tener 8 caracteres hexadecimales');
  }

  // Validar número de certificado
  if (!data.certificateNumber || !/^\d+$/.test(data.certificateNumber)) {
    errors.push('El número de certificado debe ser numérico');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convierte una calificación numérica a su representación en letras
 * según el sistema vigesimal peruano
 */
export function scoreToText(score: number): string {
  if (score >= 18 && score <= 20) return 'AD - Logro destacado';
  if (score >= 14 && score <= 17) return 'A - Logro esperado';
  if (score >= 11 && score <= 13) return 'B - En proceso';
  if (score >= 0 && score <= 10) return 'C - En inicio';
  return 'No válido';
}

/**
 * Genera un objeto CertificateData de ejemplo para pruebas
 */
export function generateSampleCertificate(): CertificateData {
  const now = new Date();

  return {
    student: {
      fullName: 'JUAN CARLOS PÉREZ GARCÍA',
      dni: '12345678',
      grades: ['PRIMER', 'SEGUNDO', 'TERCER', 'CUARTO', 'QUINTO'],
      educationLevel: 'EDUCACIÓN SECUNDARIA',
      educationType: 'EBR',
    },
    years: [
      { year: 2018, grade: '1.°', moduleCode: '0474494-0' },
      { year: 2019, grade: '2.°', moduleCode: '0474494-0' },
      { year: 2020, grade: '3.°', moduleCode: '0474494-0' },
      { year: 2021, grade: '4.°', moduleCode: '0474494-0' },
      { year: 2022, grade: '5.°', moduleCode: '0474494-0' },
    ],
    curricularAreas: [
      { area: 'MATEMÁTICA', scores: [16, 17, 18, 17, 18] },
      { area: 'COMUNICACIÓN', scores: [15, 16, 17, 16, 17] },
      { area: 'INGLÉS', scores: [16, 16, 17, 18, 18] },
      { area: 'ARTE Y CULTURA', scores: [17, 18, 18, 17, 18] },
      { area: 'CIENCIA Y TECNOLOGÍA', scores: [15, 16, 17, 16, 17] },
      { area: 'EDUCACIÓN FÍSICA', scores: [18, 18, 18, 18, 18] },
      { area: 'EDUCACIÓN RELIGIOSA', scores: [16, 17, 17, 17, 17] },
      { area: 'CIENCIAS SOCIALES', scores: [16, 16, 17, 17, 18] },
      { area: 'DESARROLLO PERSONAL, CIUDADANÍA Y CÍVICA', scores: [17, 17, 18, 18, 18] },
      { area: 'EDUCACIÓN PARA EL TRABAJO', scores: [16, 17, 17, 18, 18] },
    ],
    transversalCompetences: [
      {
        competence: 'GESTIONA SU APRENDIZAJE DE MANERA AUTÓNOMA',
        scores: [16, 17, 18, 17, 18],
      },
      {
        competence: 'SE DESENVUELVE EN ENTORNOS VIRTUALES GENERADOS POR LAS TIC',
        scores: [17, 17, 18, 18, 18],
      },
    ],
    finalStatus: ['APROBADO', 'APROBADO', 'APROBADO', 'APROBADO', 'APROBADO'],
    certificateNumber: generateCertificateNumber(),
    virtualCode: generateVirtualCode(),
    emissionDate: formatEmissionDate(now, 'LIMA'),
    emissionTime: formatEmissionTime(now),
    directorName: 'JUAN CARLOS DIRECTOR PÉREZ',
    directorTitle: 'Director',
    location: 'LIMA',
  };
}
