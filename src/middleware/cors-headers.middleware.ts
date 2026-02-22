import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsHeadersMiddleware implements NestMiddleware {
  private allowedOrigins = [
    'http://localhost:5180',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5180',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // ✅ Autoriser les origines listées
    if (this.allowedOrigins.includes(origin || '')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // 📋 Headers autorisés
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );

    // ✅ Méthodes autorisées
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );

    // 📤 Headers exposés
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Type, Authorization, X-Total-Count, X-Page-Count'
    );

    // ⏱️ Cache les requêtes preflight
    res.setHeader('Access-Control-Max-Age', '86400');

    // ✅ Répondre aux requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  }
}
