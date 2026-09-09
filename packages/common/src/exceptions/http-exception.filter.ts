import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ZodError } from 'zod';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: unknown;

    if (exception instanceof ZodError) {
      // ZodError thrown by raw schema.parse() calls that bypass ZodValidationPipe.
      // Map to 400 Bad Request instead of letting it fall through to 500.
      status = HttpStatus.BAD_REQUEST;
      message = { message: 'Validation failed', errors: exception.issues };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception instanceof Error ? exception.message : 'Internal server error';
    }

    const correlationId = request.headers['x-correlation-id'] || 'none';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      error: typeof message === 'object' ? message : { message }
    });
  }
}
