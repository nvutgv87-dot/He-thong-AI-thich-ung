import React, { useState } from 'react';
import {
  Student,
  LearningTask,
  StudentProductSubmission,
  COGNITIVE_LEVEL_META,
  CognitiveLevel,
} from '../../types';
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  User,
  AlertCircle,
} from 'lucide-react';

interface ProgressTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  students: Student[];
  currentStudent: Student;
  tasks: LearningTask[];
  submissions: StudentProductSubmission[];
  onSelectStudent?: (studentId: string) => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  userRole,
  students,
  currentStudent,
  tasks,
  submissions,
  onSelectStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    userRole === 'STUDENT' ? currentStudent.id : 'STU_04'
  );

  const activeStudent =
    userRole === 'STUDENT'
      ? currentStudent
      : students.find((s) => s.id === selectedStudentId) || currentStudent;

  const studentSubmissions = submissions.filter(
    (s) => s.studentId === activeStudent.id
  );

  // Compute cognitive level stats for this student
  const cognitiveCounts = {
    KNOW: { total: 0, done: 0 },
    UNDERSTAND: { total: 0, done: 0 },
    APPLY: { total: 0, done: 0 },
  };

  tasks.forEach((t) => {
    const level = t.cognitiveLevel || 'UNDERSTAND';
    cognitiveCounts[level].total += 1;
    const sub = studentSubmissions.find((s) => s.taskId === t.id);
    if (sub && (sub.status === 'DA_NOP' || sub.status === 'DA_NHAN_XET' || sub.status === 'DA_HOAN_THANH')) {
      cognitiveCounts[level].done += 1;
    }
  });

  const completedCount = studentSubmissions.filter(
    (s) => s.status === 'DA_HOAN_THANH' || s.status === 'DA_NHAN_XET' || s.status === 'DA_NOP'
  ).length;

  const onTimeRate = activeStudent.baseline.onTimeRate || 85;

  return (
    <div className="space-y-5">
      {/* Teacher Student Selector */}
      {userRole === 'TEACHER' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Chọn học sinh đối chiếu tiến độ:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                if (onSelectStudent) onSelectStudent(e.target.value);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.fullName} ({s.gender})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Student Progress Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
              {activeStudent.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {userRole === 'STUDENT' ? 'Tiến độ học tập của tôi' : `Tiến độ học sinh: ${activeStudent.fullName}`}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Lớp
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Baseline trung bình: {activeStudent.baseline.avgScore}đ · Tỷ lệ đúng hạn: {onTimeRate}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs text-slate-400">Nhiệm vụ hoàn thành:</span>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {completedCount} / {tasks.length} ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
              </div>
            </div>
          </div>
        </div>

        {/* 3 Cognitive Levels: BIẾT, HIỂU, VẬN DỤNG */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Phân bố tiến độ theo 3 mức độ nhận thức (Kết nối tri thức)
            </h4>
            <span className="text-[11px] text-slate-400">
              Chuẩn yêu cầu cần đạt (YCCĐ)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['KNOW', 'UNDERSTAND', 'APPLY'] as CognitiveLevel[]).map((level) => {
              const meta = COGNITIVE_LEVEL_META[level];
              const stats = cognitiveCounts[level];
              const percent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

              return (
                <div
                  key={level}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${meta.badgeClass}`}>
                      {meta.shortName}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {stats.done}/{stats.total} bài ({percent}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {meta.description}
                  </p>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths, Needs Support & AI Feedback in Positive Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Strengths */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Chủ đề & Kỹ năng phát huy tốt</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc">
              <li>Mức độ nhận thức BIẾT đạt kết quả ổn định và ghi nhớ công thức nhanh.</li>
              <li>Thực hiện tốt các báo cáo thực nghiệm cân bằng Le Chatelier có hình ảnh minh họa.</li>
              <li>Thói quen tương tác nhóm tích cực trong các buổi thảo luận.</li>
            </ul>
          </div>

          {/* Needs Reinforcement */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Chủ đề cần củng cố & rèn luyện thêm</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc">
              <li>Bài toán VẬN DỤNG tính toán pH và hằng số phân li axit - bazơ ở mức nhiều bước.</li>
              <li>Tập thói quen nộp bài sớm hơn 24 giờ so với hạn chót để tránh dồn bài cuối tuần.</li>
              <li>Chủ động tham gia đặt câu hỏi trong diễn đàn thảo luận môn học.</li>
            </ul>
          </div>
        </div>

        {/* AI Pedagogical Suggestion Card (Positive, Non-labeling) */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/80 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/30 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-indigo-950 dark:text-indigo-200">
              Gợi ý thích ứng từ Trợ lý Sư phạm (AI Guidance)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
              Độ tin cậy: Cao
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            Học sinh {activeStudent.fullName} có nền tảng lý thuyết tốt. Để tối ưu hóa thời gian, em nên áp dụng
            phương pháp <strong>Vi phân nhiệm vụ 15 phút</strong>: đọc kỹ đề và tóm tắt dữ kiện 5 phút đầu,
            sau đó làm lần lượt từng câu ngắn. Điều này giúp loại bỏ cảm giác căng thẳng trước các bài toán hóa học dài.
          </p>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1 font-medium">
            <span>💡 Căn cứ phân tích:</span>
            <span>Dữ liệu 4 tuần gần nhất · 5 sản phẩm nộp · Baseline chuẩn độ dung dịch</span>
          </div>
        </div>
      </div>
    </div>
  );
};
