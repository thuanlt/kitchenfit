"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const store_entity_1 = require("./modules/auth/entities/store.entity");
const staff_entity_1 = require("./modules/auth/entities/staff.entity");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'food_vendor_os',
    entities: [store_entity_1.Store, staff_entity_1.Staff],
    synchronize: true,
});
async function seed() {
    console.log('🌱 Seeding database...');
    await AppDataSource.initialize();
    const storeRepo = AppDataSource.getRepository(store_entity_1.Store);
    const staffRepo = AppDataSource.getRepository(staff_entity_1.Staff);
    const existingStores = await storeRepo.count();
    if (existingStores > 0) {
        console.log('⚠️  Database already has data. Skipping seed.');
        await AppDataSource.destroy();
        return;
    }
    const store1 = storeRepo.create({
        id: 'store-1',
        phone: '0901234567',
        name: 'Quán Cơm Tấm Ba Ba',
        address: '123 Nguyễn Văn Cừ, Q.5, HCM',
        owner_name: 'Chú Ba',
        plan: 'pro',
        is_active: true,
    });
    await storeRepo.save(store1);
    const store2 = storeRepo.create({
        id: 'store-2',
        phone: '0909876543',
        name: 'Phở 24h',
        address: '456 Lê Lợi, Q.1, HCM',
        owner_name: 'Cô Mai',
        plan: 'basic',
        is_active: true,
    });
    await storeRepo.save(store2);
    const staff1 = staffRepo.create({
        id: 'staff-1',
        store_id: 'store-1',
        phone: '0901234567',
        name: 'Chú Ba',
        role: 'owner',
        pin_code: '1234',
    });
    await staffRepo.save(staff1);
    const staff2 = staffRepo.create({
        id: 'staff-2',
        store_id: 'store-1',
        phone: '0912345678',
        name: 'Lan',
        role: 'staff',
        pin_code: '5678',
    });
    await staffRepo.save(staff2);
    const staff3 = staffRepo.create({
        id: 'staff-3',
        store_id: 'store-2',
        phone: '0909876543',
        name: 'Cô Mai',
        role: 'owner',
        pin_code: '9999',
    });
    await staffRepo.save(staff3);
    console.log('✅ Seed completed!');
    console.log('');
    console.log('📋 Test accounts:');
    console.log('  Store 1: 0901234567 (Quán Cơm Tấm Ba Ba - Pro plan)');
    console.log('  Store 2: 0909876543 (Phở 24h - Basic plan)');
    console.log('');
    console.log('💡 In dev mode, OTP will be printed to console');
    await AppDataSource.destroy();
}
seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map