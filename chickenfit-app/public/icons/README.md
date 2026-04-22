# ChickenFit PWA Icons

Thư mục này chứa các icon PNG cho PWA.

## Các kích thước cần thiết:

- icon-72.png (72x72) - Android low-res
- icon-96.png (96x96) - Android
- icon-128.png (128x128) - Chrome Web Store
- icon-144.png (144x144) - Windows tile
- icon-152.png (152x152) - iOS
- icon-192.png (192x192) - Android high-res
- icon-384.png (384x384) - Android adaptive
- icon-512.png (512x512) - PWA maskable

## Cách tạo icons:

### Option 1: Sử dụng script generator
```bash
cd chicken_fit/chickenfit-app
node scripts/generate-icons.js
# Mở file scripts/icon-generator.html trong browser
# Download tất cả icons và move vào thư mục này
```

### Option 2: Online converter
1. Sử dụng file `../icon.svg` làm nguồn
2. Upload đến: https://cloudconvert.com/svg-to-png
3. Convert với các kích thước: 72, 96, 128, 144, 152, 192, 384, 512
4. Download và rename files theo tên ở trên

### Option 3: Sử dụng CLI (cần sharp package)
```bash
npm install sharp --save-dev
node scripts/create-png-icons.js
```

## Lưu ý:
- Tất cả icons nên có background transparent hoặc solid color (#B85C38)
- Đảm bảo icon hiển thị rõ ở kích thước nhỏ (72x72)
- Test trên các thiết bị thực tế trước khi deploy