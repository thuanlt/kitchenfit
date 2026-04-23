import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})\b$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;
}