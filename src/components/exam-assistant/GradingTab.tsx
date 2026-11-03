import React, { useState } from 'react';
import {
  ExamPaper,
  StudentExamResult,
  StudentExamAnswer,
  ExamQuestion,
} from '../../types/examTypes';
import { Student } from '../../types';
import { examService } from '../../services/examService';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  FileCheck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Edit2,
  Save,
  RotateCcw,
  Check,
  X,
  User,
  Search,
  Filter,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';

interface GradingTabProps {
  exams: ExamPaper[];
  students: Student[];
  currentStudent?: Student;
  userRole: 'TEACHER' | 'STUDENT';
}

export const GradingTab: React.FC<GradingTabProps> = ({
  exams,
  students,
  currentStudent,
  userRole,
}) => {
  const [results, setResults] = useState<StudentExamResult[]>(() =>
    examService.getExamResults()
  );
  const [selectedResult, setSelectedResult] = useState<StudentExamResult | null>(
    results[0] || null
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState<string>('ALL');

  // Teacher manual score editing modal
  const [editingResult, setEditingResult] = useState<StudentExamResult | null>(null);
  const [manualPart4Score, setManualPart4Score] = useState<number>(1.0);
  const [manualTeacherComment, setManualTeacherComment] = useState<string>('');

  const refreshResults = () => {
    const list = examService.getExamResults();
    setResults(list);
    if (selectedResult) {
      const updated = list.find((r) => r.id === selectedResult.id);
      if (updated) setSelectedResult(updated);
    }
  };

  const filteredResults = results.filter((r) => {
    // Role check: students can only see their own
    if (userRole === 'STUDENT' && currentStudent) {
      if (r.studentId !== currentStudent.id && r.studentCode !== currentStudent.code) {
        return false;
      }
    }

    if (filterExam !== 'ALL' && r.examId !== filterExam && r.examCode !== filterExam) {
      return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q) ||
        r.examCode.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleOpenEditEssay = (result: StudentExamResult) => {
    setEditingResult(result);
    setManualPart4Score(result.scorePart4);
    setManualTeacherComment(result.aiPedagogicalComment?.overallSummary || '');
  };

  const handleSaveTeacherConfirmedScore = () => {
    if (!editingResult) return;
    if (userRole !== 'TEACHER') {
      toastService.error('Chỉ giáo viên mới có quyền chốt điểm!');
      return;
    }

    const newScoreP4 = Math.min(1.5, Math.max(0, manualPart4Score));
    const newTotal = Math.round(
      (editingResult.scorePart1 +
        editingResult.scorePart2 +
        editingResult.scorePart3 +
        newScoreP4) *
        100
    ) / 100;

    const updatedResult: StudentExamResult = {
      ...editingResult,
      scorePart4: newScoreP4,
      totalScore: newTotal,
      essayGraded: true,
      aiPedagogicalComment: {
        ...editingResult.aiPedagogicalComment,
        overallSummary: manualTeacherComment.trim() || editingResult.aiPedagogicalComment.overallSummary,
      },
    };

    examService.saveExamResult(updatedResult);

    // Log learning event into storageService for data linking
    storageService.logLearningEvent({
      studentId: updatedResult.studentId,
      studentCode: updatedResult.studentCode,
      eventType: 'VIEW_FEEDBACK',
      title: `Chốt điểm bài kiểm tra: ${updatedResult.examCode}`,
      details: `Điểm số chính thức: ${formatScore(newTotal)}/10,0đ. Giáo viên đã xác nhận điểm tự luận.`,
      metadata: {
        examId: updatedResult.examId,
        score: newTotal,
      },
    });

    toastService.success(
      `Đã chốt điểm bài làm của ${updatedResult.studentName}: ${formatScore(newTotal)} / 10,0đ.`
    );
    setEditingResult(null);
    refreshResults();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              8. Trung tâm chấm điểm & Nhận xét sư phạm
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                Thang điểm 10,0đ
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Tự động chấm Phần I, II, III. AI đề xuất điểm tự luận Phần IV theo Rubric — Giáo viên luôn là người chốt điểm cuối.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Tổng bài đã chấm:</span>
          <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {filteredResults.length} bài
          </span>
        </div>
      </div>

      {/* Filter and Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions list */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học sinh, mã HS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>

            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium"
            >
              <option value="ALL">Tất cả đề kiểm tra</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.code} - {ex.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredResults.map((r) => {
              const isSelected = selectedResult?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedResult(r)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-100 dark:ring-purple-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {r.studentName} ({r.studentCode})
                    </span>
                    <span className="font-black text-sm text-purple-700 dark:text-purple-300">
                      {formatScore(r.totalScore)}đ
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Mã: {r.examCode}</span>
                    <span className={r.essayGraded ? 'text-emerald-600 font-bold' : 'text-amber-600 font-medium'}>
                      {r.essayGraded ? '✓ Đã chốt điểm' : '• Chờ GV chốt TL'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed grading inspection */}
        <div className="lg:col-span-2 space-y-4">
          {selectedResult ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
              {/* Header result */}
              <div className="flex items-start justify-between border-b pb-4 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                      {selectedResult.examCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedResult.studentName} ({selectedResult.studentCode})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedResult.examTitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  {userRole === 'TEACHER' && (
                    <button
                      onClick={() => handleOpenEditEssay(selectedResult)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{selectedResult.essayGraded ? 'Sửa điểm đã chốt' : 'Chốt điểm tự luận'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Part Scores breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-slate-400 text-[10px]">Phần I (TN)</div>
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatScore(selectedResult.scorePart1)} / 5,0đ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-slate-400 text-[10px]">Phần II (Đ/S)</div>
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatScore(selectedResult.scorePart2)} / 2,0đ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-slate-400 text-[10px]">Phần III (Ngắn)</div>
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatScore(selectedResult.scorePart3)} / 1,5đ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="text-slate-400 text-[10px]">Phần IV (TL)</div>
                  <div className="font-extrabold text-sm text-purple-600 dark:text-purple-400 mt-0.5">
                    {formatScore(selectedResult.scorePart4)} / 1,5đ
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
                  <div className="text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                    TỔNG ĐIỂM
                  </div>
                  <div className="font-black text-base text-purple-700 dark:text-purple-300 mt-0.5">
                    {formatScore(selectedResult.totalScore)} / 10đ
                  </div>
                </div>
              </div>

              {/* 3 Cognitive Level Scores */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Điểm và tỷ lệ theo 3 mức độ nhận thức:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border space-y-1">
                    <div className="flex justify-between text-blue-700 font-bold">
                      <span>BIẾT:</span>
                      <span>{selectedResult.cognitiveScores?.know?.percentage || 0}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đạt {formatScore(selectedResult.cognitiveScores?.know?.score || 0)} / {formatScore(selectedResult.cognitiveScores?.know?.max || 0)}đ
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border space-y-1">
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>HIỂU:</span>
                      <span>{selectedResult.cognitiveScores?.understand?.percentage || 0}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đạt {formatScore(selectedResult.cognitiveScores?.understand?.score || 0)} / {formatScore(selectedResult.cognitiveScores?.understand?.max || 0)}đ
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border space-y-1">
                    <div className="flex justify-between text-purple-700 font-bold">
                      <span>VẬN DỤNG:</span>
                      <span>{selectedResult.cognitiveScores?.apply?.percentage || 0}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đạt {formatScore(selectedResult.cognitiveScores?.apply?.score || 0)} / {formatScore(selectedResult.cognitiveScores?.apply?.max || 0)}đ
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Pedagogical Feedback Box */}
              <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Nhận xét sư phạm cá nhân hóa:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedResult.aiPedagogicalComment?.overallSummary}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-purple-100 dark:border-purple-900/50">
                  Mức hỗ trợ đề xuất: <strong>{selectedResult.aiPedagogicalComment?.supportLevel}</strong> · Độ tin cậy: <strong>{selectedResult.aiPedagogicalComment?.confidence}</strong>
                </div>
              </div>

              {/* List of Answers by Question */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Chi tiết câu trả lời và đối chiếu Yêu cầu cần đạt chuẩn SGK:
                </span>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {Object.entries(selectedResult.answers).map(([qId, ans]) => {
                    const currentExam = exams.find((e) => e.id === selectedResult.examId);
                    const relatedQ = currentExam?.questions.find(
                      (q: ExamQuestion) => q.id === qId || q.questionNumber === ans.questionNumber
                    );
                    return (
                      <div
                        key={qId}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white mr-2">
                              Câu {ans.questionNumber} ({ans.section})
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {ans.selectedOption
                                ? `Chọn: ${ans.selectedOption}`
                                : ans.shortAnswerText
                                ? `Trả lời: "${ans.shortAnswerText}"`
                                : ans.essayText
                                ? `Tự luận: "${ans.essayText.slice(0, 50)}..."`
                                : 'Đúng/Sai'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-400">{ans.feedback}</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded ${
                                ans.earnedPoints > 0
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              +{formatScore(ans.earnedPoints)}đ
                            </span>
                          </div>
                        </div>

                        {relatedQ?.curriculumRequirement && (
                          <div className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-md flex items-center gap-1.5">
                            <span className="font-bold shrink-0">Yêu cầu cần đạt:</span>
                            <span className="truncate">{relatedQ.curriculumRequirement}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              Chọn một bài làm của học sinh từ danh sách bên trái để chấm điểm và xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal Teacher Confirming / Editing Score */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Giáo viên duyệt & Chốt điểm tự luận
              </h3>
              <button onClick={() => setEditingResult(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500">Học sinh:</span>{' '}
                <strong>{editingResult.studentName} ({editingResult.studentCode})</strong>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Điểm tự luận Phần IV (Tối đa 1,5 điểm):
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1.5"
                  value={manualPart4Score}
                  onChange={(e) => setManualPart4Score(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-purple-700"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  AI đề xuất: {formatScore(editingResult.scorePart4)}đ theo Rubric. Giáo viên có quyền điều chỉnh tự do.
                </span>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Nhận xét sư phạm của giáo viên:
                </label>
                <textarea
                  rows={3}
                  value={manualTeacherComment}
                  onChange={(e) => setManualTeacherComment(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-900 dark:text-purple-300">
                Tổng điểm mới sau khi chốt:{' '}
                <strong className="text-sm">
                  {formatScore(
                    editingResult.scorePart1 +
                      editingResult.scorePart2 +
                      editingResult.scorePart3 +
                      manualPart4Score
                  )}{' '}
                  / 10,0đ
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTeacherConfirmedScore}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 cursor-pointer"
              >
                Xác nhận chốt điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
