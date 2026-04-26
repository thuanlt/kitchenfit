# 🚀 Load Testing Best Practices - FPTCLAW UI Chat System

## 📋 Thông tin tổng quan

**Dự án:** FPTCLAW UI Chat Load Testing
**Mục tiêu:** Xác định ngưỡng chịu tải của hệ thống chat AI
**Thời gian:** 24/04/2026
**Kết quả:** Tìm được ngưỡng tối ưu 12 concurrent users

---

## 🛠️ Tool và Công nghệ sử dụng

### 1. **Apache JMeter 5.6.3**
- **Mô tả:** Công cụ load testing mã nguồn mở
- **Phiên bản:** 5.6.3
- **Chế độ chạy:** Non-GUI (CLI mode)

### 2. **Docker**
- **Mô tả:** Containerization platform
- **Image:** eclipse-temurin:11-jre + JMeter 5.6.3
- **Lợi ích:** Tạo môi trường test nhất quán, tránh vấn đề tương thích Java

### 3. **Groovy Scripting**
- **Mô tả:** Ngôn ngữ scripting cho JSR223 Sampler
- **Mục đích:** Tạo logic test phức tạp (WebSocket, HTTP Client)

### 4. **Java 11**
- **Mô tả:** Runtime environment
- **Yêu cầu:** JMeter 5.6.3 yêu cầu Java 11-17, không tương thích với Java 25

### 5. **PowerShell**
- **Mô tả:** Automation script trên Windows
- **Mục đích:** Tự động hóa quy trình test

---

## 📊 Quy trình thực hiện

### **Bước 1: Chuẩn bị môi trường**
1. Cài đặt Docker Desktop
2. Tạo Docker image với Java 11 + JMeter 5.6.3
3. Chuẩn bị file JMX test plan

### **Bước 2: Chạy test từng mức tải**
1. Bắt đầu với mức tải thấp (10 users)
2. Tăng dần số lượng users (12, 14, 15, 20, 50, 100)
3. Ghi nhận kết quả mỗi mức tải

### **Bước 3: Phân tích kết quả**
1. Xác định ngưỡng tối ưu (Success rate >= 90%)
2. Tìm điểm chết (Error rate >= 40%)
3. Vẽ biểu đồ xu hướng

### **Bước 4: Tạo báo cáo**
1. Tạo dashboard HTML
2. Tổng hợp kết quả và khuyến nghị

---

## 🎯 Kết quả đạt được

### **Ngưỡng chịu tải:**
- **Tối ưu:** 10-12 concurrent users (Success rate: 91-95%)
- **Chấp nhận được:** 14-15 concurrent users (Success rate: 83-86%)
- **Quá tải:** 20+ concurrent users (Success rate: < 80%)
- **Điểm chết:** 50+ concurrent users (Error rate: >= 40%)

### **Thông số kỹ thuật:**
- **Tốc độ tối ưu:** 1.2-1.8 requests/giây
- **Thời gian phản hồi:** 2.5-6 giây (tùy mức tải)
- **Loại lỗi chính:** Rate limit exceeded

---

## 💡 Bài học rút ra

### **1. Về môi trường test**
✅ **Tốt:**
- Sử dụng Docker để tạo môi trường test nhất quán
- Chọn đúng phiên bản Java tương thích với JMeter
- Chạy JMeter ở non-GUI mode cho load testing

❌ **Tránh:**
- Sử dụng Java version quá mới (Java 25 với JMeter 5.6.3)
- Chạy JMeter GUI mode cho load testing

### **2. Về thiết kế test**
✅ **Tốt:**
- Test từng mức tải tăng dần để tìm ngưỡng chính xác
- Sử dụng realistic user behavior (login + chat flow)
- Thiết kế ramp-up period hợp lý

❌ **Tránh:**
- Test ngay mức tải cao mà không test mức thấp trước
- Sử dụng unrealistic scenarios

### **3. Về phân tích kết quả**
✅ **Tốt:**
- Phân tích từng loại lỗi riêng biệt
- So sánh kết quả giữa các mức tải
- Xác định nguyên nhân gốc rễ của lỗi

❌ **Tránh:**
- Chỉ nhìn vào tổng thể success rate
- Bỏ qua chi tiết lỗi

### **4. Về automation**
✅ **Tốt:**
- Tự động hóa quy trình test bằng script
- Tạo template cho các test tương lai
- Lưu trữ kết quả có cấu trúc

❌ **Tránh:**
- Thực hiện thủ công lặp lại
- Không có quy trình chuẩn

---

## 🏆 Best Practices cho Load Testing

### **1. Chuẩn bị Test Environment**
`ash
# Tạo Docker image với Java 11 + JMeter
FROM eclipse-temurin:11-jre
RUN wget -q https://downloads.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz && \
    tar -xzf apache-jmeter-5.6.3.tgz && \
    mv apache-jmeter-5.6.3 /opt/jmeter
ENV JMETER_HOME /opt/jmeter
ENV PATH /bin:
`

### **2. Chạy Load Test**
`ash
# Chạy JMeter trong Docker container
docker run --rm --entrypoint /opt/jmeter/bin/jmeter \
  -v C:\Users\ThuanLT11\Documents\Thuan\MCP:/tests -w /tests jmeter-java11 \
  -n -t test_plan.jmx -l results.jtl -e -o report
`

### **3. Thiết kế Test Plan**
`xml
<!-- Thread Group Configuration -->
<stringProp name=