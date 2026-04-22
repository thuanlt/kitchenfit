import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng | ChickenFit",
  description: "Điều khoản sử dụng dịch vụ ChickenFit.",
};

const UPDATED = "21 tháng 4, 2026";
const EMAIL = "support@chickenfit.app";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ overflowY: "auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #4A7C59 0%, #B85C38 60%, #6B3A20 100%)",
        padding: "20px 20px 28px", color: "#fff",
      }}>
        <Link href="/me" style={{ color: "rgba(255,255,255,.8)", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Quay lại
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>Điều Khoản Sử Dụng</h1>
        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Terms of Service · Cập nhật: {UPDATED}</p>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Summary card */}
        <div style={{
          background: "#F0F7F2", border: "1.5px solid #4A7C59", borderRadius: 12,
          padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#2E4D37", lineHeight: 1.6,
        }}>
          Bằng cách sử dụng ChickenFit, bạn đồng ý tuân theo các điều khoản dưới đây.
          Ứng dụng <strong>miễn phí</strong> và cung cấp thông tin sức khỏe <strong>mang tính tham khảo</strong>, không thay thế tư vấn y tế chuyên nghiệp.
        </div>

        <Section title="1. Dịch vụ">
          <p>
            ChickenFit là ứng dụng web (PWA) cung cấp:
          </p>
          <Bullet>99 công thức chế biến ức gà cho người tập gym.</Bullet>
          <Bullet>Công cụ tính TDEE (nhu cầu calo hằng ngày) dựa trên thông tin cơ thể.</Bullet>
          <Bullet>Tạo meal plan 7 ngày tự động.</Bullet>
          <Bullet>Nhật ký cân nặng và bữa ăn.</Bullet>
          <p>
            Dịch vụ hiện tại <strong>hoàn toàn miễn phí</strong>. Chúng tôi có thể bổ sung tính năng cao cấp trong tương lai.
          </p>
        </Section>

        <Section title="2. Điều kiện sử dụng">
          <Bullet>Bạn phải từ <strong>15 tuổi</strong> trở lên.</Bullet>
          <Bullet>Cung cấp thông tin sức khỏe chính xác để có kết quả tính toán đúng.</Bullet>
          <Bullet>Không sử dụng ứng dụng để mục đích gây hại hoặc phổ biến thông tin sai lệch về sức khỏe.</Bullet>
          <Bullet>Mỗi người chỉ được tạo một tài khoản.</Bullet>
        </Section>

        <Section title="3. Giới hạn trách nhiệm về sức khỏe">
          <p>
            <strong>Quan trọng:</strong> Thông tin dinh dưỡng, calo, và macro trong ChickenFit
            chỉ mang tính <strong>tham khảo</strong> và được tính dựa trên các công thức khoa học phổ biến.
          </p>
          <Bullet>Chúng tôi không chịu trách nhiệm về kết quả tập luyện, sức khỏe, hoặc tình trạng y tế của bạn.</Bullet>
          <Bullet>Hãy tham khảo chuyên gia dinh dưỡng hoặc bác sĩ trước khi thay đổi chế độ ăn đáng kể.</Bullet>
          <Bullet>Nếu bạn có bệnh lý nền (tiểu đường, tim mạch, thận, v.v.), hãy tham khảo bác sĩ trước khi dùng.</Bullet>
        </Section>

        <Section title="4. Nội dung người dùng">
          <p>Dữ liệu bạn nhập (cân nặng, bữa ăn) thuộc về bạn. Chúng tôi không sử dụng dữ liệu này cho mục đích thương mại.</p>
        </Section>

        <Section title="5. Sở hữu trí tuệ">
          <Bullet>Toàn bộ nội dung ứng dụng (công thức, giao diện, code) thuộc sở hữu của ChickenFit.</Bullet>
          <Bullet>Bạn không được sao chép, tái bản, hoặc thương mại hóa nội dung mà không có sự đồng ý bằng văn bản.</Bullet>
          <Bullet>99 công thức ức gà trong ứng dụng là nội dung độc quyền của ChickenFit.</Bullet>
        </Section>

        <Section title="6. Tạm ngưng và chấm dứt">
          <p>
            Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản nếu bạn vi phạm điều khoản này,
            sau khi thông báo (trừ trường hợp vi phạm nghiêm trọng).
          </p>
          <p>
            Bạn có thể xóa tài khoản bất cứ lúc nào bằng cách liên hệ email hỗ trợ.
          </p>
        </Section>

        <Section title="7. Thay đổi điều khoản">
          <p>
            Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email và trong app ít nhất 14 ngày trước khi có hiệu lực.
            Tiếp tục sử dụng sau ngày có hiệu lực đồng nghĩa bạn chấp nhận điều khoản mới.
          </p>
        </Section>

        <Section title="8. Luật áp dụng">
          <p>
            Các điều khoản này được điều chỉnh bởi pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
            Mọi tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền tại Hà Nội.
          </p>
        </Section>

        {/* Contact */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--sep)", borderRadius: 16, padding: "16px 20px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Liên hệ</p>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, lineHeight: 1.6 }}>
            Câu hỏi về điều khoản:
          </p>
          <a href={`mailto:${EMAIL}`} style={{ fontSize: 14, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
            {EMAIL}
          </a>
        </div>

        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginTop: 24, lineHeight: 1.8 }}>
          <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "none" }}>
            ← Chính Sách Bảo Mật
          </Link>
        </p>
      </div>
    </div>
  );
}
