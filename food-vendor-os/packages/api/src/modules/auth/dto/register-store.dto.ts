import { IsNotEmpty, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { AUTH_CONSTANTS } from '../constants';

export class RegisterStoreDto {
  @IsNotEmpty({ message: 'Tên quán không được để trống' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  owner_name?: string;

  @IsOptional()
  @IsEnum(['free', 'basic', 'pro', 'chain'])
  plan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  store_type?: string; // cơm, phở, hủ tiếu, cafe...
}