"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const auth_service_1 = require("./auth.service");
const store_entity_1 = require("./entities/store.entity");
const staff_entity_1 = require("./entities/staff.entity");
const common_1 = require("@nestjs/common");
describe('AuthService', () => {
    let service;
    let storeRepo;
    let staffRepo;
    let jwtService;
    const mockStoreRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };
    const mockStaffRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };
    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        verify: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: (0, typeorm_1.getRepositoryToken)(store_entity_1.Store), useValue: mockStoreRepo },
                { provide: (0, typeorm_1.getRepositoryToken)(staff_entity_1.Staff), useValue: mockStaffRepo },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        storeRepo = module.get((0, typeorm_1.getRepositoryToken)(store_entity_1.Store));
        staffRepo = module.get((0, typeorm_1.getRepositoryToken)(staff_entity_1.Staff));
        jwtService = module.get(jwt_1.JwtService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('sendOtp', () => {
        it('should send OTP successfully', async () => {
            storeRepo.findOne.mockResolvedValue(null);
            const result = await service.sendOtp({ phone: '0901234567' });
            expect(result.success).toBe(true);
            expect(result.message).toContain('OTP');
        });
        it('should detect existing user', async () => {
            storeRepo.findOne.mockResolvedValue({ id: '1', phone: '0901234567' });
            const result = await service.sendOtp({ phone: '0901234567' });
            expect(result.success).toBe(true);
        });
    });
    describe('verifyOtp', () => {
        it('should throw error if OTP not found', async () => {
            await expect(service.verifyOtp({ phone: '0901234567', otp: '123456' })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should create new store for new user', async () => {
            await service.sendOtp({ phone: '0901234567' });
            storeRepo.findOne.mockResolvedValue(null);
            storeRepo.create.mockReturnValue({ id: 'store-1', phone: '0901234567', name: 'Quán mới', plan: 'free' });
            storeRepo.save.mockResolvedValue({ id: 'store-1', phone: '0901234567', name: 'Quán mới', plan: 'free' });
            staffRepo.create.mockReturnValue({ id: 'staff-1', store_id: 'store-1', phone: '0901234567', name: 'Chủ quán', role: 'owner' });
            staffRepo.save.mockResolvedValue({ id: 'staff-1', store_id: 'store-1', phone: '0901234567', name: 'Chủ quán', role: 'owner' });
        });
    });
    describe('registerStore', () => {
        it('should throw error if store not found', async () => {
            storeRepo.findOne.mockResolvedValue(null);
            await expect(service.registerStore('non-existent-id', { name: 'Test Store' })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should update store successfully', async () => {
            const store = { id: 'store-1', name: 'Quán mới', phone: '0901234567' };
            storeRepo.findOne.mockResolvedValue(store);
            storeRepo.save.mockResolvedValue({ ...store, name: 'Quán Cơm Tấm Ba Ba' });
            staffRepo.update.mockResolvedValue({ affected: 1 });
            const result = await service.registerStore('store-1', {
                name: 'Quán Cơm Tấm Ba Ba',
                owner_name: 'Chú Ba',
            });
            expect(result.success).toBe(true);
            expect(result.data.name).toBe('Quán Cơm Tấm Ba Ba');
        });
    });
    describe('getCurrentUser', () => {
        it('should throw error if staff not found', async () => {
            staffRepo.findOne.mockResolvedValue(null);
            await expect(service.getCurrentUser('non-existent-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should return user info', async () => {
            const staff = {
                id: 'staff-1',
                name: 'Chú Ba',
                role: 'owner',
                store: { id: 'store-1', name: 'Quán Cơm Tấm Ba Ba' },
            };
            staffRepo.findOne.mockResolvedValue(staff);
            const result = await service.getCurrentUser('staff-1');
            expect(result.success).toBe(true);
            expect(result.data.staff.name).toBe('Chú Ba');
        });
    });
    describe('refreshToken', () => {
        it('should throw error for invalid token', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(service.refreshToken('invalid-token')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should return new tokens for valid refresh token', async () => {
            jwtService.verify.mockReturnValue({ sub: 'staff-1', storeId: 'store-1', phone: '0901234567', role: 'owner' });
            staffRepo.findOne.mockResolvedValue({
                id: 'staff-1',
                phone: '0901234567',
                role: 'owner',
                store: { id: 'store-1', name: 'Quán Cơm Tấm Ba Ba', phone: '0901234567', plan: 'pro' },
            });
            jwtService.sign.mockReturnValue('new-jwt-token');
            const result = await service.refreshToken('valid-refresh-token');
            expect(result.success).toBe(true);
            expect(result.data.access_token).toBe('new-jwt-token');
        });
    });
    describe('logout', () => {
        it('should return success', async () => {
            const result = await service.logout();
            expect(result.success).toBe(true);
            expect(result.message).toContain('thành công');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map