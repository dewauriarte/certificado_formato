# Guía de Integración

Esta guía te ayudará a integrar el generador de certificados en diferentes sistemas y frameworks.

## Integración con NestJS

### 1. Instalar el paquete

```bash
npm install pdfkit qrcode
npm install --save-dev @types/pdfkit @types/qrcode
```

### 2. Crear un módulo de certificados

```typescript
// certificate/certificate.module.ts
import { Module } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';

@Module({
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [CertificateService],
})
export class CertificateModule {}
```

### 3. Crear el servicio

```typescript
// certificate/certificate.service.ts
import { Injectable } from '@nestjs/common';
import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';

@Injectable()
export class CertificateService {
  async generateCertificate(data: CertificateData): Promise<Buffer> {
    const pdfService = new PDFCertificateService();
    return await pdfService.generateCertificate(data, {
      qrEnabled: true,
    });
  }

  async generateAndSave(data: CertificateData, path: string): Promise<string> {
    const pdfService = new PDFCertificateService();
    const hash = PDFCertificateService.generateHash(
      await pdfService.generateCertificate(data, {
        outputPath: path,
        qrEnabled: true,
      })
    );
    return hash;
  }
}
```

### 4. Crear el controlador

```typescript
// certificate/certificate.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CertificateService } from './certificate.service';
import { CertificateData } from './types';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post('generate')
  async generateCertificate(
    @Body() data: CertificateData,
    @Res() res: Response
  ) {
    try {
      const pdfBuffer = await this.certificateService.generateCertificate(data);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=certificado_${data.certificateNumber}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error al generar el certificado',
        error: error.message,
      });
    }
  }

  @Post('generate-with-hash')
  async generateWithHash(@Body() data: CertificateData) {
    try {
      const pdfBuffer = await this.certificateService.generateCertificate(data);
      const hash = PDFCertificateService.generateHash(pdfBuffer);

      return {
        success: true,
        certificateNumber: data.certificateNumber,
        virtualCode: data.virtualCode,
        hash,
        size: pdfBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al generar el certificado',
        error: error.message,
      };
    }
  }
}
```

## Integración con Express

```typescript
import express from 'express';
import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';
import { validateCertificateData } from './helpers';

const app = express();
app.use(express.json());

// Endpoint para generar certificado
app.post('/api/certificados/generar', async (req, res) => {
  try {
    const data: CertificateData = req.body;

    // Validar datos
    const validation = validateCertificateData(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Generar PDF
    const pdfService = new PDFCertificateService();
    const pdfBuffer = await pdfService.generateCertificate(data, {
      qrEnabled: true,
    });

    // Generar hash
    const hash = PDFCertificateService.generateHash(pdfBuffer);

    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificado_${data.certificateNumber}.pdf`
    );
    res.setHeader('X-Certificate-Hash', hash);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar el certificado',
    });
  }
});

