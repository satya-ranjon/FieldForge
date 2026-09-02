export const gatewayConfig = {
  port: Number(process.env.PORT) || 5000,
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    workOrder: process.env.WORK_ORDER_SERVICE_URL || 'http://localhost:5002',
    dispatch: process.env.DISPATCH_SERVICE_URL || 'http://localhost:5003',
    billing: process.env.BILLING_SERVICE_URL || 'http://localhost:5004',
    notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005'
  }
};
