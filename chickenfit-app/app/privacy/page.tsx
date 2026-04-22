import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | ChickenFit",
  description: "Chính sách bảo mật và quyền riêng tư của ứng dụng ChickenFit.",
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

export default function PrivacyPage() {
  return (
    <div style={{ overflowY: "auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #C9A227 0%, #B85C38 50%, #6B3A20 100%)",
        padding: "20px 20px 28px", color: "#fff",
      }}>
        <Link href="/me" style={{ color: "rgba(255,255,255,.8)", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 12 }}>
          ← Quay lại
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>Chính Sách Bảo Mật</h1>
        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Privacy Policy · Cập nhật: {UPDATED}</p>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Notice */}
        <div style={{
          background: "#FFF8E8", border: "1.5px solid #C9A227", borderRadius: 12,
          padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#7A5230", lineHeight: 1.6,
        }}>
          ChickenFit cam kết bảo vệ quyền riêng tư của bạn.
          Chúng tôi <strong>không bán</strong> dữ liệu của bạn cho bất kỳ bên thứ ba nào.
        </div>

        <Section title="1. Dữ liệu chúng tôi thu thập">
          <Bullet><strong>Tài khoản:</strong> địa chỉ email khi đăng ký.</Bullet>
          <Bullet><strong>Sức khỏe:</strong> giới tính, tuổi, cân nặng, chiều cao, mức vận động, mục tiêu (giảm mỡ / tăng cơ / duy trì).</Bullet>
          <Bullet><strong>Nhật ký:</strong> lịch sử cân nặng và bữa ăn bạn tự log.</Bullet>
          <Bullet><strong>Thiết bị:</strong> loại trình duyệt, hệ điều hành (chỉ để bảo mật, không định danh).</Bullet>
          <Bullet><strong>Push token:</strong> mã thiết bị để gửi thông báo — chỉ khi bạn cấp quyền.</Bullet>
        </Section>

        <Section title="2. Mục đích sử dụng">
          <Bullet>Tính TDEE và tạo meal plan cá nhân hóa theo mục tiêu của bạn.</Bullet>
          <Bullet>Hiển thị lịch sử và tiến trình cân nặng.</Bullet>
          <Bullet>Gửi thông báo nhắc nhở bữa ăn theo lịch bạn đã bật.</Bullet>
          <Bullet>Phân tích tổng hợp (dữ liệu không định danh) để cải thiện ứng dụng.</Bullet>
        </Section>

        <Section title="3. Bên thứ ba">
          <p>Chúng tôi chỉ chia sẻ dữ liệu với:</p>
          <Bullet>
            <strong>Supabase (supabase.com):</strong> lưu trữ database & xác thực. Máy chủ đặt tại EU (Frankfurt). Tuân thủ GDPR.{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>Xem chính sách ↗</a>
          </Bullet>
          <Bullet><strong>Cơ quan pháp luật:</strong> chỉ khi có yêu cầu hợp lệ theo pháp luật Việt Nam.</Bullet>
        </Section>

        <Section title="4. Bảo mật">
          <Bullet>Mật khẩu mã hóa bcrypt — chúng tôi không lưu mật khẩu gốc.</Bullet>
          <Bullet>Kết nối HTTPS/TLS toàn bộ.</Bullet>
          <Bullet>Row Level Security: bạn chỉ truy cập dữ liệu của chính mình.</Bullet>
          <Bullet>Access token hết hạn 1 giờ; tự gia hạn khi dùng app.</Bullet>
        </Section>

        <Section title="5. Quyền của bạn">
          <Bullet><strong>Truy cập & sửa:</strong> cập nhật hồ sơ bất cứ lúc nào (Hồ sơ → Sửa).</Bullet>
          <Bullet><strong>Xóa dữ liệu:</strong> nhấn "Đặt lại từ đầu" để xóa cục bộ, hoặc email chúng tôi để xóa khỏi server.</Bullet>
          <Bullet><strong>Rút đồng ý thông báo:</strong> tắt trong phần Cài đặt thông báo bất cứ lúc nào.</Bullet>
        </Section>

        <Section title="6. Dữ liệu cục bộ">
          <p>
            Ứng dụng lưu dữ liệu trên thiết bị của bạn (localStorage) để hoạt động offline —
            bao gồm hồ sơ, meal plan, và lịch sử cân nặng 30 ngày gần nhất.
            Xóa bằng cách xóa cache trình duyệt hoặc nhấn "Đặt lại từ đầu".
          </p>
        </Section>

        <Section title="7. Trẻ em">
          <p>ChickenFit không dành cho người dưới 15 tuổi. Nếu phát hiện tài khoản trẻ em, vui lòng liên hệ để chúng tôi xóa ngay.</p>
        </Section>

        <Section title="8. Thay đổi chính sách">
          <p>Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc banner trong app ít nhất 7 ngày trước.</p>
        </Section>

        {/* Contact card */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--sep)", borderRadius: 16, padding: "16px 20px",
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Liên hệ bảo mật</p>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6, lineHeight: 1.6 }}>
            Mọi câu hỏi về quyền riêng tư:
          </p>
          <a href={`mailto:${EMAIL}`} style={{ fontSize: 14, color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
            {EMAIL}
          </a>
          <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>Phản hồi trong 5 ngày làm việc.</p>
        </div>

        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginTop: 24, lineHeight: 1.8 }}>
          Bằng cách dùng ChickenFit, bạn đồng ý với chính sách này.<br />
          <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "none" }}>
            Xem Điều Khoản Sử Dụng →
          </Link>
        </p>
      </div>
    </div>
  );
}
