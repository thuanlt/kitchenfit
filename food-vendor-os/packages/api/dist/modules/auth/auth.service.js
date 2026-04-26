"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const store_entity_1 = require("./entities/store.entity");
const staff_entity_1 = require("./entities/staff.entity");
const constants_1 = require("./constants");
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const otpStorage = new Map();
let AuthService = class AuthService {
    constructor(storeRepository, staffRepository, jwtService) {
        this.storeRepository = storeRepository;
        this.staffRepository = staffRepository;
        this.jwtService = jwtService;
    }
    generateOtp() {
        const otp = crypto.randomInt(100000, 999999).toString();
        return otp;
    }
    async sendZaloOtp(phone, otp) {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log(`📱 [DEV MODE] OTP for ${phone}: ${otp}`);
                return;
            }
            const accessToken = process.env.ZALO_ACCESS_TOKEN;
            const templateId = constants_1.AUTH_CONSTANTS.ZALO_TEMPLATE_ID;
            if (!accessToken || !templateId) {
                throw new Error('Zalo SMS not configured');
            }
            await axios_1.default.post(constants_1.AUTH_CONSTANTS.ZALO_SMS_API_URL, {
                phone: phone.replace(/^0/, '84'),
                template_id: templateId,
                template_data: {
                    otp: otp,
                },
            }, {
                headers: {
                    'access_token': accessToken,
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (error) {
            console.error('Error sending Zalo OTP:', error.message);
        }
    }
    async sendOtp(dto) {
        const { phone } = dto;
        const existingStore = await this.storeRepository.findOne({ where: { phone } });
        const isExistingUser = !!existingStore;
        const otp = this.generateOtp();
        const expiresAt = Date.now() + constants_1.AUTH_CONSTANTS.OTP_EXPIRES_IN * 1000;
        otpStorage.set(phone, {
            otp,
            expiresAt,
            attempts: 0,
        });
        await this.sendZaloOtp(phone, otp);
        return {
            success: true,
            message: isExistingUser
                ? 'OTP đã được gửi đến số điện thoại của bạn'
                : 'OTP đã được gửi. Hãy đăng ký quán của bạn.',
        };
    }
    async verifyOtp(dto) {
        const { phone, otp } = dto;
        const storedOtp = otpStorage.get(phone);
        if (!storedOtp) {
            throw new common_1.BadRequestException('OTP không tồn tại hoặc đã hết hạn');
        }
        if (Date.now() > storedOtp.expiresAt) {
            otpStorage.delete(phone);
            throw new common_1.BadRequestException('OTP đã hết hạn. Vui lòng gửi lại.');
        }
        if (storedOtp.attempts >= 3) {
            otpStorage.delete(phone);
            throw new common_1.BadRequestException('Quá số lần thử. Vui lòng gửi lại OTP.');
        }
        if (storedOtp.otp !== otp) {
            storedOtp.attempts++;
            throw new common_1.BadRequestException('OTP không chính xác');
        }
        otpStorage.delete(phone);
        let store = await this.storeRepository.findOne({ where: { phone } });
        let staff = null;
        let isNewUser = false;
        if (!store) {
            isNewUser = true;
            store = this.storeRepository.create({
                phone,
                name: 'Quán mới',
                plan: 'free',
            });
            await this.storeRepository.save(store);
            staff = this.staffRepository.create({
                store_id: store.id,
                phone,
                name: 'Chủ quán',
                role: 'owner',
            });
            await this.staffRepository.save(staff);
        }
        else {
            staff = await this.staffRepository.findOne({
                where: { store_id: store.id, phone },
            });
            if (!staff) {
                throw new common_1.NotFoundException('Không tìm thấy thông tin nhân viên');
            }
        }
        const payload = {
            sub: staff.id,
            storeId: store.id,
            phone,
            role: staff.role,
        };
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, {
            expiresIn: constants_1.AUTH_CONSTANTS.JWT_REFRESH_EXPIRES_IN,
        });
        return {
            success: true,
            data: {
                access_token,
                refresh_token,
                expires_in: 86400,
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
    async registerStore(storeId, dto) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (!store) {
            throw new common_1.NotFoundException('Không tìm thấy quán');
        }
        Object.assign(store, dto);
        await this.storeRepository.save(store);
        if (dto.owner_name) {
            await this.staffRepository.update({ store_id: storeId, role: 'owner' }, { name: dto.owner_name });
        }
        return {
            success: true,
            data: store,
        };
    }
    async getCurrentUser(staffId) {
        const staff = await this.staffRepository.findOne({
            where: { id: staffId },
            relations: ['store'],
        });
        if (!staff) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng');
        }
        return {
            success: true,
            data: {
                store: staff.store,
                staff,
            },
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const staff = await this.staffRepository.findOne({
                where: { id: payload.sub },
                relations: ['store'],
            });
            if (!staff) {
                throw new common_1.BadRequestException('Refresh token không hợp lệ');
            }
            const newPayload = {
                sub: staff.id,
                storeId: staff.store.id,
                phone: staff.phone,
                role: staff.role,
            };
            const access_token = this.jwtService.sign(newPayload);
            const new_refresh_token = this.jwtService.sign(newPayload, {
                expiresIn: constants_1.AUTH_CONSTANTS.JWT_REFRESH_EXPIRES_IN,
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
        }
        catch (error) {
            throw new common_1.BadRequestException('Refresh token không hợp lệ hoặc đã hết hạn');
        }
    }
    async logout() {
        return {
            success: true,
            message: 'Đăng xuất thành công',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(store_entity_1.Store)),
    __param(1, (0, typeorm_1.InjectRepository)(staff_entity_1.Staff)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map