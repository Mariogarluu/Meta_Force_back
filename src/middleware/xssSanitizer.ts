import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import xss from 'xss';

/**
 * Middleware para sanitizar inputs y prevenir XSS.
 * Limpia body, query y params de scripts maliciosos.
 * Nota: Mutamos en lugar de reasignar porque en Vercel req.query es de solo lectura (getter).
 */
export function xssSanitizer(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.body && typeof req.body === 'object') sanitizeInPlace(req.body);
        if (req.query && typeof req.query === 'object') sanitizeInPlace(req.query);
        if (req.params && typeof req.params === 'object') sanitizeInPlace(req.params);
    } catch (_) {
        // Si falla (ej. props congeladas en Vercel), continuar sin romper la request
    }
    next();
}

function sanitizeInPlace(data: any): void {
    if (typeof data === 'string') return; // strings: xss modifica, no reasignamos
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) data[i] = sanitize(data[i]);
        return;
    }
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach((key) => {
            data[key] = sanitize(data[key]);
        });
    }
}

function sanitize(data: any): any {
    if (typeof data === 'string') {
        return xss(data);
    }
    if (Array.isArray(data)) {
        return data.map(sanitize);
    }
    if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach((key) => {
            data[key] = sanitize(data[key]);
        });
    }
    return data;
}
