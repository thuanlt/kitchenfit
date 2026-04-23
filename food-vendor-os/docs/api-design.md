# 🔌 API DESIGN — Food Vendor OS

## Base URL
```
Production:  https://api.foodvendoros.vn/v1
Development: http://localhost:3000/v1
```

## Authentication
- Phone + OTP (Zalo SMS)
- JWT Token in Header: `Authorization: Bearer <token>`

---

## 📋 ENDPOINTS

### 🔐 AUTH

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/auth/send-otp` | Gửi OTP đến SĐT | ❌ |
| POST | `/auth/verify-otp` | Xác thực OTP, trả về JWT | ❌ |
| POST | `/auth/refresh` | Refresh token | ✅ |
| POST | `/auth/logout` | Đăng xuất | ✅ |

#### POST /auth/send-otp
```json
// Request
{ "phone": "0901234567" }

// Response 200
{ "success": true, "message": "OTP đã được gửi" }
```

#### POST /auth/verify-otp
```json
// Request
{ "phone": "0901234567", "otp": "123456" }

// Response 200
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 86400,
    "store": { "id": "uuid", "name": "Quán Cơm Tấm Ba Ba", "plan": "pro" },
    "staff": { "id": "uuid", "name": "Chú Ba", "role": "owner" }
  }
}
```

---

### 🏪 STORES

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/stores/me` | Thông tin quán | ✅ |
| PATCH | `/stores/me` | Cập nhật quán | ✅ |
| GET | `/stores/me/qr` | Lấy QR code menu | ✅ |

#### GET /stores/me
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "0901234567",
    "name": "Quán Cơm Tấm Ba Ba",
    "address": "123 Nguyễn Văn Cừ, Q.5",
    "owner_name": "Chú Ba",
    "avatar_url": "https://...",
    "plan": "pro",
    "menu_qr_url": "https://api.foodvendoros.vn/qr/store-uuid",
    "stats": {
      "total_orders_today": 45,
      "revenue_today": 1575000,
      "pending_orders": 3
    }
  }
}
```

---

### 📋 MENU

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/menu/categories` | Danh sách danh mục | ✅ |
| POST | `/menu/categories` | Tạo danh mục | ✅ |
| PATCH | `/menu/categories/:id` | Sửa danh mục | ✅ |
| DELETE | `/menu/categories/:id` | Xóa danh mục | ✅ |
| GET | `/menu/items` | Danh sách món | ✅ |
| POST | `/menu/items` | Thêm món | ✅ |
| PATCH | `/menu/items/:id` | Sửa món | ✅ |
| DELETE | `/menu/items/:id` | Xóa món | ✅ |
| PATCH | `/menu/items/:id/toggle` | Bật/tắt món | ✅ |
| GET | `/menu/public/:storeId` | Menu public (cho QR) | ❌ |

#### POST /menu/items
```json
// Request
{
  "category_id": "uuid",
  "name": "Cơm sườn",
  "description": "Cơm sườn nướng than hoa",
  "price": 35000,
  "image_url": "https://..."
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Cơm sườn",
    "price": 35000,
    "is_available": true
  }
}
```

#### GET /menu/public/:storeId (cho khách scan QR)
```json
{
  "success": true,
  "data": {
    "store": { "name": "Quán Cơm Tấm Ba Ba", "avatar_url": "..." },
    "categories": [
      {
        "id": "uuid",
        "name": "Cơm",
        "items": [
          { "id": "uuid", "name": "Cơm sườn", "price": 35000, "image_url": "..." },
          { "id": "uuid", "name": "Cơm sườn bì chả", "price": 45000 }
        ]
      }
    ]
  }
}
```

---

### 📦 ORDERS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/orders` | Danh sách đơn (filter) | ✅ |
| POST | `/orders` | Tạo đơn | ✅ |
| GET | `/orders/:id` | Chi tiết đơn | ✅ |
| PATCH | `/orders/:id/status` | Cập nhật trạng thái | ✅ |
| POST | `/orders/public/create` | Khách tạo đơn từ QR | ❌ |

#### GET /orders?status=pending&date=today
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "table_number": "3",
      "status": "preparing",
      "items": [
        { "item_name": "Cơm sườn", "quantity": 2, "price": 35000, "note": "Ít hành" },
        { "item_name": "Trà đá", "quantity": 2, "price": 5000 }
      ],
      "total": 80000,
      "created_at": "2026-04-15T12:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

#### POST /orders (chủ quán tạo)
```json
// Request
{
  "table_number": "3",
  "items": [
    { "menu_item_id": "uuid", "quantity": 2, "note": "Ít hành" },
    { "menu_item_id": "uuid", "quantity": 2 }
  ],
  "note": "Khách ngồi bàn 3"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "#045",
    "status": "pending",
    "total": 80000,
    "items": [...]
  }
}
```

#### POST /orders/public/create (khách order từ QR)
```json
// Request
{
  "store_id": "uuid",
  "table_number": "3",
  "items": [
    { "menu_item_id": "uuid", "quantity": 1 },
    { "menu_item_id": "uuid", "quantity": 2 }
  ],
  "customer_note": "Không hành, nhiều ớt",
  "customer_phone": "0909876543"
}
```

#### PATCH /orders/:id/status
```json
// Request
{ "status": "preparing" }

// Valid transitions:
// pending → confirmed → preparing → ready → completed
// pending → cancelled
// confirmed → cancelled
```

---

### 💰 PAYMENTS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/payments/create-qr` | Tạo mã QR thanh toán | ✅ |
| POST | `/payments/momo-callback` | Momo webhook | ❌ |
| POST | `/payments/vnpay-callback` | VNPay webhook | ❌ |
| PATCH | `/orders/:id/mark-paid` | Đánh dấu đã thu tiền mặt | ✅ |

