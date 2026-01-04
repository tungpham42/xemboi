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
import { StarOutlined, CompassOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
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

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const onFinish = async (values: FormValues) => {
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
                initialValues={{ viewYear: "2026", gender: "Nam" }}
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
                        <Option value="2025">2025 (Ất Tỵ)</Option>
                        <Option value="2026">2026 (Bính Ngọ)</Option>
                        <Option value="2027">2027 (Đinh Mùi)</Option>
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
                </div>

                <div className="markdown-content">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                  >
                    {result}
                  </ReactMarkdown>
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
