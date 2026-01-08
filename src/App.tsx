import React, { useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Button,
  Card,
  Typography,
  Row,
  Col,
  ConfigProvider,
  message,
  Spin,
  theme,
} from "antd";
import {
  StarOutlined,
  CompassOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import html2pdf from "html2pdf.js";
import "./App.css";

// --- IMPORT TIẾNG VIỆT ---
import viVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";
dayjs.locale("vi");

// --- Cấu hình ---
const { Title, Text } = Typography;
const { Option } = Select;

// REMOVED: Groq initialization and API Key access

// --- Interface ---
interface FormValues {
  fullName: string;
  dob: dayjs.Dayjs;
  birthTime: dayjs.Dayjs;
  gender: string;
  viewYear: string;
}

// --- Helper: Tính Can Chi ---
const getLunarYearName = (year: number) => {
  const can = [
    "Canh",
    "Tân",
    "Nhâm",
    "Quý",
    "Giáp",
    "Ất",
    "Bính",
    "Đinh",
    "Mậu",
    "Kỷ",
  ];
  const chi = [
    "Thân",
    "Dậu",
    "Tuất",
    "Hợi",
    "Tý",
    "Sửu",
    "Dần",
    "Mão",
    "Thìn",
    "Tỵ",
    "Ngọ",
    "Mùi",
  ];
  return `${can[year % 10]} ${chi[year % 12]}`;
};

// --- Helper: Tạo danh sách 10 năm tới ---
const currentYear = dayjs().year();
const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const year = currentYear + i;
  return {
    value: year.toString(),
    label: `${year} (${getLunarYearName(year)})`,
  };
});

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [pdfInfo, setPdfInfo] = useState({ name: "", year: "" });

  const onFinish = async (values: FormValues) => {
    setPdfInfo({ name: values.fullName, year: values.viewYear });
    setLoading(true);
    setResult("");

    try {
      const inputData = {
        name: values.fullName,
        dateOfBirth: values.dob.format("DD/MM/YYYY"),
        timeOfBirth: values.birthTime
          ? values.birthTime.format("HH:mm")
          : "Không rõ",
        gender: values.gender,
        year: values.viewYear,
      };

      // --- CHANGED: Call Netlify Function instead of direct SDK ---
      const response = await fetch("/.netlify/functions/get-fortune", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch fortune");
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối hoặc máy chủ bận.");
    } finally {
      setLoading(false);
    }
  };

  // --- Hàm xử lý tải PDF ---
  const handleDownloadPDF = () => {
    const element = document.getElementById("fortune-result");
    if (!element) return;

    const fileName = `${pdfInfo.name}-${pdfInfo.year}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: fileName,
      image: { type: "jpeg" as const, quality: 0.98 },

      // --- CẤU HÌNH NGẮT TRANG (SỬA ĐỔI) ---
      enableLinks: false, // Tắt link để tránh lỗi render
      pagebreak: {
        mode: ["css", "avoid-all"], // Chỉ dùng mode CSS, bỏ legacy để tránh xung đột
        before: ".page-break-before", // Class chủ động ngắt trang nếu cần
        avoid: "tr, td, li, h1, h2, h3, h4, h5, h6", // Tránh cắt ngang dòng trong bảng (nếu có)
      },
      letterRendering: true,

      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        // Ép chiều rộng cố định để giao diện lúc in không bị vỡ theo màn hình điện thoại/laptop
        windowWidth: 1200,
        // @ts-ignore
        onclone: (clonedDoc: Document) => {
          const target = clonedDoc.getElementById("fortune-result");

          if (target) {
            const style = clonedDoc.createElement("style");
            style.innerHTML = `
              /* 1. RESET TRIỆT ĐỂ: Dùng font hệ thống để tính toán chiều cao chính xác nhất */
              #fortune-result, #fortune-result * {
                font-family: "Times New Roman", Times, serif !important;
                color: #000000 !important;
                background: transparent !important;
                box-shadow: none !important;
                text-shadow: none !important;
                overflow: visible !important;
              }

              /* 2. Ép Layout đơn giản hóa */
              #fortune-result {
                padding: 10px !important;
                width: 100% !important;
                max-width: 100% !important;
              }

              /* 3. XỬ LÝ KHÔNG CẮT DÒNG (QUAN TRỌNG NHẤT) */
              /* Biến mọi thứ thành block để html2pdf dễ tính toán khoảng trắng */
              p, h1, h2, h3, h4, li, div {
                display: block !important;
                float: none !important;
              }

              /* Lệnh cấm cắt đôi phần tử */
              p, h1, h2, h3, h4, h5, h6, li, blockquote, img, tr, th, td {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                
                /* Thêm margin dưới để tạo khoảng an toàn cho dao cắt */
                margin-bottom: 15px !important; 
                
                /* Reset line-height chuẩn */
                line-height: 1.5 !important;
              }

              /* Tiêu đề luôn dính với nội dung bên dưới (không nằm trơ trọi cuối trang) */
              h1, h2, h3, h4 {
                page-break-after: avoid !important;
                margin-top: 30px !important;
                border-bottom: 1px solid #000 !important;
              }

              /* Các thành phần rác của Ant Design */
              .ant-btn, .ant-message, .ant-modal, .hidden-print { 
                display: none !important; 
              }

              /* --- KHẮC PHỤC LỖI CẮT TABLE (QUAN TRỌNG NHẤT) --- */
              
              /* 1. Đảm bảo bảng không bị tràn lề */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-bottom: 20px !important;
                background: transparent !important;
                border: 1px solid #333 !important;
              }

              /* 2. Cấm cắt ngang dòng (tr) và ô (td) */
              tr, td, th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-before: auto !important;
                page-break-after: auto !important;
              }

              /* 3. Tăng độ thoáng cho ô để dao cắt dễ nhận diện */
              td, th {
                padding: 8px !important;
                vertical-align: top !important; /* Đẩy chữ lên trên để nếu bị cắt dưới đáy thì không mất chữ */
                border: 1px solid #333 !important; /* Kẻ bảng rõ ràng */
              }

              /* 4. Xử lý phần Header của bảng (Lặp lại header khi sang trang - tuỳ trình duyệt hỗ trợ) */
              thead {
                display: table-header-group !important;
              }
              tfoot {
                display: table-footer-group !important;
              }
              
              /* 5. Fallback: Nếu bảng quá dài, ép nó hiển thị dạng block (chỉ dùng nếu cách trên vẫn lỗi) */
              /* Bỏ comment đoạn dưới nếu bảng vẫn bị vỡ nát */
              /*
              @media print {
                tr { display: block !important; border: 1px solid #000 !important; margin-bottom: 10px !important; }
                td { display: block !important; border: none !important; }
              } 
              */
            `;
            clonedDoc.body.appendChild(style);
          }
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  // ... (The rest of your UI/JSX remains exactly the same)
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#ffd700",
          colorBgContainer: "#1f1b33",
          colorBorder: "#4a4a6a",
          fontFamily: "'Lora', serif",
          fontSize: 16,
          borderRadius: 8,
          colorText: "#e6e6e6",
          colorTextPlaceholder: "rgba(255,255,255,0.4)",
        },
        components: {
          Button: {
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            colorPrimary: "#ffd700",
            algorithm: true,
          },
          Typography: {
            fontFamily: "'Playfair Display', serif",
          },
        },
      }}
    >
      <div className="mystic-bg" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "40px 15px",
          minHeight: "100vh",
        }}
      >
        <Row justify="center">
          <Col xs={24} md={20} lg={16} xl={14}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>☯️</div>
              <Title
                level={1}
                style={{
                  color: "#ffd700",
                  margin: 0,
                  fontSize: "3rem",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Thiên Cơ Các
              </Title>
              <Text style={{ fontSize: "1.1rem", color: "#b0b0d0" }}>
                Luận giải vận mệnh phương Đông: Sự Nghiệp, Tài Lộc, Tình Cảm &
                Sức Khỏe
              </Text>
            </div>

            <Card
              bordered={false}
              style={{
                background: "rgba(30, 25, 50, 0.85)",
                backdropFilter: "blur(15px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255, 215, 0, 0.15)",
              }}
            >
              <Form
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  viewYear: currentYear.toString(),
                  gender: "Nam",
                }}
                size="large"
              >
                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item
                      label={
                        <span style={{ fontSize: 17, color: "#ffd700" }}>
                          Họ và Tên
                        </span>
                      }
                      name="fullName"
                      rules={[
                        { required: true, message: "Vui lòng điền họ tên" },
                      ]}
                    >
                      <Input
                        prefix={<StarOutlined style={{ color: "#ffd700" }} />}
                        placeholder="Nhập họ tên đầy đủ..."
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={
                        <span style={{ fontSize: 17, color: "#ffd700" }}>
                          Ngày sinh (Dương lịch)
                        </span>
                      }
                      name="dob"
                      rules={[
                        { required: true, message: "Vui lòng chọn ngày sinh" },
                      ]}
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                        placeholder="Ngày / Tháng / Năm"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={
                        <span style={{ fontSize: 17, color: "#ffd700" }}>
                          Giờ sinh
                        </span>
                      }
                      name="birthTime"
                    >
                      <TimePicker
                        format="HH:mm"
                        style={{ width: "100%" }}
                        placeholder="Giờ : Phút"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={12}>
                    <Form.Item
                      name="gender"
                      label={
                        <span style={{ fontSize: 17, color: "#ffd700" }}>
                          Giới tính
                        </span>
                      }
                    >
                      <Select>
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={12}>
                    <Form.Item
                      name="viewYear"
                      label={
                        <span style={{ fontSize: 17, color: "#ffd700" }}>
                          Năm xem hạn
                        </span>
                      }
                    >
                      <Select>
                        {yearOptions.map((opt) => (
                          <Option key={opt.value} value={opt.value}>
                            {opt.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  icon={<CompassOutlined />}
                  style={{
                    marginTop: 15,
                    height: 52,
                    fontSize: "1.2rem",
                    background:
                      "linear-gradient(90deg, #ffd700 0%, #d4af37 100%)",
                    color: "#240b36",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
                  }}
                >
                  {loading ? "ĐANG LUẬN GIẢI..." : "XEM VẬN MỆNH"}
                </Button>
              </Form>
            </Card>

            {result && (
              <Card
                style={{
                  marginTop: 30,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255, 215, 0, 0.2)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: 15,
                    marginBottom: 20,
                  }}
                >
                  <Title level={3} style={{ color: "#ffd700", margin: 0 }}>
                    📜 Lá Số Luận Giải
                  </Title>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadPDF}
                    style={{
                      borderColor: "#ffd700",
                      color: "#ffd700",
                      background: "transparent",
                    }}
                  >
                    Tải PDF
                  </Button>
                </div>

                {/* Thêm ID fortune-result vào đây để html2pdf chụp ảnh phần này */}
                <div
                  id="fortune-result"
                  className="markdown-content"
                  style={{ padding: "10px" }}
                >
                  {/* Thêm tiêu đề vào file PDF cho đẹp (tuỳ chọn) */}
                  <div
                    style={{
                      textAlign: "center",
                      marginBottom: 20,
                      borderBottom: "1px dashed #555",
                    }}
                  >
                    <h2
                      style={{ color: "#ffd700", textTransform: "uppercase" }}
                    >
                      Luận Giải Vận Mệnh
                    </h2>
                    <p style={{ color: "#ccc" }}>
                      Tín chủ: <strong>{pdfInfo.name}</strong> - Năm:{" "}
                      <strong>{pdfInfo.year}</strong>
                    </p>
                  </div>

                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {result}
                  </ReactMarkdown>

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 30,
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    <p>--- Thiên Cơ Các ---</p>
                  </div>
                </div>
              </Card>
            )}

            {loading && (
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <Spin size="large" />
                <p
                  style={{
                    marginTop: 15,
                    color: "#b0b0d0",
                    fontSize: "1.1rem",
                  }}
                >
                  Thầy đang gieo quẻ...
                </p>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default App;
