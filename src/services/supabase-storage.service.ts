import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Servicio para gestionar operaciones con Supabase Storage.
 * Almacenamiento de archivos en Supabase Storage (perfiles y tickets).
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
   * Ruta del objeto dentro del bucket a partir de una URL pública de Supabase Storage.
   * Ej.: .../object/public/tickets/<ticketId>/<archivo> → "<ticketId>/<archivo>"
   */
  static objectPathFromPublicUrl(imageUrl: string, bucket: string): string | null {
    const marker = `/object/public/${bucket}/`;
    const i = imageUrl.indexOf(marker);
    if (i !== -1) {
      const raw = imageUrl.slice(i + marker.length).split('?')[0] ?? '';
      const path = decodeURIComponent(raw).replace(/^\/+/, '');
      return path || null;
    }
    const parts = imageUrl.split('/');
    const last = parts[parts.length - 1] ?? '';
    return last ? decodeURIComponent(last) : null;
  }

  /**
   * Elimina un objeto en Storage (perfil plano o adjunto con subcarpetas).
   * @param imageUrl - URL pública completa del archivo
   * @param bucket - Nombre del bucket
   */
  static async deleteFile(imageUrl: string, bucket: string): Promise<boolean> {
    try {
      const objectPath = SupabaseStorageService.objectPathFromPublicUrl(imageUrl, bucket);
      if (!objectPath) return false;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([objectPath]);

      if (error) {
        logger.error(`Error eliminando archivo ${objectPath} de ${bucket}:`, error);
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
