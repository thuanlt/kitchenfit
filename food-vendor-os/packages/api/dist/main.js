"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('v1');
    app.enableCors({
        origin: [
            'http://localhost:3001',
            'http://localhost:19006',
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
        exceptionFactory: (errors) => {
            const messages = errors.map((err) => ({
                field: err.property,
                errors: Object.values(err.constraints || {}),
            }));
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Dữ liệu không hợp lệ',
                    details: messages,
                },
            });
        },
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 Food Vendor OS API running on http://localhost:${port}`);
    logger.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`📚 API docs: http://localhost:${port}/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map