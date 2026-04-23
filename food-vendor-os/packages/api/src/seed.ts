import { DataSource } from 'typeorm';
import { Store } from './modules/auth/entities/store.entity';
import { Staff } from './modules/auth/entities/staff.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'food_vendor_os',
  entities: [Store, Staff],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Seeding database...');

  await AppDataSource.initialize();
  const storeRepo = AppDataSource.getRepository(Store);
  const staffRepo = AppDataSource.getRepository(Staff);

  // Check if data already exists
  const existingStores = await storeRepo.count();
  if (existingStores > 0) {
    console.log('⚠️  Database already has data. Skipping seed.');
    await AppDataSource.destroy();
    return;
  }

  // Seed Store 1: Quán Cơm Tấm Ba Ba
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

  // Seed Store 2: Phở 24h
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

  // Seed Staff for Store 1
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

  // Seed Staff for Store 2
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