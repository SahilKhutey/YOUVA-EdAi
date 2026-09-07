import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ProductionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProductionExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<Request & {
      requestId?: string;
    }>();

    const response = context.getResponse<Response>();

    const requestId = request.requestId || 'unknown-req';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();

      if (status < 500) {
        message =
          typeof payload === 'string'
            ? payload
            : (payload as any).message || 'Request failed validation or authorization.';
      } else {
        message = 'An unexpected server error occurred.';
      }
    }

    // Operational logging with structured format, without leaking PII or raw stacks to client
    this.logger.error({
      requestId,
      method: request.method,
      path: request.originalUrl,
      status,
      error:
        exception instanceof Error
          ? exception.message
          : String(exception),
    });

    response.status(status).json({
      statusCode: status,
      message,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
