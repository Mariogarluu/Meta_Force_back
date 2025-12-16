import multer from 'multer';
import type { Request } from 'express';

/**
 * Configuración de Multer para manejar la subida de archivos.
 * Solo acepta imágenes (jpeg, jpg, png, gif, webp) y PDFs con un tamaño máximo de 2MB por archivo.
 */
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf' // PDFs para tickets
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF, WEBP) y PDFs'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB máximo por archivo
  }
});

