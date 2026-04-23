# 📱 SCREEN FLOW — Food Vendor OS

## User Flows

```
┌─────────────────────────────────────────────────────────────┐
│                        APP FLOWS                            │
├──────────────┬──────────────────────┬───────────────────────┤
│  👤 Chủ Quán │  🧑 Khách (QR)       │  💬 Zalo Bot          │
│  (Owner App) │  (Web Mobile)        │  (Notifications)      │
└──────┬───────┴──────────┬───────────┴───────────┬───────────┘
       │                  │                       │
       ▼                  ▼                       ▼
  Quản lý quán      Order & Thanh toán       Báo cáo & Chat
```

---

## A. 👤 CHỦ QUÁN — Owner App (React Native)

### A1. Splash → Login

```
[Splash Screen]
    │
    ▼
[Login Screen]
    ├── Nhập SĐT
    ├── Gửi OTP
    ├── Xác thực OTP
    │
    ├── (Nếu chưa có quán) → [Register Store]
    │   ├── Tên quán
    │   ├── Địa chỉ
    │   ├── Chọn loại quán (cơm, phở, hủ tiếu...)
    │   └── Tạo menu mẫu tự động ✨
    │
    └── (Đã có quán) → [Home]
```

### A2. Home Dashboard

```
┌─────────────────────────────────────┐
│  🏠 Home                            │
├─────────────────────────────────────┤
│                                     │
│  📊 Hôm nay                         │
│  ┌──────────┬──────────┐            │
│  │ 45 đơn   │ 1.57M₫   │            │
│  │ +15%     │ +12%     │            │
│  └──────────┴──────────┘            │
│                                     │
│  🔔 Đơn đang chờ (3)               │
│  ┌─────────────────────────┐        │
│  │ #045  Bàn 3  80,000₫    │ ▶      │
│  │ #044  Mang đi  35,000₫  │ ▶      │
│  │ #043  Bàn 7  150,000₫   │ ▶      │
│  └─────────────────────────┘        │
│                                     │
│  🤖 AI Gợi ý                        │
│  "Thịt heo sắp hết, nên đặt thêm"   │
│                                     │
├─────┬─────┬─────┬─────┬─────────────┤
│ 🏠  │ 📋  │ 📦  │ 📊  │ 🤖          │
│Home │Order│ Kho │Report│ AI          │
└─────┴─────┴─────┴─────┴─────────────┘
```

### A3. Order Flow

```
[Home] → Tab Order
    │
    ▼
[Order List]
    ├── Filter: pending | preparing | ready | completed
    ├── Tap order → [Order Detail]
    │   ├── Thông tin đơn
    │   ├── Danh sách món
    │   ├── Nút chuyển trạng thái:
    │   │   pending → [Xác nhận] → preparing → [Xong] → ready → [Hoàn thành]
    │   └── Thanh toán:
    │       ├── [Tiền mặt] → Mark paid
    │       └── [QR Momo] → Hiện mã QR
    │
    └── [+] Tạo đơn mới
        ├── Chọn món từ menu
        ├── Chọn số lượng
        ├── Ghi chú từng món
        ├── Nhập số bàn (optional)
        └── [Tạo đơn] ✓

    ┌── Shortcut: [🎤 Voice Order]
    │   ├── Nhấn & nói: "Cơm sườn 2, trà đá 3"
    │   ├── AI parse → Xác nhận
    │   └── [Tạo đơn] ✓
    │
    └── Shortcut: [📸 Scan từ hóa đơn]
        └── (Cho nhập kho, không phải order)
```

### A4. Menu Management

```
[Home] → Tab Order → [Menu] icon
    │
    ▼
[Menu List]
    ├── Danh mục: Cơm | Nước | Thêm
    ├── Món ăn (tap để sửa)
    ├── [+] Thêm món mới
    │   ├── Tên món
    │   ├── Giá
    │   ├── Danh mục
    │   ├── Mô tả
    │   ├── Ảnh (chụp hoặc chọn)
    │   └── [Lưu] ✓
    │
    ├── Toggle bật/tắt món (khi hết)
    │
    └── [QR Menu] → Hiện mã QR cho khách scan
        ├── Download QR
        └── Share Zalo
```

### A5. Inventory

```
[Home] → Tab Kho
    │
    ▼
[Inventory List]
    ├── 🔴 Sắp hết (3)     ← Highlight đỏ
    ├── 🟡 Số lượng thấp (5) ← Highlight vàng
    ├── 🟢 Đủ (12)          ← Highlight xanh
    │
    ├── Tap item → [Chi tiết nguyên liệu]
    │   ├── Số lượng hiện tại
    │   ├── Lịch sử nhập/xuất
    │   └── [Nhập kho] / [Xuất kho]
    │
    ├── [+] Thêm nguyên liệu
    │   ├── Tên
    │   ├── Đơn vị (kg, lít, cái...)
    │   ├── Số lượng
    │   ├── Ngưỡng cảnh báo
    │   └── [Lưu] ✓
    │
    └── [📸 Scan hóa đơn nhập]
        ├── Chụp ảnh hóa đơn
        ├── AI OCR đọc → Xác nhận
        └── Nhập kho tự động ✓
```

### A6. Reports

```
[Home] → Tab Report
    │
    ▼
[Report Dashboard]
    ├── Chọn: Hôm nay | Tuần | Tháng
    │
    ├── 📊 Biểu đồ doanh thu
    │   ├── Line chart: Doanh thu theo ngày/giờ
    │   └── So sánh với kỳ trước
    │
    ├── 📋 Số liệu tổng quan
    │   ├── Tổng đơn: 45 (+15%)
    │   ├── Doanh thu: 1,575,000₫ (+12%)
    │   ├── Chi phí: 650,000₫
    │   └── Lãi: 925,000₫
    │
    ├── 🏆 Món bán chạy
    │   ├── 1. Cơm sườn — 25 phần
    │   ├── 2. Cơm sườn bì chả — 12 phần
    │   └── 3. Trà đá — 30 ly
    │
    ├── 🤖 AI Tóm tắt
    │   └── "Doanh thu hôm nay tốt, tăng 15%. 
    │       Nên chuẩn bị nhiều cơm sườn hơn cho ngày mai."
    │
    └── [📤 Gửi báo cáo Zalo] → Share qua Zalo
```

