import { v2 as cloudinary } from 'cloudinary';

/**
 * Configuración de Cloudinary para el manejo de imágenes.
 * Requiere las siguientes variables de entorno:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

export { cloudinary };

