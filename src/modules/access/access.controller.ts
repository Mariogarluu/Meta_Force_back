import type { Request, Response } from 'express';
import { processQRCode } from './access.service.js';
import { Role } from '../../types/role.js';

/**
 * Controlador para procesar un código QR escaneado y registrar entrada o salida.
 * Valida que el QR no haya expirado (máximo 20 minutos) y determina automáticamente
 * si el usuario está entrando o saliendo según su estado actual.
 * 
 * Solo accesible para SUPERADMIN y ADMIN_CENTER.
 * 
 * @param req - Request con los datos del QR en req.body y el usuario autenticado en req.user
 * @param res - Response con el resultado de la operación (entry/exit) y datos del usuario
 */
export async function scanQRCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { qrData, centerId } = req.body;

    if (!qrData || !qrData.id || !qrData.timestamp) {
      return res.status(400).json({ message: 'Datos del QR inválidos' });
    }

    if (!centerId) {
      return res.status(400).json({ message: 'ID del centro requerido' });
    }

    // Validar que el usuario tenga acceso a este centro
    if (req.user.role === Role.ADMIN_CENTER) {
      if (req.user.centerId !== centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este centro' });
      }
    }

    const result = await processQRCode(qrData, centerId);

    res.json({
      success: true,
      type: result.type,
      message: result.type === 'entry' 
        ? `Entrada registrada para ${result.user?.name}` 
        : `Salida registrada para ${result.user?.name}`,
      user: result.user
    });
  } catch (error: any) {
    if (error.message.includes('expirado')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('ya está registrado')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Error al procesar el código QR' });
  }
}

