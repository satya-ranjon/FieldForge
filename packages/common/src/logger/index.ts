import pino from 'pino';

export const createLogger = (serviceName: string) => {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: [
        'authorization',
        'headers.authorization',
        'req.headers.authorization',
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'phoneNumber',
        'phone_number',
        'email'
      ],
      censor: '[REDACTED]'
    },
    formatters: {
      level: (label) => ({ level: label })
    },
    timestamp: pino.stdTimeFunctions.isoTime
  });
};
