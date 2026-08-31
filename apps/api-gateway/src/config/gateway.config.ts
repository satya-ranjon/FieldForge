export const gatewayConfig = {
  port: Number(process.env.PORT) || 3000,
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    workOrder: process.env.WORK_ORDER_SERVICE_URL || 'http://localhost:3002',
    dispatch: process.env.DISPATCH_SERVICE_URL || 'http://localhost:3003',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:3004',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
  }
};
