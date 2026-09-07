import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithId,
    response: Response,
    next: NextFunction,
  ): void {
    const incoming = request.header('X-Request-ID');
    const requestId = incoming || randomUUID();

    request.requestId = requestId;

    response.setHeader('X-Request-ID', requestId);

    next();
  }
}
