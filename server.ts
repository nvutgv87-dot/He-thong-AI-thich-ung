import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI on server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction enforcing educational ethics and neutral language
const SYSTEM_ETHICS_INSTRUCTION = `
Bạn là trợ lý AI chuyên nghiệp thuộc hệ thống "ADAPTIVE STUDENT SUPPORT AI" (Hệ thống AI thích ứng hỗ trợ học tập cho học sinh THPT).
QUY TẮC BẮT BUỘC:
1. KHÔNG BAO GIỜ chẩn đoán y khoa, bệnh lý, rối loạn tâm thần hay kết luận tâm lý học.
2. TUYỆT ĐỐI KHÔNG gán nhãn học sinh (CẤM các từ: "lười", "kém", "thiếu ý thức", "mất tập trung", "bệnh", "rối loạn", "học sinh cá biệt").
3. Luôn sử dụng ngôn ngữ trung tính, tôn trọng, hướng tới sự nâng đỡ và can thiệp giáo dục:
   - "Đang có dấu hiệu cần quan sát thêm"
   - "Có xu hướng giảm mức độ tham gia học tập"
   - "Có biểu hiện trì hoãn nhiệm vụ"
   - "Cần thêm dữ liệu để xác định xu hướng"
   - "Đề xuất giáo viên kiểm tra và hỗ trợ"
4. So sánh học sinh với CHÍNH LỊCH SỬ CỦA HỌC SINH (Personal baseline), không so sánh đối đầu học sinh này với học sinh khác.
5. Quyết định cuối cùng luôn thuộc về giáo viên (Human-in-the-loop).
6. Phản hồi luôn bằng tiếng Việt, rõ ràng, thực tiễn sư phạm, có cơ sở dữ liệu.
`;

// Health check & status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    service: 'ADAPTIVE STUDENT SUPPORT AI Engine',
    model: 'gemini-3.8-flash',
  });
});

