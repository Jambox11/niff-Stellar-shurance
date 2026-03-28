import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse() as any;

      // Handle validation errors consistently (RFC7807-inspired)
      if (status === HttpStatus.BAD_REQUEST && response?.message && Array.isArray(response.message)) {
        const validationErrors = response.message as ValidationError[];
        const violations = this.extractViolations(validationErrors);

        body = {
          statusCode: status,
          error: {
            type: 'https://datatracker.ietf.org/doc/html/rfc7807#section-3.1',
            code: 'VALIDATION_ERROR',
            title: 'One or more validation errors occurred.',
            violations,
          },
          timestamp: new Date().toISOString(),
          path: req.url,
        };
      } else if (status === HttpStatus.BAD_REQUEST) {
        // Generic bad request
        body.message = Array.isArray(response.message) ? response.message[0] : response.message || 'Bad Request';
        body.statusCode = status;
      } else {
        // Other HTTP exceptions (401, 403, etc.)
        body.message = Array.isArray(response.message) ? response.message[0] : response.message || 'Error';
        body.statusCode = status;
      }
    }

    response.status(status).json(body);
  }

  private extractViolations(errors: ValidationError[], prefix = ''): any[] {
    const violations: any[] = [];

    for (const error of errors) {
      if (error.constraints) {
        for (const [constraintName, reason] of Object.entries(error.constraints)) {
          violations.push({
            field: prefix ? `${prefix}.${error.property}` : error.property,
            code: constraintName,
            reason,
          });
        }
      }

      if (error.children && error.children.length > 0) {
        violations.push(...this.extractViolations(error.children, error.property));
      }
    }

    return violations;
  }
}

