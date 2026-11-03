import React, { useState } from 'react';
import { StudentExamResult, ExamPaper } from '../../types/examTypes';
import { Student, LearningTask } from '../../types';
import { examService } from '../../services/examService';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Users,
  Sparkles,
  BookOpen,
  Filter,
  User,
  Plus,
  Send,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface AnalyticsTabProps {
  exams: ExamPaper[];
  students: Student[];
  currentStudent?: Student;
  userRole: 'TEACHER' | 'STUDENT';
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  exams,
  students,
  currentStudent,
  userRole,
}) => {
  const [results, setResults] = useState<StudentExamResult[]>(() =>
    examService.getExamResults()
  );
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    userRole === 'STUDENT' && currentStudent ? currentStudent.id : 'ALL'
  );

  // Filter results
  const filteredResults = results.filter((r) => {
    if (userRole === 'STUDENT' && currentStudent) {
      if (r.studentId !== currentStudent.id && r.studentCode !== currentStudent.code) {
        return false;
      }
    } else if (selectedStudentId !== 'ALL') {
      if (r.studentId !== selectedStudentId && r.studentCode !== selectedStudentId) {
        return false;
      }
    }

    if (selectedExamId !== 'ALL' && r.examId !== selectedExamId && r.examCode !== selectedExamId) {
      return false;
    }

    return true;
  });

  const totalCount = filteredResults.length;

  // Real statistics (no fake data)
  let avgScore = 0;
  let maxScore = 0;
  let minScore = 0;
  let passCount = 0;
  let avgKnowPct = 0;
  let avgUnderstandPct = 0;
  let avgApplyPct = 0;

  if (totalCount > 0) {
    const scores = filteredResults.map((r) => r.totalScore);
    avgScore = Math.round((scores.reduce((s, c) => s + c, 0) / totalCount) * 100) / 100;
    maxScore = Math.max(...scores);
    minScore = Math.min(...scores);
    passCount = scores.filter((s) => s >= 5.0).length;

    const knowSums = filteredResults.reduce(
      (s, r) => s + (r.cognitiveScores?.know?.percentage || 0),
      0
    );
    const undSums = filteredResults.reduce(
      (s, r) => s + (r.cognitiveScores?.understand?.percentage || 0),
      0
    );
    const appSums = filteredResults.reduce(
      (s, r) => s + (r.cognitiveScores?.apply?.percentage || 0),
      0
    );

    avgKnowPct = Math.round(knowSums / totalCount);
    avgUnderstandPct = Math.round(undSums / totalCount);
    avgApplyPct = Math.round(appSums / totalCount);
  }

  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  // Score distribution buckets: < 5.0, 5.0 - 6.5, 6.5 - 8.0, 8.0 - 10.0
  const countUnder5 = filteredResults.filter((r) => r.totalScore < 5.0).length;
  const count5to65 = filteredResults.filter((r) => r.totalScore >= 5.0 && r.totalScore < 6.5).length;
  const count65to8 = filteredResults.filter((r) => r.totalScore >= 6.5 && r.totalScore < 8.0).length;
  const count8to10 = filteredResults.filter((r) => r.totalScore >= 8.0).length;

  // AI Personalized Review Pack generator
  const handleGeneratePersonalizedReviewPack = (studentResult: StudentExamResult) => {
    const knowPct = studentResult.cognitiveScores?.know?.percentage || 0;
    const undPct = studentResult.cognitiveScores?.understand?.percentage || 0;
    const appPct = studentResult.cognitiveScores?.apply?.percentage || 0;

    let reviewTitle = '';
    let reviewDesc = '';
    let category = '';

    // Pedagogical Rules (Section LVI):
    if (knowPct < 60) {
      // Yếu BIẾT -> Ôn nền tảng
      reviewTitle = `Bộ ôn tập nền tảng BIẾT: Danh pháp & Cấu tạo Alcohol`;
      reviewDesc = `Tập trung ghi nhớ công thức cấu tạo, gọi tên IUPAC alcohol no đơn chức, đặc điểm liên kết O-H và nhận diện hiện tượng.`;
      category = 'Ôn tập nền tảng';
    } else if (undPct < 60) {
      // BIẾT tốt nhưng HIỂU yếu -> Tăng giải thích, so sánh, diễn giải
      reviewTitle = `Bộ củng cố mức độ HIỂU: So sánh & Giải thích tính chất Alcohol`;
      reviewDesc = `Rèn luyện kỹ năng so sánh nhiệt độ sôi của alcohol với hydrocarbon/ether cùng phân tử khối do liên kết hydrogen; giải thích độ tan trong nước.`;
      category = 'Củng cố giải thích';
    } else if (appPct < 60) {
      // BIẾT & HIỂU tốt nhưng VẬN DỤNG yếu -> Tăng bài tập tình huống, thực tiễn
      reviewTitle = `Bộ luyện tập VẬN DỤNG: Bài toán định lượng & Ứng dụng thực tiễn`;
      reviewDesc = `Rèn luyện bài toán tính hiệu suất phản ứng lên men glucose thành ethanol, giải thích ngộ độc cồn công nghiệp methanol và bài toán đốt cháy.`;
      category = 'Luyện tập tình huống';
    } else {
      // Cả 3 tốt -> Mở rộng nâng cao
      reviewTitle = `Nhiệm vụ mở rộng nâng cao: Hợp chất Phenol & Tổng hợp hữu cơ`;
      reviewDesc = `Tìm hiểu phản ứng thế ái điện tử của phenol với dung dịch bromine, phản ứng tạo nhựa bakelite và ứng dụng trong y học.`;
      category = 'Mở rộng nâng cao';
    }

    const newTask: LearningTask = {
      id: `TASK_REV_${Date.now()}`,
      classId: '11A1',
      title: reviewTitle,
      subject: 'Hóa học',
      topic: category,
      description: reviewDesc,
      requirements: 'Hoàn thành các câu hỏi trong phiếu ôn tập cá nhân hóa do AI đề xuất.',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      assignedDate: new Date().toISOString(),
      attachments: [],
      cognitiveLevel: knowPct < 60 ? 'KNOW' : undPct < 60 ? 'UNDERSTAND' : 'APPLY',
      status: 'DANG_THUC_HIEN',
      isAcceptingSubmissions: true,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    storageService.addLearningTask(newTask);

    storageService.logLearningEvent({
      studentId: studentResult.studentId,
      studentCode: studentResult.studentCode,
      eventType: 'VIEW_DOCUMENT',
      title: `Giao bộ ôn tập cá nhân hóa: ${reviewTitle}`,
      details: `Dựa trên kết quả khảo thí: BIẾT ${knowPct}%, HIỂU ${undPct}%, VẬN DỤNG ${appPct}%.`,
      metadata: {
        taskId: newTask.id,
        category,
      },
    });

    toastService.success(
      `Đã tạo và gửi "${reviewTitle}" đến Góc học tập của học sinh ${studentResult.studentName}!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              9. Phân tích kết quả & AI cá nhân hóa sau kiểm tra
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                Dữ liệu thực nghiệm
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Bắt buộc phân tích theo 3 mức BIẾT - HIỂU - VẬN DỤNG và thiết lập Bộ ôn tập cá nhân cho từng học sinh
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
          >
            <option value="ALL">Tất cả đề kiểm tra</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title.slice(0, 30)}...
              </option>
            ))}
          </select>

          {userRole === 'TEACHER' && (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
            >
              <option value="ALL">Toàn bộ lớp</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.code} - {st.fullName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
          Chưa có dữ liệu bài làm thực tế cho tiêu chí đã chọn. Hệ thống không tạo số liệu giả định.
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Điểm trung bình (ĐTB)</span>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                {formatScore(avgScore)} <span className="text-xs text-slate-400 font-normal">/ 10đ</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Dựa trên {totalCount} bài kiểm tra</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Tỷ lệ đạt (≥ 5,0đ)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {passRate}%
              </div>
              <span className="text-[11px] text-slate-400 block">{passCount} / {totalCount} học sinh</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Điểm cao nhất</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatScore(maxScore)}đ
              </div>
              <span className="text-[11px] text-slate-400 block">Thủ khoa lớp</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Điểm thấp nhất</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatScore(minScore)}đ
              </div>
              <span className="text-[11px] text-slate-400 block">Cần kế hoạch phụ đạo</span>
            </div>
          </div>

          {/* MANDATORY SECTION: "TỶ LỆ ĐÚNG THEO MỨC ĐỘ" */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tỷ lệ đúng theo 3 mức độ nhận thức (Bắt buộc)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Chuẩn hóa toàn hệ thống</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* BIẾT */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    1. MỨC BIẾT
                  </span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                    {avgKnowPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${avgKnowPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Khả năng nhận diện công thức, gọi tên, định nghĩa và dữ kiện trực tiếp.
                </p>
              </div>

              {/* HIỂU */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    2. MỨC HIỂU
                  </span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {avgUnderstandPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${avgUnderstandPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Khả năng so sánh nhiệt độ sôi, giải thích hiện tượng phản ứng, liên kết hydrogen.
                </p>
              </div>

              {/* VẬN DỤNG */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                    3. MỨC VẬN DỤNG
                  </span>
                  <span className="text-lg font-black text-purple-700 dark:text-purple-400">
                    {avgApplyPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${avgApplyPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Khả năng tính toán định lượng, hiệu suất phản ứng và ứng dụng vào thực tế đời sống.
                </p>
              </div>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Phân bố điểm số lớp học
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1">
                <span className="text-rose-700 font-semibold">Dưới 5,0đ (Cần hỗ trợ)</span>
                <div className="text-xl font-bold text-rose-800 dark:text-rose-200">{countUnder5} học sinh</div>
                <span className="text-[10px] text-slate-400">{Math.round((countUnder5 / totalCount) * 100)}% cả lớp</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1">
                <span className="text-amber-700 font-semibold">5,0 - 6,4đ (Trung bình)</span>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-200">{count5to65} học sinh</div>
                <span className="text-[10px] text-slate-400">{Math.round((count5to65 / totalCount) * 100)}% cả lớp</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1">
                <span className="text-blue-700 font-semibold">6,5 - 7,9đ (Khá)</span>
                <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{count65to8} học sinh</div>
                <span className="text-[10px] text-slate-400">{Math.round((count65to8 / totalCount) * 100)}% cả lớp</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <span className="text-emerald-700 font-semibold">8,0 - 10,0đ (Giỏi)</span>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{count8to10} học sinh</div>
                <span className="text-[10px] text-slate-400">{Math.round((count8to10 / totalCount) * 100)}% cả lớp</span>
              </div>
            </div>
          </div>

          {/* AI Personalized Review Packs (BỘ ÔN TẬP CÁ NHÂN THEO QUY TẮC) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    AI Cá nhân hóa sau kiểm tra: Bộ ôn tập cá nhân
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phân tích kết quả từng em để tạo bộ ôn tập tương thích theo 4 quy tắc sư phạm
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredResults.slice(0, 10).map((r) => {
                const knowPct = r.cognitiveScores?.know?.percentage || 0;
                const undPct = r.cognitiveScores?.understand?.percentage || 0;
                const appPct = r.cognitiveScores?.apply?.percentage || 0;

                let diagnosis = '';
                if (knowPct < 60) diagnosis = 'Yếu BIẾT → Ôn nền tảng';
                else if (undPct < 60) diagnosis = 'BIẾT tốt, HIỂU yếu → Củng cố giải thích, so sánh';
                else if (appPct < 60) diagnosis = 'BIẾT + HIỂU tốt, VẬN DỤNG yếu → Bài tập tình huống thực tế';
                else diagnosis = 'BIẾT - HIỂU - VẬN DỤNG đều tốt → Giao nhiệm vụ mở rộng';

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <span>{r.studentName} ({r.studentCode})</span>
                        <span className="font-extrabold text-purple-700 dark:text-purple-300">
                          {formatScore(r.totalScore)}đ
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span className="text-blue-600 font-semibold">BIẾT: {knowPct}%</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold">HIỂU: {undPct}%</span>
                        <span>·</span>
                        <span className="text-purple-600 font-semibold">VẬN DỤNG: {appPct}%</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 font-medium">
                          {diagnosis}
                        </span>
                      </div>
                    </div>

                    {userRole === 'TEACHER' && (
                      <button
                        onClick={() => handleGeneratePersonalizedReviewPack(r)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tạo bộ ôn tập cá nhân</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