// Explain a warning signal
app.post('/api/ai/explain-signal', async (req, res) => {
  const { studentCode, signalType, baseline, currentMetrics, observedWeeks, contextNotes } = req.body;

  if (!ai || !apiKey) {
    return res.json({
      fallback: true,
      explanation: {
        whatIsChanging: `Trong các tuần gần đây, các chỉ số liên quan đến ${signalType === 'TRÌ_HOÃN_NHIỆM_VỤ' ? 'thời gian hoàn thành bài tập' : 'mức độ tham gia lớp học'} có sự thay đổi so với baseline ban đầu.`,
        sinceWhen: `Bắt đầu ghi nhận từ tuần thứ ${observedWeeks?.[0] || 'gần đây'}.`,
        supportingData: [
          `Tỷ lệ đúng hạn hiện tại so với baseline: ${currentMetrics?.onTimeRate ?? 'N/A'}% vs ${baseline?.onTimeRate ?? 'N/A'}%`,
          `Mức độ tương tác trung bình: ${currentMetrics?.participationLevel ?? 'N/A'}/5`,
          `Số nhiệm vụ quá hạn: ${currentMetrics?.overdueCount ?? 0} bài`,
        ],
        occurrenceCount: observedWeeks?.length || 2,
        missingData: ['Cần bổ sung tự đánh giá của học sinh', 'Chưa có nhật ký quan sát giờ làm việc nhóm'],
        potentialContextFactors: [
          'Khối lượng bài tập môn khác tăng đột biến trong kỳ thi giữa kỳ',
          'Khó khăn trong khâu bắt đầu các nhiệm vụ viết dài',
          'Cần thêm trao đổi ngắn 1-1 với giáo viên để hiểu bối cảnh cá nhân',
        ],
        recommendedObservations: [
          'Quan sát thời điểm học sinh mở file bài tập đầu tiên sau khi được giao',
          'Ghi nhận mức độ chủ động giơ tay hoặc thảo luận trong 2 tiết tiếp theo',
        ],
        transparencyRationale: 'Phân tích dựa trên thuật toán so sánh với baseline 4 tuần đầu, không gán nhãn tính cách học sinh.',
      },
    });
  }

  try {
    const prompt = `
Phân tích tín hiệu cảnh báo cho học sinh mã số ${studentCode}:
- Loại tín hiệu: ${signalType}
- Dữ liệu cơ sở (Baseline cá nhân): ${JSON.stringify(baseline)}
- Dữ liệu hiện tại: ${JSON.stringify(currentMetrics)}
- Các tuần ghi nhận tín hiệu: ${JSON.stringify(observedWeeks)}
- Ghi chú quan sát: ${contextNotes || 'Chưa có ghi chú đặc biệt'}

Hãy trả về phản hồi dạng JSON với cấu trúc:
{
  "whatIsChanging": "Mô tả trung tính điều gì đang thay đổi",
  "sinceWhen": "Thời điểm bắt đầu thay đổi",
  "supportingData": ["chỉ báo 1", "chỉ báo 2", "chỉ báo 3"],
  "occurrenceCount": số lần xuất hiện tín hiệu (số nguyên),
  "missingData": ["dữ liệu còn thiếu cần thu thập thêm"],
  "potentialContextFactors": ["nguyên nhân sư phạm/bối cảnh cần kiểm tra thêm"],
  "recommendedObservations": ["hành vi cụ thể giáo viên nên quan sát tiếp"],
  "transparencyRationale": "Giải thích logic vì sao hệ thống đưa ra cảnh báo này"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_ETHICS_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ fallback: false, explanation: parsed });
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tạo giải thích từ AI' });
  }
});

// Propose personalized intervention plan
app.post('/api/ai/propose-intervention', async (req, res) => {
  const { studentCode, signalType, delayPattern, strengths, difficulties, currentGoal } = req.body;

  if (!ai || !apiKey) {
    return res.json({
      fallback: true,
      plan: {
        title: signalType === 'TRÌ_HOÃN_NHIỆM_VỤ' ? 'Kế hoạch vi phân nhiệm vụ & nhắc hạn đa tầng' : 'Kế hoạch tăng cường gắn kết vi mô trong tiết học',
        goal: 'Hỗ trợ học sinh thiết lập nhịp bắt đầu bài tập sớm hơn và duy trì tương tác ổn định',
        targetArea: signalType === 'TRÌ_HOÃN_NHIỆM_VỤ' ? 'CHIA_NHỎ_NHIỆM_VỤ' : 'TƯƠNG_TÁC_NGẮN',
        strategyDescription: 'Chia bài tập 45 phút thành 3 chặng 15 phút. Thiết lập lời nhắc thân thiện trước hạn nộp 24 giờ. Giáo viên phản hồi nhanh bằng lời khích lệ ngắn.',
        microTasks: [
          'Chặng 1: Đọc đề bài và viết 2 câu mở ý đầu tiên (10 phút)',
          'Chặng 2: Hoàn thành phần thân bài cơ bản (20 phút)',
          'Chặng 3: Rà soát lỗi và nộp bản sơ thảo (15 phút)',
        ],
        teacherRoleAction: 'Trao đổi ngắn 2 phút đầu giờ, kiểm tra chặng 1 đã hoàn thành chưa thay vì đợi đến hạn chót.',
        successCriteria: 'Hoàn thành 80% nhiệm vụ đúng hạn trong 2 tuần liên tiếp; tự đánh giá mức độ chủ động đạt điểm 4/5.',
        durationWeeks: 2,
      },
    });
  }

  try {
    const prompt = `
Đề xuất kế hoạch can thiệp sư phạm cá nhân hóa cho học sinh ${studentCode}:
- Tín hiệu hiện tại: ${signalType}
- Thói quen/Biểu hiện: ${delayPattern || 'Có xu hướng bắt đầu bài tập sát giờ hạn chót'}
- Điểm mạnh đã ghi nhận: ${strengths || 'Tư duy tốt khi làm việc với chủ đề yêu thích'}
- Khó khăn hiện tại: ${difficulties || 'Khó bắt đầu với các nhiệm vụ dài hạn'}
- Mục tiêu cá nhân: ${currentGoal || 'Duy trì kết quả học tập ổn định'}

Hãy trả về phản hồi dạng JSON với cấu trúc:
{
  "title": "Tên kế hoạch mang tính tích cực, sư phạm",
  "goal": "Mục tiêu cụ thể, đo lường được trong 2-3 tuần",
  "targetArea": "CHIA_NHỎ_NHIỆM_VỤ" hoặc "TƯƠNG_TÁC_NGẮN" hoặc "NHẮC_NHỞ_CHỦ_ĐỘNG" hoặc "TỰ_QUẢN_TIẾN_ĐỘ",
  "strategyDescription": "Mô tả chiến lược can thiệp sư phạm",
  "microTasks": ["bước nhỏ 1 (thời lượng cụ thể)", "bước nhỏ 2", "bước nhỏ 3"],
  "teacherRoleAction": "Hành động cụ thể của giáo viên trong lớp học",
  "successCriteria": "Tiêu chí đo lường rõ ràng sau 2 tuần",
  "durationWeeks": 2
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_ETHICS_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ fallback: false, plan: parsed });
  } catch (error: any) {
    console.error('Error generating intervention:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi đề xuất can thiệp' });
  }
});

