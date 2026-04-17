import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Servicio para gestionar operaciones con Supabase Storage.
 * Reemplaza a CloudinaryService para el almacenamiento de archivos.
 */
export class SupabaseStorageService {
  /**
   * Sube una imagen de perfil a Supabase Storage.
   * @param fileBuffer - Buffer de la imagen
   * @param userId - ID del usuario
   * @returns URL pública de la imagen
   */
  static async uploadProfileImage(fileBuffer: Buffer, userId: string): Promise<string> {
    const fileName = `profile_${userId}`;
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      logger.error('Error subiendo imagen a Supabase:', error);
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Elimina una imagen de un bucket.
   * @param imageUrl - URL completa del archivo
   * @param bucket - Nombre del bucket
   */
  static async deleteFile(imageUrl: string, bucket: string): Promise<boolean> {
    try {
      // Extraer el nombre del archivo de la URL
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        logger.error(`Error eliminando archivo ${fileName} de ${bucket}:`, error);
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error procesando eliminación de archivo:', error);
      return false;
    }
  }

  /**
   * Sube un adjunto para un ticket.
   */
  static async uploadTicketAttachment(fileBuffer: Buffer, fileName: string, ticketId: string): Promise<string> {
    const path = `${ticketId}/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from('tickets')
      .upload(path, fileBuffer, {
        upsert: true
      });

    if (error) {
      logger.error('Error subiendo adjunto a Supabase:', error);
      throw new Error(`Error subiendo adjunto: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tickets')
      .getPublicUrl(path);

    return publicUrl;
  }
}
