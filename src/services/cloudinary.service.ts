import { cloudinary } from '../config/cloudinary.js';

/**
 * Servicio para gestionar operaciones con Cloudinary.
 * Maneja la subida y eliminación de imágenes de perfil de usuario.
 */
export class CloudinaryService {
  /**
   * Sube una imagen a Cloudinary y retorna la URL pública.
   * @param fileBuffer - Buffer de la imagen a subir
   * @param userId - ID del usuario para nombrar la imagen
   * @returns URL pública de la imagen subida
   */
  static async uploadProfileImage(fileBuffer: Buffer, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'meta-force/profiles',
          public_id: `profile_${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Error subiendo imagen a Cloudinary: ${error.message || 'Error desconocido'}`));
          } else if (result && result.secure_url) {
            resolve(result.secure_url);
          } else {
            reject(new Error('Error desconocido al subir imagen'));
          }
        }
      );

      // Escribir el buffer directamente en el stream usando el método end
      if (uploadStream && typeof (uploadStream as any).end === 'function') {
        (uploadStream as any).end(fileBuffer);
      } else {
        // Fallback: intentar escribir directamente
        (uploadStream as any).write(fileBuffer);
        (uploadStream as any).end();
      }
    });
  }

  /**
   * Elimina una imagen de Cloudinary usando su URL pública.
   * Extrae el public_id de la URL antes de eliminar.
   * @param imageUrl - URL pública de la imagen a eliminar
   * @returns true si se eliminó correctamente
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || imageUrl.includes('fauno.png')) {
        return true;
      }

      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) {
        return false;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error eliminando imagen de Cloudinary:', error);
      return false;
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary.
   * Las URLs de Cloudinary tienen el formato: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
   * @param url - URL de Cloudinary
   * @returns public_id completo (incluyendo la carpeta) o null si no se puede extraer
   */
  private static extractPublicId(url: string): string | null {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (error) {
      console.error('Error extrayendo public_id:', error);
      return null;
    }
  }
}
