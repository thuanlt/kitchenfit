export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRES_IN: 300, // 5 minutes
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Zalo SMS config
  ZALO_SMS_API_URL: 'https://business.openapi.zalo.me/message/template',
  ZALO_TEMPLATE_ID: process.env.ZALO_OTP_TEMPLATE_ID || '',
  
  // Roles
  ROLES: {
    OWNER: 'owner',
    MANAGER: 'manager',
    STAFF: 'staff',
  },
};