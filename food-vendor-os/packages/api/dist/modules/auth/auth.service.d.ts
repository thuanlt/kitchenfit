import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { Staff } from './entities/staff.entity';
import { SendOtpDto, VerifyOtpDto, RegisterStoreDto } from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';
export declare class AuthService {
    private readonly storeRepository;
    private readonly staffRepository;
    private readonly jwtService;
    constructor(storeRepository: Repository<Store>, staffRepository: Repository<Staff>, jwtService: JwtService);
    private generateOtp;
    private sendZaloOtp;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto>;
    registerStore(storeId: string, dto: RegisterStoreDto): Promise<{
        success: boolean;
        data: Store;
    }>;
    getCurrentUser(staffId: string): Promise<{
        success: boolean;
        data: {
            store: Store;
            staff: Staff;
        };
    }>;
    refreshToken(refreshToken: string): Promise<AuthResponseDto>;
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
}
