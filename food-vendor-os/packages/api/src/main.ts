import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3001', // Web app
      'http://localhost:19006', // React Native Expo
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,           // Auto-transform types
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));
        throw new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: messages,
          },
        });
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Food Vendor OS API running on http://localhost:${port}`);
  logger.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📚 API docs: http://localhost:${port}/v1`);
}

bootstrap();