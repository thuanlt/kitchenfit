import {











  
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RegisterStoreDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtPayload } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /v1/auth/send-otp
   * Gửi OTP đến số điện thoại
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  /**
   * POST /v1/auth/verify-otp
   * Xác thực OTP, trả về JWT tokens
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /**
   * GET /v1/auth/me
   * Lấy thông tin user hiện tại
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: { user: JwtPayload }) {
    return this.authService.getCurrentUser(req.user.sub);
  }

  /**
   * PATCH /v1/auth/register-store
   * Cập nhật thông tin quán (cho user mới)
   */
  @Patch('register-store')
  @UseGuards(JwtAuthGuard)
  async registerStore(
    @Request() req: { user: JwtPayload },
    @Body() dto: RegisterStoreDto,
  ) {
    return this.authService.registerStore(req.user.storeId, dto);
  }

  /**
   * POST /v1/auth/refresh
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * POST /v1/auth/logout
   * Đăng xuất
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }
}