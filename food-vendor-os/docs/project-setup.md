# 🚀 PROJECT SETUP — Food Vendor OS

## 1. CẤU TRÚC THƯ MỤC

```
food-vendor-os/
├── apps/
│   ├── mobile/              # React Native App (Chủ quán)
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/       # Zustand state
│   │   │   └── utils/
│   │   ├── App.tsx
│   │   └── package.json
│   │
│   └── web/                 # Next.js App (Khách QR + Admin)
│       ├── src/
│       │   ├── app/
│       │   │   ├── menu/[storeId]/   # Public menu
│       │   │   ├── cart/
│       │   │   └── order-status/
│       │   ├── components/
│       │   ├── lib/
│       │   └── styles/
│       └── package.json
│
├── packages/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── stores/
│   │   │   │   ├── menu/
│   │   │   │   ├── orders/
│   │   │   │   ├── inventory/
│   │   │   │   ├── payments/
│   │   │   │   ├── reports/
│   │   │   │   └── ai/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── decorators/
│   │   │   │   └── filters/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── shared/              # Shared types & utils
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── validators/
│       └── package.json
│
├── infra/                   # Infrastructure
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── docs/                    # Documentation
│   ├── database-schema.md
│   ├── api-design.md
│   ├── screen-flow.md
│   └── project-setup.md
│
├── turbo.json               # Turborepo config
├── package.json              # Root monorepo
└── .env.example
```

---

## 2. KHỞI TẠO PROJECT

### Bước 1: Tạo Monorepo

```bash
# Tạo root project
mkdir food-vendor-os && cd food-vendor-os
npm init -y

# Cài Turborepo
npm install -D turbo

# Tạo cấu trúc thư mục
mkdir -p apps/mobile/src
mkdir -p apps/web/src
mkdir -p packages/api/src/modules
mkdir -p packages/shared/src
mkdir -p infra
mkdir -p docs
```

### Bước 2: Setup Backend (NestJS)

```bash
cd packages/api
npx @nestjs/cli new . --package-manager npm --skip-git

# Cài dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install passport passport-jwt
npm install pg typeorm @nestjs/typeorm
npm install redis ioredis
npm install class-validator class-transformer
npm install bcrypt uuid
npm install @nestjs/microservices

# Dev dependencies
npm install -D @types/passport-jwt @types/bcrypt
npm install -D jest supertest @types/jest
```

### Bước 3: Setup Mobile App (React Native)

```bash
cd apps/mobile
npx react-native init FoodVendorOS --template react-native-template-typescript

# Cài dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install zustand axios
npm install @react-native-async-storage/async-storage
npm install react-native-qrcode-svg react-native-svg
npm install react-native-camera react-native-image-picker
npm install @react-native-community/voice   # Voice input
npm install socket.io-client
```

### Bước 4: Setup Web App (Next.js)

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app

# Cài dependencies
npm install zustand axios
npm install qrcode.react
npm install recharts          # Charts
npm install socket.io-client
npm install @heroicons/react  # Icons
```

---

## 3. ENVIRONMENT VARIABLES

### .env.example

```env
# ===== APP =====
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000/v1

# ===== DATABASE =====
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_vendor_os
DB_USER=postgres
DB_PASSWORD=your_password

# ===== REDIS =====
REDIS_HOST=localhost
REDIS_PORT=6379

# ===== JWT =====
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ===== OTP =====
OTP_LENGTH=6
OTP_EXPIRES_IN=300

# ===== GLM 5.1 =====
GLM_API_KEY=your_glm_api_key
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
GLM_MODEL=glm-4

# ===== WHISPER (Voice) =====
WHISPER_API_URL=http://localhost:8000/transcribe
# Hoặc dùng OpenAI Whisper API:
# WHISPER_API_URL=https://api.openai.com/v1/audio/transcriptions
# WHISPER_API_KEY=your_key

# ===== OCR =====
TESSERACT_ENABLED=true
# Hoặc dùng GLM-4V:
# GLM_VISION_ENABLED=true

# ===== MOMO =====
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create

# ===== VNPAY =====
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# ===== ZALO =====
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_OA_ID=your_oa_id

# ===== S3 (Image Upload) =====
S3_BUCKET=food-vendor-os
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

---

## 4. DOCKER COMPOSE (Dev)

### infra/docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: fvos-postgres
    environment:
      POSTGRES_DB: food_vendor_os
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: fvos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  whisper:
    image: onerahmet/openai-whisper-asr-webservice:latest
    container_name: fvos-whisper
    environment:
      - ASR_MODEL=base
      - ASR_ENGINE=openai_whisper
    ports:
      - "8000:8000"

  adminer:
    image: adminer
    container_name: fvos-adminer
    ports:
      - "8080:8080"

volumes:
  postgres_data:
  redis_data:
```

### Chạy dev environment:

```bash
cd infra
docker-compose up -d

# Kiểm tra
docker-compose ps

# Kết quả:
# fvos-postgres   running   0.0.0.0:5432
# fvos-redis      running   0.0.0.0:6379
# fvos-whisper    running   0.0.0.0:8000
# fvos-adminer    running   0.0.0.0:8080
```

---

## 5. TURBOREPO CONFIG

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

### Root package.json scripts

```json
{
  "name": "food-vendor-os",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "npm run dev --workspace=packages/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:mobile": "npm run start --workspace=apps/mobile",
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "npm run migration:run --workspace=packages/api",
    "db:seed": "npm run seed --workspace=packages/api"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

---

## 6. CHẠY PROJECT LẦN ĐẦU

```bash
# 1. Clone & install
cd food-vendor-os
npm install

# 2. Start infrastructure
cd infra && docker-compose up -d && cd ..

# 3. Copy env
cp packages/api/.env.example packages/api/.env
# → Chỉnh sửa .env với giá trị thực

# 4. Run database migrations
npm run db:migrate

# 5. Seed sample data
npm run db:seed

# 6. Start all dev servers
npm run dev

# Kết quả:
# ✅ API:     http://localhost:3000
# ✅ Web:     http://localhost:3001
# ✅ Mobile:  Metro bundler running
# ✅ Adminer: http://localhost:8080
# ✅ Whisper: http://localhost:8000
```

---

## 7. QUICK START COMMANDS (Copy-paste)

```bash
# === Tạo project từ đầu ===

mkdir food-vendor-os && cd food-vendor-os
npm init -y
npm install -D turbo

# Backend
npx @nestjs/cli new packages/api --package-manager npm --skip-git

# Web
npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir

# Shared
mkdir -p packages/shared/src

# Infra
mkdir -p infra

# Docs
mkdir -p docs

echo "✅ Project structure created!"
```

---

## 8. GIT WORKFLOW

```bash
# Branch strategy
main          → Production
├── develop   → Development
│   ├── feature/auth
│   ├── feature/menu
│   ├── feature/orders
│   ├── feature/inventory
│   ├── feature/reports
│   ├── feature/ai-chat
│   └── feature/payments
└── hotfix/*  → Emergency fixes
```

---

## 9. CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

*Tạo bởi AI Assistant • Cập nhật: Tháng 4/2026*