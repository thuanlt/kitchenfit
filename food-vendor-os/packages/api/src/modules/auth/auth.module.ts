import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Store } from './entities/store.entity';
import { Staff } from './entities/staff.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AUTH_CONSTANTS } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, Staff]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: AUTH_CONSTANTS.JWT_SECRET,
      signOptions: {
        expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}