# 🗄️ DATABASE SCHEMA — Food Vendor OS

## ER Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   stores     │────<│   menu_items    │     │   staff     │
└──────┬──────┘     └─────────────────┘     └──────┬──────┘
       │                                           │
       │            ┌─────────────────┐            │
       ├───────────<│   orders        │>───────────┤
       │            └──────┬──────────┘            │
       │                   │                       │
       │            ┌──────┴──────────┐            │
       │            │   order_items   │            │
       │            └─────────────────┘            │
       │                                           │
       │            ┌─────────────────┐            │
       ├───────────<│   inventory     │            │
       │            └─────────────────┘            │
       │                                           │
       │            ┌─────────────────┐            │
       └───────────<│   transactions  │>───────────┘
                    └─────────────────┘
```

---

## Tables

### 1. stores — Thông tin quán

```sql
CREATE TABLE stores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  address       TEXT,
  owner_name    VARCHAR(255),
  avatar_url    TEXT,
  plan          VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free','basic','pro','chain')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. staff — Nhân viên

```sql
CREATE TABLE staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  phone         VARCHAR(20) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
  pin_code      VARCHAR(6), -- Mã PIN đăng nhập nhanh
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, phone)
);
```

### 3. menu_categories — Danh mục menu

```sql
CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. menu_items — Món ăn

```sql
CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. orders — Đơn hàng

```sql
CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id      UUID REFERENCES staff(id),
  table_number  VARCHAR(20),          -- Số bàn (nếu có)
  status        VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending','confirmed','preparing','ready','completed','cancelled')),
  note          TEXT,                  -- Ghi chú khách
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount      DECIMAL(12,2) DEFAULT 0,
  final_total   DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash','qr','transfer')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid','paid','partial','refunded')),
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_store_date ON orders(store_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(store_id, status);
```

### 6. order_items — Chi tiết đơn hàng

```sql
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID REFERENCES menu_items(id),
  item_name     VARCHAR(255) NOT NULL,  -- Snapshot tên món (phòng khi menu thay đổi)
  quantity      INT NOT NULL DEFAULT 1,
  price         DECIMAL(12,2) NOT NULL, -- Giá tại thời điểm order
  note          TEXT,                   -- Ghi chú từng món (ít hành, nhiều ớt...)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. inventory — Kho nguyên liệu

```sql
CREATE TABLE inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  unit          VARCHAR(50) NOT NULL,     -- kg, lít, cái...
  quantity      DECIMAL(12,2) DEFAULT 0,
  min_quantity  DECIMAL(12,2) DEFAULT 0,  -- Ngưỡng cảnh báo
  cost_per_unit DECIMAL(12,2) DEFAULT 0,
  last_restock  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, name)
);
```

### 8. inventory_logs — Nhật ký nhập/xuất kho

```sql
CREATE TABLE inventory_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  inventory_id  UUID NOT NULL REFERENCES inventory(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('in','out','adjust')),
  quantity      DECIMAL(12,2) NOT NULL,
  note          TEXT,
  image_url     TEXT,           -- Ảnh hóa đơn nhập
  created_by    UUID REFERENCES staff(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. transactions — Giao dịch thanh toán

```sql
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id      UUID REFERENCES orders(id),
  staff_id      UUID REFERENCES staff(id),
  amount        DECIMAL(12,2) NOT NULL,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('income','expense','refund')),
  method        VARCHAR(20) CHECK (method IN ('cash','qr','transfer')),
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_store_date ON transactions(store_id, created_at DESC);
```

### 10. daily_reports — Báo cáo cuối ngày (cached)

```sql
CREATE TABLE daily_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  report_date   DATE NOT NULL,
  total_orders  INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_expense DECIMAL(12,2) DEFAULT 0,
  top_items     JSONB,          -- [{name, quantity, revenue}]
  hourly_data   JSONB,          -- [{hour, orders, revenue}]
  ai_summary    TEXT,           -- GLM 5.1 tóm tắt
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, report_date)
);
```

---

## 🔑 Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| orders | (store_id, created_at) | Lọc đơn theo ngày |
| orders | (store_id, status) | Lọc đơn theo trạng thái |
| transactions | (store_id, created_at) | Báo cáo doanh thu |
| menu_items | (store_id, is_available) | Menu hiển thị |
| inventory | (store_id, name) UNIQUE | Trùng tên nguyên liệu |

---

## 📦 Seed Data (Sample)

```sql
-- Store
INSERT INTO stores (id, phone, name, address, owner_name, plan)
VALUES ('store-1', '0901234567', 'Quán Cơm Tấm Ba Ba', '123 Nguyễn Văn Cừ, Q.5, HCM', 'Chú Ba', 'pro');

-- Categories
INSERT INTO menu_categories (id, store_id, name, sort_order) VALUES
('cat-1', 'store-1', 'Cơm', 1),
('cat-2', 'store-1', 'Nước', 2),
('cat-3', 'store-1', 'Thêm', 3);

-- Menu Items
INSERT INTO menu_items (id, store_id, category_id, name, price, sort_order) VALUES
('item-1', 'store-1', 'cat-1', 'Cơm sườn', 35000, 1),
('item-2', 'store-1', 'cat-1', 'Cơm sườn bì chả', 45000, 2),
('item-3', 'store-1', 'cat-1', 'Cơm bì chả thủy hải sản', 55000, 3),
('item-4', 'store-1', 'cat-2', 'Trà đá', 5000, 1),
('item-5', 'store-1', 'cat-2', 'Nước ngọt', 10000, 2),
('item-6', 'store-1', 'cat-3', 'Thêm sườn', 15000, 1),
('item-7', 'store-1', 'cat-3', 'Thêm trứng', 10000, 2);
```