// Endpoint para verificar certificado por hash
app.post('/api/certificados/verificar', async (req, res) => {
  const { hash, certificateNumber } = req.body;

  // Aquí implementarías la lógica de verificación
  // comparando el hash con el almacenado en tu base de datos

  res.json({
    valid: true,
    certificateNumber,
    message: 'Certificado válido',
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
```

## Integración con MongoDB

```typescript
import mongoose from 'mongoose';

// Schema para almacenar certificados
const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true },
  virtualCode: { type: String, required: true, unique: true },
  studentDni: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  hash: { type: String, required: true },
  pdfUrl: { type: String }, // URL en S3 o similar
  emissionDate: { type: Date, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // Datos completos del certificado
  createdAt: { type: Date, default: Date.now },
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// Servicio para guardar certificado
async function saveCertificate(data: CertificateData, pdfBuffer: Buffer) {
  const hash = PDFCertificateService.generateHash(pdfBuffer);

  const certificate = new Certificate({
    certificateNumber: data.certificateNumber,
    virtualCode: data.virtualCode,
    studentDni: data.student.dni,
    studentName: data.student.fullName,
    hash,
    emissionDate: new Date(),
    data,
  });

  await certificate.save();
  return certificate;
}

// Servicio para verificar certificado
async function verifyCertificate(certificateNumber: string, hash: string) {
  const certificate = await Certificate.findOne({ certificateNumber });

  if (!certificate) {
    return { valid: false, message: 'Certificado no encontrado' };
  }

  if (certificate.hash !== hash) {
    return { valid: false, message: 'Hash inválido - certificado modificado' };
  }

  return {
    valid: true,
    message: 'Certificado válido',
    data: certificate,
  };
}
```

## Integración con AWS S3

```typescript
import AWS from 'aws-sdk';
import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadCertificateToS3(
  data: CertificateData,
  bucketName: string
): Promise<string> {
  // Generar PDF
  const pdfService = new PDFCertificateService();
  const pdfBuffer = await pdfService.generateCertificate(data, {
    qrEnabled: true,
  });

  // Generar hash
  const hash = PDFCertificateService.generateHash(pdfBuffer);

  // Subir a S3
  const fileName = `certificados/${data.certificateNumber}_${data.virtualCode}.pdf`;

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    Metadata: {
      certificateNumber: data.certificateNumber,
      virtualCode: data.virtualCode,
      hash: hash,
      studentDni: data.student.dni,
    },
  };

  const result = await s3.upload(params).promise();
  return result.Location; // URL del archivo
}

// Descargar certificado de S3
async function downloadCertificateFromS3(
  certificateNumber: string,
  virtualCode: string,
  bucketName: string
): Promise<Buffer> {
  const fileName = `certificados/${certificateNumber}_${virtualCode}.pdf`;

  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  const result = await s3.getObject(params).promise();
  return result.Body as Buffer;
}
```

## Integración con Cola de Trabajos (Bull/BullMQ)

```typescript
import Bull from 'bull';
import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';

// Crear cola
const certificateQueue = new Bull('certificate-generation', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// Procesar trabajos
certificateQueue.process(async (job) => {
  const data: CertificateData = job.data;

  console.log(`Generando certificado ${data.certificateNumber}...`);

  const pdfService = new PDFCertificateService();
  const pdfBuffer = await pdfService.generateCertificate(data, {
    qrEnabled: true,
  });

  const hash = PDFCertificateService.generateHash(pdfBuffer);

  // Aquí puedes guardar el PDF en S3, base de datos, etc.

  return {
    certificateNumber: data.certificateNumber,
    hash,
    size: pdfBuffer.length,
  };
});

// Agregar trabajo a la cola
async function queueCertificateGeneration(data: CertificateData) {
  const job = await certificateQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return job.id;
}

// Eventos
certificateQueue.on('completed', (job, result) => {
  console.log(`Certificado ${result.certificateNumber} generado exitosamente`);
});

certificateQueue.on('failed', (job, err) => {
  console.error(`Error al generar certificado:`, err);
});
```

## Ejemplo completo con validación y almacenamiento

```typescript
import { PDFCertificateService } from './pdf.service';
import { CertificateData } from './types';
import { validateCertificateData, generateVirtualCode, formatEmissionDate } from './helpers';

class CertificateManager {
  private pdfService: PDFCertificateService;

  constructor() {
    this.pdfService = new PDFCertificateService();
  }

  async create(data: Partial<CertificateData>): Promise<{
    success: boolean;
    certificateNumber?: string;
    hash?: string;
    pdfBuffer?: Buffer;
    errors?: string[];
  }> {
    // Completar datos faltantes
    const completeData: CertificateData = {
      ...data,
      virtualCode: data.virtualCode || generateVirtualCode(),
      emissionDate: data.emissionDate || formatEmissionDate(new Date(), data.location || 'LIMA'),
      emissionTime: data.emissionTime || new Date().toTimeString().split(' ')[0],
    } as CertificateData;

    // Validar
    const validation = validateCertificateData(completeData);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    try {
      // Generar PDF
      const pdfBuffer = await this.pdfService.generateCertificate(completeData, {
        qrEnabled: true,
      });

      // Generar hash
      const hash = PDFCertificateService.generateHash(pdfBuffer);

      // Aquí puedes guardar en BD, S3, etc.

      return {
        success: true,
        certificateNumber: completeData.certificateNumber,
        hash,
        pdfBuffer,
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  async verify(certificateNumber: string, hash: string): Promise<boolean> {
    // Implementar lógica de verificación
    // Comparar con hash almacenado en BD
    return true;
  }
}

export default CertificateManager;
```

## Variables de Entorno Recomendadas

Crea un archivo `.env`:

```env
# Base de datos
DATABASE_URL=mongodb://localhost:27017/certificates

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=certificates-bucket

# Redis (para colas)
REDIS_HOST=localhost
REDIS_PORT=6379

# Aplicación
PORT=3000
NODE_ENV=production

# URL de verificación de certificados
VERIFICATION_URL=https://tu-dominio.com/verificar
```

## Seguridad

1. **Validación de entrada**: Siempre valida los datos antes de generar certificados
2. **Rate limiting**: Implementa límites de tasa para prevenir abuso
3. **Autenticación**: Requiere autenticación para generar certificados
4. **Auditoría**: Registra todas las generaciones de certificados
5. **Firma digital**: Considera agregar firmas digitales para mayor seguridad

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  message: 'Demasiadas solicitudes desde esta IP',
});

app.use('/api/certificados/', limiter);
```