### A7. AI Chat

```
[Home] → Tab AI
    │
    ▼
[AI Chat Screen]
    ├── Chat interface (như Zalo chat)
    │
    ├── Quick actions:
    │   ├── "Bán hôm nay thế nào?"
    │   ├── "Món nào bán chậm?"
    │   ├── "Gợi ý nhập hàng"
    │   └── "So sánh với tháng trước"
    │
    ├── Chat history
    │
    └── Input:
        ├── Text input
        ├── 🎤 Voice input
        └── [Gửi]
```

---

## B. 🧑 KHÁCH — QR Menu (Mobile Web)

### B1. Scan QR → Order Flow

```
[Scan QR từ bàn]
    │
    ▼
[Menu Page] (mobile web)
    ├── Header: Tên quán + Logo
    ├── Danh mục (tab scroll ngang)
    │   ├── Tất cả | Cơm | Nước | Thêm
    │   └── Filter: Có sẵn ✅
    │
    ├── Danh sách món
    │   ┌─────────────────────────┐
    │   │ 🍚 Cơm sườn      35,000₫│
    │   │    Cơm sườn nướng...     │
    │   │              [- 0 +]    │
    │   ├─────────────────────────┤
    │   │ 🍚 Cơm bì chả    45,000₫│
    │   │              [- 1 +]    │
    │   └─────────────────────────┘
    │
    ├── Floating Cart Button: 🛒 1 món - 45,000₫
    │
    └── [Xem giỏ] → [Cart Page]
        ├── Danh sách món đã chọn
        ├── Ghi chú từng món (ít hành, nhiều ớt)
        ├── Ghi chú chung
        ├── Số bàn (required)
        ├── SĐT (optional, để liên hệ)
        ├── Tổng cộng
        └── [Đặt món] ✓
            │
            ▼
        [Order Confirmed]
        ├── "Đã đặt thành công!" ✅
        ├── Mã đơn: #046
        ├── Trạng thái: Đang chờ
        └── Auto-refresh trạng thái:
            Đang chờ → Đang chuẩn bị → Sẵn sàng!
```

---

## C. 💬 ZALO BOT — Notifications

```
[End of Day - 22:00]
    │
    ▼
[Zalo Message]
    ┌─────────────────────────────────┐
    │ 📊 Báo cáo cuối ngày            │
    │                                 │
    │ Quán: Cơm Tấm Ba Ba             │
    │ Ngày: 15/04/2026                │
    │                                 │
    │ 📋 45 đơn  💰 1,575,000₫        │
    │ 📈 +15% so với hôm qua          │
    │                                 │
    │ 🏆 Món bán chạy:                │
    │ 1. Cơm sườn — 25 phần           │
    │ 2. Trà đá — 30 ly               │
    │                                 │
    │ 🤖 AI: "Doanh thu tốt! Nên      │
    │ nhập thêm thịt heo, sắp hết."  │
    │                                 │
    │ [Xem chi tiết] [Chat với AI]    │
    └─────────────────────────────────┘
```

---

## 📱 SCREEN LIST SUMMARY

### Owner App (React Native)

| # | Screen | Mô tả |
|---|--------|--------|
| 1 | Splash | Logo animation |
| 2 | Login | SĐT + OTP |
| 3 | Register Store | Tạo quán mới |
| 4 | Home Dashboard | Tổng quan + đơn chờ |
| 5 | Order List | Danh sách đơn theo trạng thái |
| 6 | Order Detail | Chi tiết + chuyển trạng thái + thanh toán |
| 7 | Create Order | Tạo đơn thủ công |
| 8 | Voice Order | Tạo đơn bằng giọng nói |
| 9 | Menu List | Quản lý menu |
| 10 | Menu Item Form | Thêm/sửa món |
| 11 | QR Menu | Hiện/Share mã QR |
| 12 | Inventory List | Danh sách nguyên liệu |
| 13 | Inventory Detail | Chi tiết + lịch sử |
| 14 | Scan Receipt | Chụp hóa đơn nhập kho |
| 15 | Reports | Biểu đồ + số liệu |
| 16 | AI Chat | Chat với AI assistant |
| 17 | Settings | Cài đặt quán |

### Customer Web (Next.js Mobile)

| # | Screen | Mô tả |
|---|--------|--------|
| 1 | Menu | Xem menu + thêm giỏ hàng |
| 2 | Cart | Xem giỏ + ghi chú + đặt món |
| 3 | Order Status | Theo dõi trạng thái đơn |

---

## 🔄 NAVIGATION STRUCTURE

```
Owner App:

    ┌─── Tab Navigator ───────────────────┐
    │                                      │
    │  🏠 Home    → Dashboard              │
    │  📋 Orders  → Order List              │
    │              → Order Detail (stack)   │
    │              → Create Order (stack)   │
    │              → Voice Order (stack)    │
    │  📦 Kho     → Inventory List          │
    │              → Inventory Detail       │
    │              → Scan Receipt (stack)   │
    │  📊 Report  → Reports                 │
    │  🤖 AI      → AI Chat                 │
    │                                      │
    │  ⚙️ Settings (modal)                  │
    └──────────────────────────────────────┘

Customer Web:

    Menu → Cart → Order Status
    (3 screens only!)
```