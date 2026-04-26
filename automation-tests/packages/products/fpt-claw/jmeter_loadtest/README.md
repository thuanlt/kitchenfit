# 🚀 FPTCLAW Load Testing - Quick Start Guide

## 📁 Cấu trúc thư mục

`
jmeter_loadtest/
├── README.md                          # Hướng dẫn sử dụng nhanh
├── LOAD_TEST_BEST_PRACTICES.md         # Tài liệu chi tiết best practices
├── load_test_dashboard.html            # Dashboard báo cáo kết quả
├── ui-chat-preprod.jmx                 # JMeter test plan (12 users)
├── ui-chat-preprod_new.jmx             # JMeter test plan gốc
├── results.jtl                         # Kết quả test gần nhất
├── report/                             # Thư mục báo cáo JMeter
├── Dockerfile                          # Docker image definition
└── jmeter.properties                   # JMeter configuration
`

## 🎯 Quick Start

### **1. Xem kết quả test**
Mở file load_test_dashboard.html trong trình duyệt web

### **2. Đọc tài liệu chi tiết**
Mở file LOAD_TEST_BEST_PRACTICES.md để xem:
- Tool và công nghệ sử dụng
- Quy trình thực hiện chi tiết
- Bài học rút ra
- Best practices
- Common issues & solutions

### **3. Chạy lại load test**
`ash
# Chạy với 12 users (ngưỡng tối ưu)
docker run --rm --entrypoint /opt/jmeter/bin/jmeter \
  -v 