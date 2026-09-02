export const gatewayConfig = {
  port: Number(process.env.PORT) || 8000,
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    workOrder: process.env.WORK_ORDER_SERVICE_URL || 'http://localhost:8002',
    dispatch: process.env.DISPATCH_SERVICE_URL || 'http://localhost:8003',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:8004',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005'
  }
};
