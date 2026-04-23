import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { Staff } from './entities/staff.entity';
import { SendOtpDto, VerifyOtpDto, RegisterStoreDto } from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AUTH_CONSTANTS } from './constants';
import * as crypto from 'crypto';
import axios from 'axios';

// Simple in-memory OTP storage (for production, use Redis)
interface OtpData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const otpStorage = new Map<string, OtpData>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate OTP
   */
  private generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Send OTP via Zalo SMS
   */
  private async sendZaloOtp(phone: string, otp: string): Promise<void> {
    try {
      // For development, log OTP to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
        return;
      }

      // Production: Send via Zalo SMS API
      const accessToken = process.env.ZALO_ACCESS_TOKEN;
      const templateId = AUTH_CONSTANTS.ZALO_TEMPLATE_ID;

      if (!accessToken || !templateId) {
        throw new Error('Zalo SMS not configured');
      }

      await axios.post(
        AUTH_CONSTANTS.ZALO_SMS_API_URL,
        {
          phone: phone.replace(/^0/, '84'), // Convert 090xxx to 8490xxx
          template_id: templateId,
          template_data: {
            otp: otp,
          },
        },
        {
          headers: {
            'access_token': accessToken,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Error sending Zalo OTP:', error.message);
      // In production, you might want to retry or use fallback SMS provider
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOtp(dto: SendOtpDto): Promise<{ success: boolean; message: string }> {
    const { phone } = dto;

    // Check if phone exists in system
    const existingStore = await this.storeRepository.findOne({ where: { phone } });
    const isExistingUser = !!existingStore;

    // Generate and store OTP
    const otp = this.generateOtp();
    const expiresAt = Date.now() + AUTH_CONSTANTS.OTP_EXPIRES_IN * 1000;

    otpStorage.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    // Send OTP
    await this.sendZaloOtp(phone, otp);

    return {
      success: true,
      message: isExistingUser 
        ? 'OTP đã được gửi đến số điện thoại của bạn' 
        : 'OTP đã được gửi. Hãy đăng ký quán của bạn.',
    };
  }

  /**
   * Verify OTP and generate JWT tokens
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const { phone, otp } = dto;

    // Check OTP
    const storedOtp = otpStorage.get(phone);

    if (!storedOtp) {
      throw new BadRequestException('OTP không tồn tại hoặc đã hết hạn');
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStorage.delete(phone);
      throw new BadRequestException('OTP đã hết hạn. Vui lòng gửi lại.');
    }

    if (storedOtp.attempts >= 3) {
      otpStorage.delete(phone);
      throw new BadRequestException('Quá số lần thử. Vui lòng gửi lại OTP.');
    }

    if (storedOtp.otp !== otp) {
      storedOtp.attempts++;
      throw new BadRequestException('OTP không chính xác');
    }

    // OTP verified, remove from storage
    otpStorage.delete(phone);

    // Check if store exists
    let store = await this.storeRepository.findOne({ where: { phone } });
    let staff: Staff | null = null;
    let isNewUser = false;

    if (!store) {
      // New user - create store with default values
      isNewUser = true;
      store = this.storeRepository.create({
        phone,
        name: 'Quán mới', // Will be updated during registration
        plan: 'free',
      });
      await this.storeRepository.save(store);

      // Create owner staff record
      staff = this.staffRepository.create({
        store_id: store.id,
        phone,
        name: 'Chủ quán',
        role: 'owner',
      });
      await this.staffRepository.save(staff);
    } else {
      // Existing user - get staff record
      staff = await this.staffRepository.findOne({
        where: { store_id: store.id, phone },
      });

      if (!staff) {
        throw new NotFoundException('Không tìm thấy thông tin nhân viên');
      }
    }

    // Generate JWT tokens
    const payload = {
      sub: staff.id,
      storeId: store.id,
      phone,
      role: staff.role,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.JWT_REFRESH_EXPIRES_IN,
    });

    return {
      success: true,
      data: {
        access_token,
        refresh_token,
        expires_in: 86400, // 24 hours
        store: {
          id: store.id,
          name: store.name,
          phone: store.phone,
          plan: store.plan,
        },
        staff: {
          id: staff.id,
          name: staff.name,
          role: staff.role,
        },
        is_new_user: isNewUser,
      },
    };
  }

  /**
   * Register/Update store information
   */
  async registerStore(
    storeId: string,
    dto: RegisterStoreDto,
  ): Promise<{ success: boolean; data: Store }> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });

    if (!store) {
      throw new NotFoundException('Không tìm thấy quán');
    }

    // Update store
    Object.assign(store, dto);
    await this.storeRepository.save(store);

    // Update owner name in staff if provided
    if (dto.owner_name) {
      await this.staffRepository.update(
        { store_id: storeId, role: 'owner' },
        { name: dto.owner_name },
      );
    }

    return {
      success: true,
      data: store,
    };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(staffId: string): Promise<{
    success: boolean;
    data: { store: Store; staff: Staff };
  }> {
    const staff = await this.staffRepository.findOne({
      where: { id: staffId },
      relations: ['store'],
    });

    if (!staff) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      data: {
        store: staff.store,
        staff,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const staff = await this.staffRepository.findOne({
        where: { id: payload.sub },
        relations: ['store'],
      });

      if (!staff) {
        throw new BadRequestException('Refresh token không hợp lệ');
      }

      const newPayload = {
        sub: staff.id,
        storeId: staff.store.id,
        phone: staff.phone,
        role: staff.role,
      };

      const access_token = this.jwtService.sign(newPayload);
      const new_refresh_token = this.jwtService.sign(newPayload, {
        expiresIn: AUTH_CONSTANTS.JWT_REFRESH_EXPIRES_IN,
      });

      return {
        success: true,
        data: {
          access_token,
          refresh_token: new_refresh_token,
          expires_in: 86400,
          store: {
            id: staff.store.id,
            name: staff.store.name,
            phone: staff.store.phone,
            plan: staff.store.plan,
          },
          staff: {
            id: staff.id,
            name: staff.name,
            role: staff.role,
          },
        },
      };
    } catch (error) {
      throw new BadRequestException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Logout (invalidate token)
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    // In production, add token to blacklist (Redis)
    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }
}