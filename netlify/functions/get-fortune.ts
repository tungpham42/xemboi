import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- CONFIGURATION ---
// Define a priority list of models to try.
// If the first one fails (429/500), the system will try the next one.
const MODELS = [
  "openai/gpt-oss-120b", // Model chính
  "openai/gpt-oss-20b", // Model dự phòng
  "llama-3.3-70b-versatile", // Model thông minh nhất
  "llama-3.1-8b-instant", // Model nhanh nhất
  "mixtral-8x7b-32768", // Model dự phòng
];

// --- RECURSIVE HELPER FUNCTION ---
/**
 * Recursively attempts to get a chat completion.
 * If a 429 or 5xx error occurs, it switches to the next model in the list.
 */
const getChatCompletion = async (
  messages: any[],
  modelIndex: number = 0
): Promise<string> => {
  // Base Case: If we've run out of models to try, throw an error.
  if (modelIndex >= MODELS.length) {
    throw new Error("All models failed to respond.");
  }

  const currentModel = MODELS[modelIndex];

  try {
    console.log(`Attempting with model: ${currentModel}`);

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: currentModel,
      temperature: 0.6,
      max_tokens: 16384,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error: any) {
    const status = error?.status || error?.statusCode || 500;

    // Check if the error is a Rate Limit (429) or Server Error (5xx)
    if (status === 429 || (status >= 500 && status < 600)) {
      console.warn(
        `Model ${currentModel} failed with status ${status}. Switching to backup...`
      );
      // RECURSIVE CALL: Try the next model (index + 1)
      return getChatCompletion(messages, modelIndex + 1);
    }

    // If it's a client error (e.g., 400 Bad Request, 401 Unauthorized),
    // do not retry. Throw immediately.
    console.error(`Fatal error with model ${currentModel}:`, error);
    throw error;
  }
};

// --- MAIN HANDLER ---
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { name, dateOfBirth, timeOfBirth, gender, year } = data;

    if (!name || !dateOfBirth) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const prompt = `
      Đóng vai một chuyên gia Tử Vi Đẩu Số và Phong Thủy lâu năm.
      Hãy luận giải vận mệnh năm ${year} cho tín chủ:
      - Họ tên: ${name}
      - Sinh ngày: ${dateOfBirth} - Giờ: ${timeOfBirth}
      - Giới tính: ${gender}

      Yêu cầu luận giải:
      1. Giọng văn: Trang trọng, huyền học nhưng ngôn từ hiện đại, dễ hiểu, tích cực.
      2. Định dạng: Markdown rõ ràng.
      
      Nội dung chi tiết:
      1. **Tổng Quan**: Sao chiếu mệnh, hạn tuổi.
      2. **Sự Nghiệp**: Cơ hội và thách thức.
      3. **Tài Lộc**: Tiền tài vào ra.
      4. **Tình Cảm**: Gia đạo, nhân duyên.
      5. **Sức Khỏe**: Lưu ý các bệnh tật.
      
      Kết luận bằng một lời khuyên tâm đắc nhất.
    `;

    const messages = [
      {
        role: "system",
        content: "Bạn là chuyên gia tử vi. Trả lời chi tiết bằng Markdown.",
      },
      { role: "user", content: prompt },
    ];

    // Call the recursive function starting at index 0
    const result = await getChatCompletion(messages, 0);

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (error: any) {
    console.error("Handler Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
    };
  }
};
