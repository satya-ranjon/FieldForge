import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../src/pipes/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive()
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(testSchema);
  });

  describe('transform()', () => {
    it('returns parsed data for a valid payload', () => {
      const result = pipe.transform(
        { name: 'Alice', age: 30 },
        { type: 'body', metatype: Object, data: '' }
      );
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('strips unknown keys according to schema defaults', () => {
      const result = pipe.transform(
        { name: 'Bob', age: 25, extra: 'ignored' },
        { type: 'body', metatype: Object, data: '' }
      );
      // Zod strips unrecognized keys by default
      expect(result).toEqual({ name: 'Bob', age: 25 });
    });

    it('throws BadRequestException with validation errors for invalid payload', () => {
      expect(() =>
        pipe.transform({ name: '', age: -1 }, { type: 'body', metatype: Object, data: '' })
      ).toThrow(BadRequestException);

      try {
        pipe.transform({ name: '', age: -1 }, { type: 'body', metatype: Object, data: '' });
      } catch (e) {
        const response = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(response).toHaveProperty('message', 'Validation failed');
        expect(response).toHaveProperty('errors');
        expect(Array.isArray(response.errors)).toBe(true);
        expect((response.errors as unknown[]).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('throws BadRequestException when required fields are missing', () => {
      expect(() => pipe.transform({}, { type: 'body', metatype: Object, data: '' })).toThrow(
        BadRequestException
      );
    });

    it('passes through value untouched for non-body/query/param metadata types', () => {
      const rawValue = { arbitrary: 'data' };
      const result = pipe.transform(rawValue, {
        type: 'custom' as never,
        metatype: Object,
        data: ''
      });
      expect(result).toBe(rawValue);
    });

    it('validates when metadata is undefined (used as parameter pipe)', () => {
      const result = pipe.transform({ name: 'Eve', age: 22 });
      expect(result).toEqual({ name: 'Eve', age: 22 });
    });

    it('validates query parameters', () => {
      const querySchema = z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20)
      });
      const queryPipe = new ZodValidationPipe(querySchema);

      const result = queryPipe.transform(
        { page: '3', limit: '50' },
        { type: 'query', metatype: Object, data: '' }
      );
      expect(result).toEqual({ page: 3, limit: 50 });
    });
  });

  describe('static validate()', () => {
    it('returns parsed data for valid input', () => {
      const result = ZodValidationPipe.validate(testSchema, { name: 'Charlie', age: 40 });
      expect(result).toEqual({ name: 'Charlie', age: 40 });
    });

    it('throws BadRequestException with structured errors for invalid input', () => {
      expect(() =>
        ZodValidationPipe.validate(testSchema, { name: 123, age: 'not-a-number' })
      ).toThrow(BadRequestException);

      try {
        ZodValidationPipe.validate(testSchema, { name: 123, age: 'not-a-number' });
      } catch (e) {
        const response = (e as BadRequestException).getResponse() as Record<string, unknown>;
        expect(response.message).toBe('Validation failed');
        expect(Array.isArray(response.errors)).toBe(true);
        expect((response.errors as unknown[]).length).toBe(2);
      }
    });

    it('can be used for merging route params with body before validation', () => {
      const bidSchema = z.object({
        workOrderId: z.string().uuid(),
        amount: z.number().positive()
      });

      const workOrderId = 'a1111111-1111-4111-8111-111111111111';
      const body = { amount: 500 };

      const result = ZodValidationPipe.validate(bidSchema, { ...body, workOrderId });
      expect(result).toEqual({ workOrderId, amount: 500 });
    });
  });
});
