import React, { useState } from 'react';
import { ExamPaper, StudentExamResult } from '../../types/examTypes';
import { Student } from '../../types';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  Send,
  Link,
  Copy,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  FileCheck,
  Eye,
  Users,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

interface AssignedExamsTabProps {
  exams: ExamPaper[];
  students: Student[];
  currentStudent?: Student;
  onSelectExamToTake: (exam: ExamPaper) => void;
  onSelectExamToGrade: (exam: ExamPaper) => void;
  onRefreshExams: () => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const AssignedExamsTab: React.FC<AssignedExamsTabProps> = ({
  exams,
  students,
  currentStudent,
  onSelectExamToTake,
  onSelectExamToGrade,
  onRefreshExams,
  userRole,
}) => {
  const [examResults, setExamResults] = useState<StudentExamResult[]>(() =>
    examService.getExamResults()
  );

  // Filter only published exams or all for teacher
  const assignedList = exams.filter((e) =>
    userRole === 'STUDENT' ? e.status === 'PHAT_HANH' : true
  );

  const handleCopyLink = (exam: ExamPaper) => {
    const link =
      exam.shareableLink ||
      `${window.location.origin}?exam=${exam.code}`;
    navigator.clipboard.writeText(link);
    toastService.success(`Đã sao chép link giao đề "${exam.code}"! Sẵn sàng gửi học sinh.`);
  };

  const handleToggleLockExam = (exam: ExamPaper) => {
    if (userRole !== 'TEACHER') return;
    const newStatus = exam.status === 'PHAT_HANH' ? 'DA_DUYET' : 'PHAT_HANH';
    const updated: ExamPaper = {
      ...exam,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updated);
    onRefreshExams();
    toastService.info(
      newStatus === 'PHAT_HANH'
        ? `Đã mở phát hành đề "${exam.title}" cho học sinh làm bài.`
        : `Đã tạm khóa đề "${exam.title}". Học sinh không thể làm bài lúc này.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              6. Quản lý đề đã giao
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                {assignedList.length} đề thi
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Phát hành trực tiếp đến học sinh trong lớp, theo dõi tiến độ nộp bài và cấp link làm bài online
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-500 hidden sm:block">
          <div>Lớp nhận đề: <strong>Lớp học ({students.length || 31} học sinh)</strong></div>
          <div>Chương trình: <strong>SGK Kết nối tri thức</strong></div>
        </div>
      </div>

      {/* Grid of Assigned Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignedList.map((exam) => {
          const submissions = examResults.filter((r) => r.examId === exam.id || r.examCode === exam.code);
          const submissionCount = submissions.length;
          const totalTargetStudents = students.length || 31;
          const percentSubmitted = Math.round((submissionCount / totalTargetStudents) * 100);

          // Check if current student already took this test
          const mySubmission = currentStudent
            ? submissions.find((r) => r.studentId === currentStudent.id || r.studentCode === currentStudent.code)
            : null;

          return (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      {exam.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {exam.title}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      exam.status === 'PHAT_HANH'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : exam.status === 'DA_DUYET'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {exam.status === 'PHAT_HANH'
                      ? 'Đang phát hành'
                      : exam.status === 'DA_DUYET'
                      ? 'Đã duyệt (Chưa mở)'
                      : 'Bản nháp'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Thời gian: {exam.durationMinutes} phút</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Số lượng: {exam.totalQuestions} câu (10,0đ)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lớp: {exam.assignedClasses?.join(', ') || 'Lớp học'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tạo: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Cognitive ratio badge */}
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="text-slate-400">Chuẩn nhận thức:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    BIẾT: {exam.ratio?.know}%
                  </span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    HIỂU: {exam.ratio?.understand}%
                  </span>
                  <span>·</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    VẬN DỤNG: {exam.ratio?.apply}%
                  </span>
                </div>

                {/* Submission Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Tiến độ nộp bài:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {submissionCount} / {totalTargetStudents} học sinh ({percentSubmitted}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentSubmitted}%` }}
                    />
                  </div>
                </div>

                {/* Student specific status badge */}
                {userRole === 'STUDENT' && mySubmission && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Em đã hoàn thành bài thi!
                    </span>
                    <span className="font-extrabold text-sm">
                      {formatScore(mySubmission.totalScore)} / 10,0đ
                    </span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => handleCopyLink(exam)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép link</span>
                </button>

                <div className="flex items-center gap-2">
                  {userRole === 'TEACHER' && (
                    <>
                      <button
                        onClick={() => handleToggleLockExam(exam)}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                          exam.status === 'PHAT_HANH'
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                        title={exam.status === 'PHAT_HANH' ? 'Khóa đề' : 'Mở phát hành'}
                      >
                        {exam.status === 'PHAT_HANH' ? (
                          <Unlock className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <button
                        onClick={() => onSelectExamToGrade(exam)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chấm bài ({submissionCount})</span>
                      </button>
                    </>
                  )}

                  {/* Button for taking exam */}
                  <button
                    onClick={() => onSelectExamToTake(exam)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{userRole === 'STUDENT' ? (mySubmission ? 'Xem lại bài' : 'Làm bài ngay') : 'Xem đề thi'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
