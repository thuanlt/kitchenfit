import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})\b$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải có 6 ký tự' })
  otp: string;
}