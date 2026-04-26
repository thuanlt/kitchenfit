"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_CONSTANTS = void 0;
exports.AUTH_CONSTANTS = {
    OTP_LENGTH: 6,
    OTP_EXPIRES_IN: 300,
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ZALO_SMS_API_URL: 'https://business.openapi.zalo.me/message/template',
    ZALO_TEMPLATE_ID: process.env.ZALO_OTP_TEMPLATE_ID || '',
    ROLES: {
        OWNER: 'owner',
        MANAGER: 'manager',
        STAFF: 'staff',
    },
};
//# sourceMappingURL=constants.js.map