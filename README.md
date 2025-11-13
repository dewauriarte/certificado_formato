# Generador de Certificados Oficiales de Estudios

Sistema profesional para generar certificados oficiales de estudios en formato PDF, replicando exactamente el diseño del Ministerio de Educación de Perú.

## Características

- **Diseño oficial**: Replica exactamente el formato del certificado oficial del MINEDU
- **Formato A4**: Tamaño estándar con márgenes precisos
- **Código QR**: Genera códigos QR para verificación de autenticidad
- **Hash SHA-256**: Genera hash para verificación de integridad del documento
- **TypeScript**: Código completamente tipado para mayor seguridad
- **PDFKit**: Utiliza la biblioteca PDFKit v0.17.2 para generación de PDFs
- **Personalizable**: Fácil de adaptar para diferentes instituciones educativas

## Tecnologías

- **pdfkit**: ^0.17.2 - Generación de documentos PDF
- **qrcode**: ^1.5.4 - Generación de códigos QR
- **TypeScript**: ^5.3.3 - Tipado estático
- **Node.js**: Runtime de JavaScript

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd certificado_formato

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

## Uso

### Generar un certificado de ejemplo

```bash
npm run generate
```

Este comando generará un archivo `certificado_generado.pdf` con datos de ejemplo.

### Uso programático

```typescript
import { PDFCertificateService, CertificateData } from './src';

const certificateData: CertificateData = {
  student: {
    fullName: 'JUAN PÉREZ GARCÍA',
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
    // ... más áreas
  ],
  transversalCompetences: [
    {
      competence: 'GESTIONA SU APRENDIZAJE DE MANERA AUTÓNOMA',
      scores: [16, 17, 18, 17, 18],
    },
  ],
  finalStatus: ['APROBADO', 'APROBADO', 'APROBADO', 'APROBADO', 'APROBADO'],
  certificateNumber: '04033529',
  virtualCode: '39DE9B1F',
  emissionDate: 'LIMA, 30 de diciembre del 2023',
  emissionTime: '20:20:52',
  directorName: 'NOMBRE DEL DIRECTOR',
  directorTitle: 'Director',
  location: 'LIMA',
};

const pdfService = new PDFCertificateService();

const pdfBuffer = await pdfService.generateCertificate(certificateData, {
  outputPath: './mi_certificado.pdf',
  qrEnabled: true,
});

// Generar hash para verificación
const hash = PDFCertificateService.generateHash(pdfBuffer);
console.log('Hash SHA-256:', hash);
```

## Estructura del Proyecto

```
certificado_formato/
├── src/
│   ├── types.ts           # Interfaces y tipos TypeScript
│   ├── pdf.service.ts     # Servicio principal de generación PDF
│   ├── example.ts         # Ejemplo de uso
│   └── index.ts           # Exportaciones principales
├── CERTFICADO.pdf         # Certificado de ejemplo/referencia
├── package.json
├── tsconfig.json
└── README.md
```

## Características del Certificado

### Encabezado
- Logo del Ministerio de Educación (PERÚ)
- Título: "CERTIFICADO OFICIAL DE ESTUDIOS"
- Nivel: "NIVEL SECUNDARIA"
- Tipo: "EDUCACIÓN BÁSICA REGULAR"
- Código virtual (esquina superior derecha)
- Número de certificado

### Cuerpo
- Datos del estudiante (nombre completo, DNI)
- Tabla de notas consolidadas:
  - Años lectivos
  - Grados cursados
  - Códigos modulares de la IE
  - Áreas curriculares con calificaciones
  - Competencias transversales
  - Situación final por año

### Pie de Página
- Código QR de verificación (esquina inferior izquierda)
- Texto legal sobre validez del certificado
- Fecha y hora de emisión
- Nombre y cargo del director/funcionario responsable
- Número de certificado (repetido)

## Scripts Disponibles

- `npm run build` - Compila TypeScript a JavaScript
- `npm run dev` - Ejecuta en modo desarrollo
- `npm run generate` - Genera un certificado de ejemplo
- `npm start` - Ejecuta el archivo compilado

## Configuración

El certificado utiliza las siguientes medidas:

- **Tamaño**: A4 (595.28 x 841.89 puntos)
- **Márgenes**:
  - Superior: 40pt
  - Inferior: 50pt
  - Izquierdo: 50pt
  - Derecho: 50pt

## Consideraciones de Seguridad

1. **Hash SHA-256**: Cada certificado puede generar un hash único para verificar su integridad
2. **Código QR**: Incluye datos del certificado para verificación rápida
3. **Código Virtual**: Identificador único en el encabezado
4. **Número de Certificado**: Aparece dos veces (encabezado y pie)

## Integración con Sistemas

Este servicio puede integrarse fácilmente con:

- APIs REST (Express, NestJS, etc.)
- Sistemas de gestión educativa
- Bases de datos (MongoDB, PostgreSQL, MySQL)
- Servicios en la nube (AWS S3, Google Cloud Storage)

### Ejemplo de integración con Express:

```typescript
import express from 'express';
import { PDFCertificateService } from './pdf.service';

const app = express();
app.use(express.json());

app.post('/api/certificados/generar', async (req, res) => {
  try {
    const pdfService = new PDFCertificateService();
    const pdfBuffer = await pdfService.generateCertificate(req.body);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificado.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar certificado' });
  }
});

app.listen(3000);
```

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias o mejoras.

## Soporte

Para preguntas o problemas, por favor abre un issue en el repositorio.