// Synthesize before/after progress report
app.post('/api/ai/synthesize-report', async (req, res) => {
  const { studentCode, beforeMetrics, afterMetrics, interventionTitle, teacherFeedback } = req.body;

  if (!ai || !apiKey) {
    return res.json({
      fallback: true,
      synthesis: {
        trendSummary: `Sau giai đoạn thực hiện "${interventionTitle}", dữ liệu học tập ghi nhận sự chuyển biến tích cực ở tỷ lệ nộp bài đúng hạn và mức độ tham gia.`,
        keyImprovements: [
          `Tỷ lệ đúng hạn thay đổi từ ${beforeMetrics?.onTimeRate ?? 50}% lên ${afterMetrics?.onTimeRate ?? 85}%`,
          `Số nhiệm vụ quá hạn giảm từ ${beforeMetrics?.overdueCount ?? 3} xuống ${afterMetrics?.overdueCount ?? 0}`,
          `Học sinh phản hồi các bước chia nhỏ 15 phút giúp giảm áp lực bắt đầu công việc`,
        ],
        teacherAssessmentAlignment: teacherFeedback?.notes || 'Giáo viên ghi nhận học sinh có tinh thần hợp tác tốt và duy trì nhịp độ ổn định hơn.',
        recommendationForNextPhase: 'Từng bước chuyển giao quyền tự quản cho học sinh, giảm dần tần suất nhắc nhở để củng cố tính chủ động lâu dài.',
        neutralDisclaimer: 'Báo cáo dựa trên đối sánh định lượng trước - sau can thiệp và nhật ký phản hồi, không tuyên bố kết luận năng lực tuyệt đối.',
      },
    });
  }

  try {
    const prompt = `
Tổng hợp báo cáo tiến bộ sư phạm trước và sau can thiệp cho học sinh ${studentCode}:
- Tên kế hoạch can thiệp: ${interventionTitle}
- Dữ liệu trước can thiệp: ${JSON.stringify(beforeMetrics)}
- Dữ liệu sau can thiệp: ${JSON.stringify(afterMetrics)}
- Đánh giá của giáo viên: ${JSON.stringify(teacherFeedback)}

Hãy trả về phản hồi dạng JSON với cấu trúc:
{
  "trendSummary": "Tóm lược khách quan xu hướng thay đổi của dữ liệu",
  "keyImprovements": ["điểm cải thiện 1", "điểm cải thiện 2", "điểm cải thiện 3"],
  "teacherAssessmentAlignment": "Phân tích mức độ tương thích giữa số liệu và quan sát thực tế",
  "recommendationForNextPhase": "Khuyến nghị giai đoạn tiếp theo (chuyển giao tự quản, duy trì hay điều chỉnh)",
  "neutralDisclaimer": "Tuyên bố trung tính về giới hạn dữ liệu"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_ETHICS_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ fallback: false, synthesis: parsed });
  } catch (error: any) {
    console.error('Error synthesizing report:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi tổng hợp báo cáo' });
  }
});

// Extract curriculum requirements and objectives (YCCĐ SGK Kết nối tri thức) from Image, Word, or PDF
app.post('/api/ai/extract-curriculum', async (req, res) => {
  const { fileType, base64Data, mimeType, rawText, subject = 'Hóa học', grade = 11 } = req.body;

  if (!ai || !apiKey) {
    // Return structured text fallback if no Gemini key
    return res.json({
      fallback: true,
      message: 'Hệ thống dùng bộ trích xuất nội bộ (offline mode)',
      extracted: {
        learningObjectives: rawText ? rawText.slice(0, 1500) : 'Trích xuất nội dung từ tệp tài liệu chuẩn SGK Kết nối tri thức.',
        chapter: '',
        topic: '',
        knowledgeContent: '',
        examTitle: '',
      },
    });
  }

  try {
    let contents: any[] = [];

    if (fileType === 'IMAGE' && base64Data) {
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const prompt = `
Bạn là chuyên gia sư phạm và khảo thí SGK Kết nối tri thức (môn ${subject} lớp ${grade} hoặc môn học tương ứng trong hình).
Hãy đọc kỹ hình ảnh trang tài liệu/sách giáo khoa/kế hoạch bài dạy này và trích xuất:
1. "learningObjectives": Yêu cầu cần đạt chuẩn SGK (YCCĐ) chi tiết, chuẩn xác theo 3 mức độ (BIẾT, HIỂU, VẬN DỤNG) hoặc các gạch đầu dòng rõ ràng.
2. "chapter": Tên chương/bài học nếu có (ví dụ: "Chương 3: Đại cương hóa học hữu cơ").
3. "topic": Chủ đề trọng tâm (ví dụ: "Hydrocarbon và dẫn xuất").
4. "knowledgeContent": Tóm tắt các khái niệm, quy tắc hoặc nội dung kiến thức cốt lõi.
5. "examTitle": Đề xuất tên đề kiểm tra phù hợp (ví dụ: "Đề kiểm tra định kỳ môn ${subject} lớp ${grade}").
6. "subject": Tên môn học nhận diện được (hoặc giữ nguyên "${subject}").
7. "grade": Khối lớp nhận diện được (hoặc giữ nguyên ${grade}).

Trả về định dạng JSON thuần túy:
{
  "learningObjectives": "chuỗi các yêu cầu cần đạt, mỗi yêu cầu 1 dòng có gạch đầu dòng",
  "chapter": "tên chương hoặc bài học",
  "topic": "tên chủ đề trọng tâm",
  "knowledgeContent": "nội dung kiến thức cốt lõi",
  "examTitle": "tiêu đề đề kiểm tra",
  "subject": "tên môn",
  "grade": số lớp
}
`;
      contents = [prompt, imagePart];
    } else {
      // Word or PDF extracted text
      const prompt = `
Bạn là chuyên gia sư phạm và khảo thí SGK Kết nối tri thức môn ${subject} lớp ${grade}.
Dưới đây là nội dung văn bản được trích xuất từ tài liệu (Word/PDF):
---
${(rawText || '').slice(0, 12000)}
---

Hãy phân tích và trích xuất chuẩn hóa:
1. "learningObjectives": Các Yêu cầu cần đạt chuẩn SGK (YCCĐ) theo 3 mức độ (BIẾT, HIỂU, VẬN DỤNG) hoặc danh sách gạch đầu dòng rõ ràng, sư phạm.
2. "chapter": Tên chương/bài học (nếu có).
3. "topic": Chủ đề trọng tâm.
4. "knowledgeContent": Tóm tắt kiến thức cốt lõi.
5. "examTitle": Tiêu đề đề kiểm tra phù hợp.
6. "subject": Tên môn học nếu văn bản đề cập rõ.
7. "grade": Khối lớp nếu có.

Trả về định dạng JSON thuần túy:
{
  "learningObjectives": "chuỗi các yêu cầu cần đạt chuẩn SGK, mỗi dòng có gạch đầu dòng",
  "chapter": "tên chương",
  "topic": "tên chủ đề",
  "knowledgeContent": "nội dung kiến thức cốt lõi",
  "examTitle": "tiêu đề đề kiểm tra gợi ý",
  "subject": "tên môn",
  "grade": số lớp
}
`;
      contents = [prompt];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_ETHICS_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    let rawJson = response.text || '{}';
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extracted = JSON.parse(rawJson);
    res.json({ fallback: false, extracted });
  } catch (err: any) {
    console.error('Error in /api/ai/extract-curriculum:', err);
    res.status(500).json({ error: err.message || 'Lỗi trích xuất tài liệu từ AI' });
  }
});

// AI Smart Exam Generator according to requested subject and curriculum content
app.post('/api/ai/generate-exam', async (req, res) => {
  const {
    subject = 'Hóa học',
    grade = 11,
    curriculum = 'Kết nối tri thức',
    chapter = '',
    topic = '',
    knowledgeContent = '',
    learningObjectives = '',
    teacherCustomPrompt = '',
    ratio = { know: 40, understand: 40, apply: 20 },
    structure = { part1Count: 12, part2Count: 2, part3Count: 6, part4Count: 1 },
    durationMinutes = 45,
  } = req.body;

  if (!ai || !apiKey) {
    return res.json({ fallback: true, message: 'AI API Key chưa được thiết lập, chuyển sang động cơ khảo thí nội bộ' });
  }

  try {
    const p1Pts = structure.part1Count > 0 ? +(5.0 / structure.part1Count).toFixed(3) : 0;
    const p2Pts = 1.0;
    const p3Pts = structure.part3Count > 0 ? +(1.5 / structure.part3Count).toFixed(3) : 0;
    const p4Pts = structure.part4Count > 0 ? +(1.5 / structure.part4Count).toFixed(3) : 0;

    const prompt = `
Bạn là chuyên gia sư phạm và khảo thí cấp quốc gia môn ${subject} cấp THPT (bộ sách SGK ${curriculum}).
Hãy tạo một đề kiểm tra hoàn chỉnh, chuẩn xác 100% bám sát nội dung yêu cầu cần đạt của chương trình:

THÔNG TIN BẮT BUỘC:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Chương/Bài học: ${chapter}
- Chủ đề trọng tâm: ${topic}
- Nội dung kiến thức bắt buộc: ${knowledgeContent}
- Yêu cầu cần đạt chuẩn SGK (YCCD): ${learningObjectives}
- Yêu cầu bổ sung của giáo viên: ${teacherCustomPrompt || 'Không có yêu cầu đặc biệt, bám sát chuẩn kiến thức kỹ năng.'}
- Thời gian làm bài: ${durationMinutes} phút
- Tổng thang điểm: đúng 10,0 điểm.

QUY TẮC MỨC ĐỘ NHẬN THỨC (BẮT BUỘC 3 MỨC):
- KNOW = BIẾT (${ratio.know}%): Nhớ, nhận diện, nêu định nghĩa, công thức, quy tắc của môn ${subject}.
- UNDERSTAND = HIỂU (${ratio.understand}%): Giải thích, phân biệt, so sánh, phân loại, giải thích hiện tượng theo kiến thức môn ${subject}.
- APPLY = VẬN DỤNG (${ratio.apply}%): Tính toán, áp dụng công thức giải quyết bài toán, xử lý tình huống thực tiễn môn ${subject}.

QUY ĐỊNH BẮT BUỘC VỀ YÊU CẦU CẦN ĐẠT (YCCD) TRÊN TỪNG CÂU HỎI:
- Mỗi câu hỏi BẮT BUỘC có trường "curriculumRequirement" ghi rõ mục tiêu cần đạt cụ thể (Ví dụ: "Nêu được công thức tổng quát của alcohol no, đơn chức", "Giải thích được cơ chế dao động điều hòa", "Tính được giới hạn dãy số dạng phân thức", "Phân tích được hiệu quả nghệ thuật của biện pháp tu từ...").
- Câu hỏi PHẢI chứa dữ liệu thực tế: phương trình hóa học, biểu thức toán học, thông số vật lý, ngữ liệu văn học, đoạn mã lập trình hoặc câu tiếng Anh cụ thể. TUYỆT ĐỐI KHÔNG sinh câu hỏi giả định hình thức.

CẤU TRÚC 4 PHẦN ĐỀ KIỂM TRA BẮT BUỘC:
1. PHẦN I (${structure.part1Count} câu trắc nghiệm 4 lựa chọn):
   - Mỗi câu có content, options: [A, B, C, D], correctAnswer: 'A'|'B'|'C'|'D', points: ${p1Pts}, cognitive_level, explanation, curriculumRequirement.
2. PHẦN II (${structure.part2Count} câu trắc nghiệm Đúng/Sai):
   - Mỗi câu có content, points: ${p2Pts}, cognitive_level, curriculumRequirement, trueFalseItems gồm đúng 4 ý a, b, c, d. Mỗi ý có: label ('a'|'b'|'c'|'d'), statement (khẳng định khoa học cụ thể), isCorrect (true/false), cognitive_level ('KNOW'|'UNDERSTAND'|'APPLY').
3. PHẦN III (${structure.part3Count} câu trả lời ngắn):
   - Mỗi câu có content (hỏi 1 giá trị số hoặc thuật ngữ chính xác), shortAnswerKey (kết quả ngắn gọn), points: ${p3Pts}, cognitive_level, explanation, curriculumRequirement.
4. PHẦN IV (${structure.part4Count} câu tự luận):
   - Mỗi câu có content (bài toán/tình huống vận dụng thực tế), points: ${p4Pts}, sampleEssayAnswer (hướng dẫn giải chi tiết từng bước), essayRubric (các tiêu chí chấm kèm điểm), explanation, curriculumRequirement.

Trả về phản hồi dạng JSON thuần túy (không kèm markdown ngoài) theo cấu trúc:
{
  "title": "Tên đề kiểm tra phù hợp",
  "matrix": [
    {
      "topic": "${topic || chapter}",
      "chapter": "${chapter}",
      "knowCount": số câu,
      "understandCount": số câu,
      "applyCount": số câu,
      "knowPoints": số điểm,
      "understandPoints": số điểm,
      "applyPoints": số điểm,
      "totalPoints": 10.0,
      "percentage": 100
    }
  ],
  "specifications": [
    {
      "id": "spec_1",
      "chapter": "${chapter}",
      "topic": "${topic}",
      "competencyRequirement": "Yêu cầu cần đạt chi tiết của câu hỏi",
      "cognitive_level": "KNOW" | "UNDERSTAND" | "APPLY",
      "section": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY",
      "questionNumber": 1,
      "points": ${p1Pts},
      "questionPreview": "Tóm tắt nội dung câu hỏi..."
    }
  ],
  "questions": [
    {
      "id": "Q_1",
      "section": "MULTIPLE_CHOICE",
      "questionNumber": 1,
      "content": "Nội dung câu hỏi cụ thể...",
      "cognitive_level": "KNOW",
      "points": ${p1Pts},
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "Giải thích chi tiết...",
      "topic": "${topic}",
      "chapter": "${chapter}",
      "curriculumRequirement": "Yêu cầu cần đạt bám sát chương trình..."
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let rawText = response.text || '';
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(rawText || '{}');
    if (!parsed.questions || parsed.questions.length === 0) {
      return res.json({ fallback: true, message: 'Dữ liệu AI không đủ câu hỏi, chuyển sang bộ câu hỏi nội bộ' });
    }

    res.json({ fallback: false, examData: parsed });
  } catch (error: any) {
    console.error('Error generating exam from Gemini:', error);
    res.json({ fallback: true, error: error.message || 'Lỗi khi gọi Gemini' });
  }
});

// Vite middleware or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[ADAPTIVE STUDENT SUPPORT AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
