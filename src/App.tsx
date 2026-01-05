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
      margin: [15, 15, 15, 15] as [number, number, number, number], // Tăng lề lên 1 chút để thoáng
      filename: fileName,
      image: { type: "jpeg" as const, quality: 0.98 },

      // --- CẤU HÌNH NGẮT TRANG (QUAN TRỌNG) ---
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"], // Cố gắng tránh cắt ngang tất cả các thẻ
        // Chỉ định rõ các thẻ không được phép cắt đôi
        avoid: [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "p",
          "span",
          "div",
          "strong",
          "em",
          "b",
          "i",
          "ol",
          "ul",
          "li",
          "hr",
          "blockquote",
          "thead",
          "tbody",
          "tr",
          "td",
          "br",
        ],
      },

      html2canvas: {
        scale: 2, // Tăng độ nét
        useCORS: true,
        letterRendering: true, // Giúp render chữ rõ hơn
        scrollY: 0,
        // @ts-ignore
        onclone: (clonedDoc: Document) => {
          const target = clonedDoc.getElementById("fortune-result");

          if (target) {
            // TẠO STYLE GHI ĐÈ
            const style = clonedDoc.createElement("style");
            style.innerHTML = `
              /* 1. Cấu hình màu sắc (Trắng/Đen) */
              #fortune-result {
                background-color: #FFFFFF !important;
                color: #000000 !important;
                padding: 20px !important;
                height: auto !important; /* Đảm bảo chiều cao tự động mở rộng */
                width: 100% !important;
              }
              
              #fortune-result * {
                color: #000000 !important;
                background-color: transparent !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }

              /* 2. Cấu hình Font chữ và khoảng cách cho dễ đọc khi in */
              #fortune-result p, #fortune-result li {
                font-size: 14px !important;
                line-height: 1.6 !important; /* Giãn dòng để tránh bị dính khi cắt trang */
                margin-bottom: 12px !important;
                text-align: justify !important; /* Căn đều 2 bên cho đẹp */
              }

              #fortune-result h1, #fortune-result h2, #fortune-result h3 {
                 margin-top: 20px !important;
                 margin-bottom: 10px !important;
                 border-bottom: 1px solid #000 !important; /* Thêm gạch chân đen cho tiêu đề */
                 padding-bottom: 5px !important;
              }

              /* 3. QUAN TRỌNG: CSS BẮT BUỘC KHÔNG NGẮT GIỮA DÒNG */
              p, h1, h2, h3, h4, h5, h6, li, blockquote, div, span, strong, em, b, i, ol, ul, hr, br, thead, tbody, td, th, tr, br, hr {
                page-break-inside: avoid !important; /* Chuẩn in ấn cũ */
                break-inside: avoid !important;      /* Chuẩn hiện đại */
              }

              /* Ẩn các thành phần thừa */
              .ant-btn { display: none !important; }
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
