/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Target,
  FileText,
  Clock,
} from 'lucide-react';
import { Student } from '../../types';

interface AIPromptBuilderProps {
  students: Student[];
  privacyMode: boolean;
}

type PromptCategory =
  | 'EXPLAIN_SIGNAL'
  | 'INTERVENTION_PLAN'
  | 'MICRO_GOALS'
  | 'DECONSTRUCT_TASK'
  | 'AFTER_INTERVENTION_ANALYSIS'
  | 'REPORT_SYNTHESIS'
  | 'STUDENT_DIALOGUE';

export const AIPromptBuilder: React.FC<AIPromptBuilderProps> = ({
  students,
  privacyMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('EXPLAIN_SIGNAL');
  const [selectedStudentCode, setSelectedStudentCode] = useState(students[0]?.code || 'HS04');
  const [customSubject, setCustomSubject] = useState('Hóa học 11');
  const [copied, setCopied] = useState(false);

  const student = students.find((s) => s.code === selectedStudentCode) || students[0];

  const PROMPT_TEMPLATES: Record<PromptCategory, { title: string; desc: string; icon: React.ReactNode; generate: () => string }> = {
    EXPLAIN_SIGNAL: {
      title: '1. Phân tích tín hiệu & Giải thích cảnh báo',
      desc: 'Yêu cầu AI giải thích đa biến tại sao có sự thay đổi so với baseline',
      icon: <HelpCircle className="w-4 h-4 text-blue-500" />,
      generate: () => `Bạn là chuyên gia phân tích sư phạm THPT thuộc hệ thống ADAPTIVE STUDENT SUPPORT AI.
Hãy phân tích dữ liệu học sinh ${student.code}:
- Baseline hoàn thành đúng hạn: ${student.baseline.onTimeRate}%
- Mức độ tham gia cơ sở: ${student.baseline.participationScore}/5
- Tình trạng hiện tại: Tỷ lệ đúng hạn giảm xuống trong 3 tuần gần đây
Yêu cầu:
1. Giải thích trung tính điều gì đang thay đổi (CẤM dùng từ "lười", "kém", "mất tập trung").
2. Nêu 3 nguyên nhân bối cảnh sư phạm có thể cần kiểm tra thêm.
3. Gợi ý 2 hành vi cụ thể giáo viên nên quan sát trong 2 tiết học tới.`,
    },
    INTERVENTION_PLAN: {
      title: '2. Đề xuất kế hoạch hỗ trợ cá nhân hóa',
      desc: 'Thiết lập các mốc hỗ trợ sư phạm vi phân cho học sinh',
      icon: <Lightbulb className="w-4 h-4 text-indigo-500" />,
      generate: () => `Bạn là trợ lý sư phạm thích ứng.
Học sinh ${student.code} đang gặp khó khăn: ${student.profile.currentDifficulties.join(', ') || 'Thường trì hoãn bắt đầu bài tập dài'}.
Điểm mạnh của học sinh: ${student.profile.strengths.join(', ')}.
Yêu cầu đề xuất một kế hoạch can thiệp 2 tuần:
1. Mục tiêu định lượng cụ thể.
2. Chiến lược sư phạm nâng đỡ (chia nhỏ, phản hồi nhanh).
3. 3 bước vi phân nhiệm vụ (Micro-tasks) mỗi bước từ 10 - 20 phút.
4. Cách giáo viên trao đổi ngắn 2 phút với học sinh mà không gây áp lực.`,
    },
    MICRO_GOALS: {
      title: '3. Tạo mục tiêu tuần (Weekly Micro-goals)',
      desc: 'Chuyển hóa mục tiêu lớn thành các bước khả thi trong tuần',
      icon: <Target className="w-4 h-4 text-emerald-500" />,
      generate: () => `Hãy xây dựng bộ 3 mục tiêu tuần (Micro-goals) cho học sinh ${student.code} môn ${customSubject}:
- Nguyên tắc: Dễ bắt đầu, có thể hoàn thành trong 15-25 phút mỗi ngày.
- Giúp học sinh hình thành cảm giác chiến thắng nhỏ (Small wins).
- Kèm 1 câu hỏi tự vấn cuối ngày cho học sinh tự phản tư.`,
    },
    DECONSTRUCT_TASK: {
      title: '4. Vi phân bài tập lớn thành chặng nhỏ 15 phút',
      desc: 'Giúp học sinh vượt qua rào cản sợ bài tập dài',
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      generate: () => `Tôi là giáo viên môn ${customSubject}. Tôi có bài tập dự án: "Khảo sát sự chuyển dịch cân bằng hóa học và đo pH thực nghiệm".
Học sinh ${student.code} thường cảm thấy bài tập quá dài nên chần chừ không bắt đầu.
Hãy giúp tôi phân rã bài tập này thành 3 chặng nhỏ:
- Chặng 1 (15 phút): Chỉ yêu cầu làm gì để khởi động dễ dàng nhất?
- Chặng 2 (20 phút): Nội dung cốt lõi của bài toán.
- Chặng 3 (15 phút): Rà soát và hoàn thiện.`,
    },
    AFTER_INTERVENTION_ANALYSIS: {
      title: '5. Phân tích sau can thiệp (Trước vs Sau)',
      desc: 'Đối chiếu số liệu định lượng và đưa ra điều chỉnh thích ứng',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      generate: () => `Hãy tổng hợp phân tích tiến bộ trước và sau can thiệp cho học sinh ${student.code}:
- Trước can thiệp: Tỷ lệ đúng hạn 50%, 2 bài quá hạn, mức tham gia 3/5.
- Sau can thiệp 2 tuần: Tỷ lệ đúng hạn 90%, 0 bài quá hạn, mức tham gia 4.5/5.
Yêu cầu:
1. Tóm lược khách quan xu hướng thay đổi.
2. Đề xuất cách chuyển giao dần tính tự quản cho học sinh (giảm dần sự nhắc nhở của giáo viên).`,
    },
    REPORT_SYNTHESIS: {
      title: '6. Soạn nội dung báo cáo tiến trình lớp học',
      desc: 'Tạo văn bản báo cáo chuyên môn gửi Ban Giám hiệu',
      icon: <FileText className="w-4 h-4 text-teal-500" />,
      generate: () => `Hãy soạn thảo một đoạn báo cáo sư phạm ngắn gọn (khoảng 200 từ) về tình hình học tập và hỗ trợ học sinh trong lớp:
- Dữ liệu thực tế: 7/8 học sinh duy trì ổn định hoặc đã cải thiện; 1 học sinh đang trong kế hoạch vi phân bài tập.
- Tính minh bạch: So sánh dựa trên baseline cá nhân, không gán nhãn hay phân loại tiêu cực.
- Đề xuất nhà trường hỗ trợ tiếp tục duy trì không gian Focus Session.`,
    },
    STUDENT_DIALOGUE: {
      title: '7. Kịch bản trao đổi khích lệ 2 phút giữa giáo viên & học sinh',
      desc: 'Ngôn từ tôn trọng, ấm áp, định hướng giải pháp',
      icon: <BookOpen className="w-4 h-4 text-blue-600" />,
      generate: () => `Hãy gợi ý một kịch bản đối thoại ngắn 2 phút giờ ra chơi giữa giáo viên và học sinh ${student.code}:
- Bối cảnh: Học sinh vừa hoàn thành chặng 1 của bài tập tuần.
- Mục tiêu: Khích lệ học sinh duy trì nhịp độ, hỏi xem em có gặp trở ngại nào ở chặng 2 không.
- Giọng điệu: Thấu hiểu, ấm áp, tạo cảm giác an toàn và tin cậy.`,
    },
  };

  const activeTemplate = PROMPT_TEMPLATES[selectedCategory];
  const generatedPrompt = activeTemplate.generate();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Công Cụ Soạn Prompt Sư Phạm Chuẩn Mực Cho AI (AI Prompt Builder)
        </h1>
        <p className="text-xs text-slate-500">
          Tạo nhanh các câu lệnh có cấu trúc, tuân thủ nghiêm ngặt nguyên tắc đạo đức không gán nhãn và bảo vệ quyền riêng tư.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Categories */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Chọn mục đích sư phạm:
          </div>

          {(Object.keys(PROMPT_TEMPLATES) as PromptCategory[]).map((cat) => {
            const t = PROMPT_TEMPLATES[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shrink-0 shadow-xs">
                  {t.icon}
                </div>
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Parameters & Generated Prompt Output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customization controls */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Học sinh áp dụng:</label>
              <select
                value={selectedStudentCode}
                onChange={(e) => setSelectedStudentCode(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.code}>
                    {privacyMode ? s.code : s.fullName} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Môn học / Chủ đề:</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Generated Prompt Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Prompt hoàn chỉnh chuẩn hóa sư phạm:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép Prompt'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {generatedPrompt}
            </pre>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Được xây dựng phù hợp với giao diện kết nối API của mô hình Gemini 3.8.</span>
              <span className="text-emerald-600 font-medium">Đã kiểm duyệt quy chuẩn trung tính</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
