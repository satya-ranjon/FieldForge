import type { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { Injectable, BadRequestException } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

/**
 * Reusable NestJS PipeTransform for validating incoming request payloads
 * (body, query, param) against Zod schemas. Throws a standardized
 * BadRequestException containing the schema validation errors.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  /**
   * Programmatic validation helper when request parameters are merged before validation
   * (e.g., merging route params and request body).
   */
  static validate<T = unknown>(schema: ZodTypeAny, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.issues
      });
    }
    return result.data as T;
  }

  transform(value: unknown, metadata?: ArgumentMetadata): unknown {
    if (
      metadata?.type &&
      metadata.type !== 'body' &&
      metadata.type !== 'query' &&
      metadata.type !== 'param'
    ) {
      return value;
    }

    return ZodValidationPipe.validate(this.schema, value);
  }
}