#### POST /payments/create-qr
```json
// Request
{
  "order_id": "uuid",
  "method": "momo" // hoặc "vnpay"
}

// Response 200
{
  "success": true,
  "data": {
    "qr_url": "https://...",
    "deep_link": "momo://...",
    "order_id": "uuid",
    "amount": 80000,
    "expires_at": "2026-04-15T13:00:00Z"
  }
}
```

---

### 📦 INVENTORY

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/inventory` | Danh sách nguyên liệu | ✅ |
| POST | `/inventory` | Thêm nguyên liệu | ✅ |
| PATCH | `/inventory/:id` | Cập nhật số lượng | ✅ |
| DELETE | `/inventory/:id` | Xóa | ✅ |
| POST | `/inventory/:id/log` | Nhập/xuất kho | ✅ |
| GET | `/inventory/alerts` | Nguyên liệu sắp hết | ✅ |
| POST | `/inventory/scan-receipt` | Scan hóa đơn (AI OCR) | ✅ |

#### POST /inventory/scan-receipt
```json
// Request (multipart/form-data)
{ "image": <file> }

// Response 200
{
  "success": true,
  "data": {
    "items": [
      { "name": "Thịt heo", "quantity": 5, "unit": "kg", "estimated_cost": 750000 },
      { "name": "Gạo", "quantity": 10, "unit": "kg", "estimated_cost": 120000 }
    ],
    "total_estimated": 870000,
    "confidence": 0.85
  }
}
```

---

### 📊 REPORTS

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/reports/daily` | Báo cáo hôm nay | ✅ |
| GET | `/reports/weekly` | Báo cáo tuần | ✅ |
| GET | `/reports/monthly` | Báo cáo tháng | ✅ |
| GET | `/reports/top-items` | Món bán chạy | ✅ |
| GET | `/reports/revenue-chart` | Data biểu đồ doanh thu | ✅ |

#### GET /reports/daily
```json
{
  "success": true,
  "data": {
    "date": "2026-04-15",
    "total_orders": 45,
    "total_revenue": 1575000,
    "total_expense": 650000,
    "net_profit": 925000,
    "top_items": [
      { "name": "Cơm sườn", "quantity": 25, "revenue": 875000 },
      { "name": "Cơm sườn bì chả", "quantity": 12, "revenue": 540000 }
    ],
    "hourly_data": [
      { "hour": 11, "orders": 8, "revenue": 280000 },
      { "hour": 12, "orders": 15, "revenue": 525000 }
    ],
    "ai_summary": "Hôm nay doanh thu tốt, tăng 15% so với hôm qua. Cơm sườn vẫn là món bán chạy nhất. Lúc 12h trưa đông khách nhất, nên chuẩn bị sẵn nguyên liệu."
  }
}
```

---

### 🤖 AI (GLM 5.1)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/ai/chat` | Chat với AI assistant | ✅ |
| POST | `/ai/voice-order` | Voice → text → order | ✅ |
| POST | `/ai/suggest-restock` | Gợi ý nhập hàng | ✅ |

#### POST /ai/chat
```json
// Request
{
  "message": "Hôm nay bán thế nào?",
  "context": { "store_id": "uuid" }
}

// Response 200
{
  "success": true,
  "data": {
    "reply": "Hôm nay quán bán được 45 đơn, doanh thu 1,575,000đ. Tăng 15% so với hôm qua! Cơm sườn bán chạy nhất với 25 phần.",
    "suggestions": ["Xem chi tiết doanh thu", "Món nào bán chậm?", "Gợi ý nhập hàng"]
  }
}
```

#### POST /ai/voice-order
```json
// Request (multipart/form-data)
{ "audio": <file> }

// Response 200
{
  "success": true,
  "data": {
    "text": "Cơm sườn 2, trà đá 3",
    "parsed_items": [
      { "name": "Cơm sườn", "quantity": 2, "menu_item_id": "uuid", "price": 35000 },
      { "name": "Trà đá", "quantity": 3, "menu_item_id": "uuid", "price": 5000 }
    ],
    "total": 85000,
    "confidence": 0.92
  }
}
```

---

## 🔔 WEBSOCKET EVENTS (Real-time)

```
ws://api.foodvendoros.vn/v1/ws?token=<jwt>
```

| Event | Direction | Mô tả |
|-------|-----------|--------|
| `order:new` | Server → Client | Có đơn mới |
| `order:updated` | Server → Client | Trạng thái đơn thay đổi |
| `order:ready` | Server → Client | Món đã sẵn sàng |
| `payment:received` | Server → Client | Đã thanh toán |
| `inventory:alert` | Server → Client | Nguyên liệu sắp hết |

#### Example: order:new
```json
{
  "event": "order:new",
  "data": {
    "id": "uuid",
    "order_number": "#046",
    "table_number": "5",
    "items": [
      { "name": "Cơm sườn", "quantity": 2, "note": "Nhiều ớt" }
    ],
    "total": 70000,
    "source": "qr"
  }
}
```

---

## ❌ ERROR RESPONSE FORMAT

```json
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Mã OTP không chính xác",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP | Mô tả |
|------|------|--------|
| `INVALID_OTP` | 400 | OTP sai |
| `TOKEN_EXPIRED` | 401 | Token hết hạn |
| `FORBIDDEN` | 403 | Không có quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `STORE_LIMIT` | 403 | Hết giới hạn plan |
| `ITEM_UNAVAILABLE` | 400 | Món đã hết |
| `PAYMENT_FAILED` | 400 | Thanh toán lỗi |
| `AI_ERROR` | 500 | Lỗi AI service |
| `RATE_LIMIT` | 429 | Quá nhiều request |