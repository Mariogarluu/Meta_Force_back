import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import xss from 'xss';

/**
 * Middleware para sanitizar inputs y prevenir XSS.
 * Limpia body, query y params de scripts maliciosos.
 */
export function xssSanitizer(req: Request, res: Response, next: NextFunction) {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
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
