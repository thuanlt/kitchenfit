import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RegisterStoreDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<import("./dto").AuthResponseDto>;
    getCurrentUser(req: {
        user: JwtPayload;
    }): Promise<{
        success: boolean;
        data: {
            store: import("./entities/store.entity").Store;
            staff: import("./entities/staff.entity").Staff;
        };
    }>;
    registerStore(req: {
        user: JwtPayload;
    }, dto: RegisterStoreDto): Promise<{
        success: boolean;
        data: import("./entities/store.entity").Store;
    }>;
    refreshToken(refreshToken: string): Promise<import("./dto").AuthResponseDto>;
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
}
