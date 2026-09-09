import {
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { ZodError } from 'zod';
import { GlobalHttpExceptionFilter } from '../src/exceptions/http-exception.filter';

describe('GlobalHttpExceptionFilter', () => {
  let filter: GlobalHttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: { status: jest.Mock };
  let mockRequest: { url: string; headers: Record<string, string> };
  let mockHost: {
    switchToHttp: () => {
      getResponse: () => typeof mockResponse;
      getRequest: () => typeof mockRequest;
    };
  };

  beforeEach(() => {
    filter = new GlobalHttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };
    mockRequest = {
      url: '/test/endpoint',
      headers: { 'x-correlation-id': 'corr-123' }
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest
      })
    };
  });

  it('handles standard HttpException (BadRequestException) with correct status', () => {
    const exception = new BadRequestException('Invalid input');

    filter.catch(exception, mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = mockJson.mock.calls[0]?.[0];
    expect(body.statusCode).toBe(400);
    expect(body.correlationId).toBe('corr-123');
    expect(body.path).toBe('/test/endpoint');
  });

  it('handles NotFoundException with 404 status', () => {
    const exception = new NotFoundException('Resource not found');

    filter.catch(exception, mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('handles ForbiddenException with 403 status', () => {
    const exception = new ForbiddenException('Access denied');

    filter.catch(exception, mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });

  it('catches ZodError and maps to HTTP 400 Bad Request with structured issues', () => {
    // Simulate a ZodError with issues
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['name'],
        message: 'Expected string, received number'
      },
      {
        code: 'too_small',
        minimum: 1,
        origin: 'number',
        inclusive: true,
        path: ['age'],
        message: 'Number must be greater than or equal to 1'
      }
    ]);

    filter.catch(zodError, mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = mockJson.mock.calls[0]?.[0];
    expect(body.statusCode).toBe(400);
    expect(body.error).toEqual({
      message: 'Validation failed',
      errors: zodError.issues
    });
    expect(body.correlationId).toBe('corr-123');
  });

  it('maps unknown Error to HTTP 500 with error message', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockJson.mock.calls[0]?.[0];
    expect(body.statusCode).toBe(500);
    expect(body.error).toEqual({ message: 'Something went wrong' });
  });

  it('maps non-Error unknown exception to HTTP 500 with default message', () => {
    filter.catch('string exception', mockHost as never);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockJson.mock.calls[0]?.[0];
    expect(body.statusCode).toBe(500);
    expect(body.error).toEqual({ message: 'Internal server error' });
  });

  it('uses "none" as correlationId when header is absent', () => {
    mockRequest.headers = {};

    filter.catch(new BadRequestException('test'), mockHost as never);

    const body = mockJson.mock.calls[0]?.[0];
    expect(body.correlationId).toBe('none');
  });

  it('includes timestamp and path in all responses', () => {
    filter.catch(new BadRequestException('test'), mockHost as never);

    const body = mockJson.mock.calls[0]?.[0];
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
    expect(body.path).toBe('/test/endpoint');
  });
});
