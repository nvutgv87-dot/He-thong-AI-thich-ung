import React, { useState } from 'react';
import {
  ExamPaper,
  ExamQuestion,
  ExamStatus,
  ExamVerificationResult,
  ExamSpecificationItem,
} from '../../types/examTypes';
import { CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Share2,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ArrowUpDown,
  X,
  Save,
  Check,
  BookOpen,
} from 'lucide-react';

interface SavedExamsTabProps {
  exams: ExamPaper[];
  currentExam: ExamPaper;
  onSelectExam: (exam: ExamPaper) => void;
  onRefreshExams: () => void;
  onOpenExportModal: (exam: ExamPaper) => void;
  onRequestConfirmDelete: (item: { id: string; title: string }) => void;
  onNavigateToTab: (tabId: string) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const SavedExamsTab: React.FC<SavedExamsTabProps> = ({
  exams,
  currentExam,
  onSelectExam,
  onRefreshExams,
  onOpenExportModal,
  onRequestConfirmDelete,
  onNavigateToTab,
  userRole,
}) => {
  // Mode: 'LIBRARY' | 'QUESTION_EDITOR'
  const [viewMode, setViewMode] = useState<'LIBRARY' | 'QUESTION_EDITOR'>('LIBRARY');
  const [activeEditingExam, setActiveEditingExam] = useState<ExamPaper>(currentExam);

  // Search & Filter in library
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Inline Exam Info Editing state
  const [editingInfoExamId, setEditingInfoExamId] = useState<string | null>(null);
  const [infoForm, setInfoForm] = useState<Partial<ExamPaper>>({});

  // Question Editor: Toggle Exam Header Edit
  const [showEditorMeta, setShowEditorMeta] = useState(false);

  // Check for duplicate questions in current exam being edited
  const seenContentSet = new Set<string>();
  let duplicateCount = 0;
  if (activeEditingExam && activeEditingExam.questions) {
    for (const q of activeEditingExam.questions) {
      const key = q.content.trim().toLowerCase().replace(/\s+/g, ' ');
      if (seenContentSet.has(key)) {
        duplicateCount++;
      } else {
        seenContentSet.add(key);
      }
    }
  }

  const handleRemoveDuplicateQuestions = () => {
    const cleaned = examService.deduplicateExam(activeEditingExam);
    setActiveEditingExam(cleaned);
    examService.saveExam(cleaned);
    onRefreshExams();
    toastService.success(`Đã tự động lọc bỏ các câu hỏi trùng nhau! Đề thi hiện có ${cleaned.questions.length} câu hoàn toàn riêng biệt.`);
  };

  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ExamVerificationResult | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Keep activeEditingExam in sync if currentExam changes and we're editing it
  React.useEffect(() => {
    if (currentExam && (!activeEditingExam || activeEditingExam.id === currentExam.id)) {
      setActiveEditingExam(currentExam);
    }
  }, [currentExam, currentExam?.updatedAt]);

  // Subjects in exams
  const subjects = Array.from(new Set(exams.map((e) => e.subject).filter(Boolean)));

  // Filtered exams
  const filteredExams = exams.filter((e) => {
    const matchSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = filterSubject === 'ALL' || e.subject === filterSubject;
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    return matchSearch && matchSubject && matchStatus;
  });

  const handleStartEditInfo = (exam: ExamPaper) => {
    setEditingInfoExamId(exam.id);
    setInfoForm({
      title: exam.title,
      code: exam.code,
      subject: exam.subject,
      grade: exam.grade,
      chapter: exam.chapter,
      topic: exam.topic,
      durationMinutes: exam.durationMinutes,
      status: exam.status,
      assignedClasses: exam.assignedClasses,
    });
  };

  const handleSaveExamInfo = (examId: string) => {
    const target = exams.find((e) => e.id === examId);
    if (!target) return;

    const updated: ExamPaper = {
      ...target,
      title: infoForm.title?.trim() || target.title,
      code: infoForm.code?.trim() || target.code,
      subject: infoForm.subject || target.subject,
      grade: Number(infoForm.grade) || target.grade,
      chapter: infoForm.chapter?.trim() || target.chapter,
      topic: infoForm.topic?.trim() || target.topic,
      durationMinutes: Number(infoForm.durationMinutes) || target.durationMinutes,
      status: (infoForm.status as ExamStatus) || target.status,
      assignedClasses: infoForm.assignedClasses || target.assignedClasses,
      updatedAt: new Date().toISOString(),
    };

    examService.saveExam(updated);
    setEditingInfoExamId(null);
    onRefreshExams();
    if (activeEditingExam.id === examId) {
      setActiveEditingExam(updated);
    }
    toastService.success(`Đã lưu thay đổi thông tin đề "${updated.title}"!`);
  };

  const handleDuplicateExam = (examId: string) => {
    const dup = examService.duplicateExam(examId);
    if (dup) {
      toastService.success(`Đã nhân bản đề "${dup.title}" thành công!`);
      onRefreshExams();
    }
  };

  const handleRunAIVerification = (exam: ExamPaper) => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = examService.verifyExamPaper(exam);
      setVerifyResult(res);
      setIsVerifying(false);
      setShowVerifyModal(true);

      const updated = { ...exam, aiVerification: res };
      examService.saveExam(updated);
      onRefreshExams();
      if (activeEditingExam.id === exam.id) {
        setActiveEditingExam(updated);
      }
    }, 700);
  };

  const handleApproveExam = (exam: ExamPaper) => {
    if (userRole !== 'TEACHER') return;
    const res = examService.verifyExamPaper(exam);
    if (res.status === 'CO_LOI') {
      toastService.error(
        'Đề thi đang có lỗi nghiêm trọng chưa được khắc phục! Vui lòng sửa lỗi trước khi duyệt.'
      );
      setVerifyResult(res);
      setShowVerifyModal(true);
      return;
    }

    const updated: ExamPaper = {
      ...exam,
      status: 'DA_DUYET',
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updated);
    toastService.success(`Giáo viên đã DUYỆT đề "${exam.title}"! Sẵn sàng phát hành.`);
    onRefreshExams();
    if (activeEditingExam.id === exam.id) {
      setActiveEditingExam(updated);
    }
  };

  const handlePublishExam = (exam: ExamPaper) => {
    if (userRole !== 'TEACHER') return;
    if (exam.status !== 'DA_DUYET' && exam.status !== 'PHAT_HANH') {
      toastService.warning('Đề thi cần được GIÁO VIÊN DUYỆT trước khi phát hành cho học sinh.');
      return;
    }

    const updated: ExamPaper = {
      ...exam,
      status: 'PHAT_HANH',
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updated);
    toastService.success(`Đã PHÁT HÀNH đề "${exam.title}" cho lớp ${exam.assignedClasses.join(', ')}.`);
    onRefreshExams();
    if (activeEditingExam.id === exam.id) {
      setActiveEditingExam(updated);
    }
  };

  // Question editing handlers
  const handleUpdateQuestion = (qIdx: number, updatedQ: ExamQuestion) => {
    const newQuestions = [...activeEditingExam.questions];
    newQuestions[qIdx] = updatedQ;
    const updatedExam = { ...activeEditingExam, questions: newQuestions };
    setActiveEditingExam(updatedExam);
  };

  const handleDeleteQuestion = (qIdx: number) => {
    const updated = activeEditingExam.questions.filter((_, i) => i !== qIdx);
    const renumbered = updated.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    const updatedExam = {
      ...activeEditingExam,
      questions: renumbered,
      totalQuestions: renumbered.length,
    };
    setActiveEditingExam(updatedExam);
    toastService.info('Đã xóa câu hỏi khỏi đề.');
  };

  const handleMoveQuestion = (qIdx: number, dir: 'UP' | 'DOWN') => {
    const targetIdx = dir === 'UP' ? qIdx - 1 : qIdx + 1;
    if (targetIdx < 0 || targetIdx >= activeEditingExam.questions.length) return;
    const list = [...activeEditingExam.questions];
    const temp = list[qIdx];
    list[qIdx] = list[targetIdx];
    list[targetIdx] = temp;
    const renumbered = list.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setActiveEditingExam({ ...activeEditingExam, questions: renumbered });
  };

  const handleSaveActiveEditingExam = () => {
    // Check Cognitive level for all questions
    const missing = activeEditingExam.questions.some((q) => !q.cognitive_level);
    if (missing) {
      toastService.error('Không thể lưu! Tồn tại câu hỏi chưa có trường Mức độ nhận thức (BIẾT / HIỂU / VẬN DỤNG).');
      return;
    }

    // Automatically deduplicate questions if duplicate content exists
    const dedupedExam = examService.deduplicateExam(activeEditingExam);
    const hadDups = dedupedExam.questions.length !== activeEditingExam.questions.length;

    // Re-sync specifications with questions so requirements match 100%
    const syncedSpecs: ExamSpecificationItem[] = dedupedExam.questions.map((q) => ({
      id: `spec_${q.questionNumber}`,
      chapter: q.chapter || dedupedExam.chapter,
      topic: q.topic || dedupedExam.topic,
      competencyRequirement:
        q.curriculumRequirement ||
        `Đánh giá năng lực môn ${dedupedExam.subject} câu ${q.questionNumber} mức độ ${q.cognitive_level}`,
      cognitive_level: q.cognitive_level,
      section: q.section,
      questionNumber: q.questionNumber,
      points: q.points,
      questionPreview: q.content.slice(0, 60),
    }));

    const syncedExam: ExamPaper = {
      ...dedupedExam,
      specifications: syncedSpecs,
      updatedAt: new Date().toISOString(),
    };

    examService.saveExam(syncedExam);
    onSelectExam(syncedExam);
    setActiveEditingExam(syncedExam);
    onRefreshExams();
    if (hadDups) {
      toastService.success(`Đã tự động loại bỏ các câu hỏi trùng lặp và lưu đề thành công! Đề thi hiện có ${syncedExam.questions.length} câu hoàn chỉnh.`);
    } else {
      toastService.success(`Đã lưu thay đổi thành công! Toàn bộ nội dung đề "${syncedExam.title}" và ${syncedExam.questions.length} câu hỏi đã được lưu.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              5. Thư viện đề kiểm tra đã lưu
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                {exams.length} đề thi
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Quản lý đề nháp, quy trình duyệt, phát hành, chỉnh sửa câu hỏi và kiểm tra chất lượng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'QUESTION_EDITOR' ? (
            <button
              onClick={() => setViewMode('LIBRARY')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              ← Trở lại danh sách đề
            </button>
          ) : (
            <button
              onClick={() => onNavigateToTab('1. AI tạo đề')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề mới bằng AI</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'LIBRARY' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm đề theo tên, mã đề, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-purple-700 dark:text-purple-300"
              >
                <option value="ALL">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    Môn: {s}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NHAP">Bản nháp</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="PHAT_HANH">Đã phát hành</option>
              </select>
            </div>
          </div>

          {/* List of Saved Exams */}
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const isSelected = currentExam.id === exam.id;

              return (
                <div
                  key={exam.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 shadow-2xs space-y-4 ${
                    isSelected
                      ? 'border-purple-400 dark:border-purple-600 ring-2 ring-purple-100 dark:ring-purple-950/50'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {exam.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            exam.status === 'PHAT_HANH'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                              : exam.status === 'DA_DUYET'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                              : exam.status === 'CHO_DUYET'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {exam.status === 'PHAT_HANH'
                            ? 'Đã phát hành'
                            : exam.status === 'DA_DUYET'
                            ? 'Đã duyệt'
                            : exam.status === 'CHO_DUYET'
                            ? 'Chờ duyệt'
                            : 'Bản nháp'}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-extrabold text-purple-600 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exam.chapter} · {exam.topic}
                      </p>
                      {exam.specifications && exam.specifications.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 mt-1 font-medium bg-purple-50/70 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/40">
                          <BookOpen className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">
                            <strong>Yêu cầu cần đạt:</strong> {exam.specifications[0]?.competencyRequirement}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* AI Verification Button */}
                      <button
                        onClick={() => handleRunAIVerification(exam)}
                        disabled={isVerifying}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>AI Kiểm tra đề</span>
                      </button>

                      {/* Export Button */}
                      <button
                        onClick={() => onOpenExportModal(exam)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Xuất hồ sơ</span>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicateExam(exam.id)}
                        title="Nhân bản đề"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onRequestConfirmDelete({ id: exam.id, title: exam.title })}
                        title="Xóa đề"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Exam Info Editor */}
                  {editingInfoExamId === exam.id && (
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 dark:text-purple-300">
                          Chỉnh sửa thông tin chung của đề kiểm tra
                        </span>
                        <button
                          onClick={() => setEditingInfoExamId(null)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Tên đề kiểm tra:
                          </label>
                          <input
                            type="text"
                            value={infoForm.title || ''}
                            onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Mã đề:
                          </label>
                          <input
                            type="text"
                            value={infoForm.code || ''}
                            onChange={(e) => setInfoForm({ ...infoForm, code: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Chương:
                          </label>
                          <input
                            type="text"
                            value={infoForm.chapter || ''}
                            onChange={(e) => setInfoForm({ ...infoForm, chapter: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Chủ đề / Bài học:
                          </label>
                          <input
                            type="text"
                            value={infoForm.topic || ''}
                            onChange={(e) => setInfoForm({ ...infoForm, topic: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Thời gian làm bài:
                          </label>
                          <select
                            value={infoForm.durationMinutes || 45}
                            onChange={(e) => setInfoForm({ ...infoForm, durationMinutes: parseInt(e.target.value) || 45 })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                          >
                            <option value={15}>15 phút (Kiểm tra thường xuyên)</option>
                            <option value={45}>45 phút (Kiểm tra giữa kỳ)</option>
                            <option value={60}>60 phút</option>
                            <option value={90}>90 phút (Kiểm tra cuối kỳ)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                            Trạng thái:
                          </label>
                          <select
                            value={infoForm.status || 'NHAP'}
                            onChange={(e) => setInfoForm({ ...infoForm, status: e.target.value as ExamStatus })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg"
                          >
                            <option value="NHAP">Bản nháp</option>
                            <option value="CHO_DUYET">Chờ duyệt</option>
                            <option value="DA_DUYET">Đã duyệt</option>
                            <option value="PHAT_HANH">Đã phát hành</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                        <button
                          type="button"
                          onClick={() => setEditingInfoExamId(null)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveExamInfo(exam.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Badges & Ratios */}
                  <div className="flex items-center justify-between gap-3 text-xs flex-wrap bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span>Thời gian: <strong>{exam.durationMinutes} phút</strong></span>
                      <span>Tổng câu: <strong>{exam.totalQuestions} câu</strong></span>
                      <span>Điểm: <strong>10,0đ</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Tỷ lệ nhận thức:</span>
                      <span className="font-bold text-blue-600">BIẾT: {exam.ratio?.know}%</span>
                      <span>·</span>
                      <span className="font-bold text-emerald-600">HIỂU: {exam.ratio?.understand}%</span>
                      <span>·</span>
                      <span className="font-bold text-purple-600">VẬN DỤNG: {exam.ratio?.apply}%</span>
                    </div>
                  </div>

                  {/* Actions & Workflow Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          onSelectExam(exam);
                          setActiveEditingExam(exam);
                          setViewMode('QUESTION_EDITOR');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Sửa câu hỏi ({exam.questions.length})</span>
                      </button>

                      {userRole === 'TEACHER' && (
                        <button
                          onClick={() => handleStartEditInfo(exam)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer"
                          title="Sửa thông tin chung của đề thi"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sửa thông tin chung</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSelectExam(exam);
                          onNavigateToTab('2. Ma trận đề');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Xem Ma trận
                      </button>

                      <button
                        onClick={() => {
                          onSelectExam(exam);
                          onNavigateToTab('3. Bản đặc tả');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Xem Bản đặc tả
                      </button>
                    </div>

                    {userRole === 'TEACHER' && (
                      <div className="flex items-center gap-2">
                        {exam.status === 'NHAP' || exam.status === 'CHO_DUYET' ? (
                          <button
                            onClick={() => handleApproveExam(exam)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt đề</span>
                          </button>
                        ) : null}

                        {exam.status === 'DA_DUYET' ? (
                          <button
                            onClick={() => handlePublishExam(exam)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Phát hành cho lớp</span>
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Question Editor Mode */
        <div className="space-y-4 pb-20">
          {/* Header Panel of Editor */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Chỉnh sửa danh sách câu hỏi: {activeEditingExam.title}
                </span>
                <span className="ml-2 font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                  {activeEditingExam.questions.length} câu hỏi · {activeEditingExam.durationMinutes} phút
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditorMeta(!showEditorMeta)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {showEditorMeta ? 'Ẩn thông tin chung' : '⚙️ Sửa thông tin chung đề'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveActiveEditingExam}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>

            {/* Alert if duplicates exist */}
            {duplicateCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Phát hiện <strong>{duplicateCount} câu hỏi có nội dung trùng lặp</strong> trong đề. Bấm nút bên cạnh để tự động loại bỏ các câu trùng nhau.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDuplicateQuestions}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  Lọc bỏ câu trùng nhau
                </button>
              </div>
            )}

            {/* Editable metadata if toggled */}
            {showEditorMeta && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-600 dark:text-slate-400">Tên đề:</label>
                  <input
                    type="text"
                    value={activeEditingExam.title}
                    onChange={(e) => setActiveEditingExam({ ...activeEditingExam, title: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-600 dark:text-slate-400">Mã đề:</label>
                  <input
                    type="text"
                    value={activeEditingExam.code}
                    onChange={(e) => setActiveEditingExam({ ...activeEditingExam, code: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-slate-600 dark:text-slate-400">Thời gian (phút):</label>
                  <input
                    type="number"
                    value={activeEditingExam.durationMinutes}
                    onChange={(e) => setActiveEditingExam({ ...activeEditingExam, durationMinutes: parseInt(e.target.value) || 45 })}
                    className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* List of Questions */}
          {activeEditingExam.questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs">
                    {q.questionNumber}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {q.section === 'MULTIPLE_CHOICE'
                      ? 'Phần I - Trắc nghiệm (4 lựa chọn)'
                      : q.section === 'TRUE_FALSE'
                      ? 'Phần II - Đúng/Sai (4 ý a-b-c-d)'
                      : q.section === 'SHORT_ANSWER'
                      ? 'Phần III - Trả lời ngắn'
                      : 'Phần IV - Tự luận'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Cognitive Level Selector */}
                  <select
                    value={q.cognitive_level}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, {
                        ...q,
                        cognitive_level: e.target.value as CognitiveLevel,
                      })
                    }
                    className="text-xs font-bold px-2 py-1 rounded-lg border bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  >
                    <option value="KNOW">BIẾT</option>
                    <option value="UNDERSTAND">HIỂU</option>
                    <option value="APPLY">VẬN DỤNG</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">Điểm:</span>
                    <input
                      type="number"
                      step="0.05"
                      value={q.points}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, {
                          ...q,
                          points: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-14 text-center text-xs font-bold border rounded-lg py-0.5 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <button
                    onClick={() => handleMoveQuestion(idx, 'UP')}
                    disabled={idx === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Di chuyển lên"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveQuestion(idx, 'DOWN')}
                    disabled={idx === activeEditingExam.questions.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Di chuyển xuống"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-1 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Xóa câu này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nội dung câu hỏi:
                </label>
                <textarea
                  rows={2}
                  value={q.content}
                  onChange={(e) =>
                    handleUpdateQuestion(idx, { ...q, content: e.target.value })
                  }
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Curriculum Learning Outcome (Yêu cầu cần đạt chuẩn SGK) */}
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <span>Yêu cầu cần đạt chuẩn SGK Kết nối tri thức (Chuẩn đầu ra):</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Nhập yêu cầu cần đạt (ví dụ: Nhận biết công thức cấu tạo..., Giải thích được hiện tượng...)"
                  value={q.curriculumRequirement || ''}
                  onChange={(e) =>
                    handleUpdateQuestion(idx, { ...q, curriculumRequirement: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                />
                {/* Quick Recommendation Chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-slate-500 font-medium">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuestion(idx, {
                        ...q,
                        curriculumRequirement: `Nhận biết định nghĩa, tính chất và công thức cốt lõi của ${q.topic || activeEditingExam.topic}`,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer"
                  >
                    + Nhận biết công thức
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuestion(idx, {
                        ...q,
                        curriculumRequirement: `Giải thích được nguyên lý, cơ chế và hiện tượng thực tiễn của ${q.topic || activeEditingExam.topic}`,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer"
                  >
                    + Giải thích nguyên lý
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuestion(idx, {
                        ...q,
                        curriculumRequirement: `Vận dụng kiến thức để giải bài toán định lượng và liên hệ thực tế ${q.topic || activeEditingExam.topic}`,
                      })
                    }
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer"
                  >
                    + Vận dụng giải bài tập
                  </button>
                </div>
              </div>

              {/* SECTION I: Multiple choice options */}
              {q.section === 'MULTIPLE_CHOICE' && q.options && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    4 Phương án lựa chọn (Chọn nút tròn để đặt đáp án Đúng):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      return (
                        <div key={letter} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border">
                          <span className="font-bold w-4 text-purple-700 dark:text-purple-300">{letter}:</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options!];
                              newOpts[oIdx] = e.target.value;
                              handleUpdateQuestion(idx, { ...q, options: newOpts });
                            }}
                            className="flex-1 p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs"
                          />
                          <label className="flex items-center gap-1 font-semibold text-[11px] cursor-pointer">
                            <input
                              type="radio"
                              name={`correct_${q.questionNumber}`}
                              checked={q.correctAnswer === letter}
                              onChange={() =>
                                handleUpdateQuestion(idx, { ...q, correctAnswer: letter })
                              }
                            />
                            <span className={q.correctAnswer === letter ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                              Đúng
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION II: True / False 4 sub-items */}
              {q.section === 'TRUE_FALSE' && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    4 Ý đánh giá Đúng / Sai (a, b, c, d):
                  </label>
                  {(q.trueFalseItems || [
                    { id: '1', label: 'a' as const, statement: '', isCorrect: true },
                    { id: '2', label: 'b' as const, statement: '', isCorrect: false },
                    { id: '3', label: 'c' as const, statement: '', isCorrect: true },
                    { id: '4', label: 'd' as const, statement: '', isCorrect: false },
                  ]).map((item, subIdx) => (
                    <div key={item.id || subIdx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border text-xs">
                      <span className="w-5 font-bold text-center text-purple-700 dark:text-purple-300">
                        {item.label})
                      </span>
                      <input
                        type="text"
                        value={item.statement}
                        onChange={(e) => {
                          const currentItems = [...(q.trueFalseItems || [])];
                          currentItems[subIdx] = { ...currentItems[subIdx], statement: e.target.value };
                          handleUpdateQuestion(idx, { ...q, trueFalseItems: currentItems });
                        }}
                        placeholder={`Mệnh đề phát biểu ý ${item.label}...`}
                        className="flex-1 p-1.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = [...(q.trueFalseItems || [])];
                            currentItems[subIdx] = { ...currentItems[subIdx], isCorrect: true };
                            handleUpdateQuestion(idx, { ...q, trueFalseItems: currentItems });
                          }}
                          className={`px-2.5 py-1 rounded-md font-bold text-[11px] cursor-pointer transition-colors ${
                            item.isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          ĐÚNG
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = [...(q.trueFalseItems || [])];
                            currentItems[subIdx] = { ...currentItems[subIdx], isCorrect: false };
                            handleUpdateQuestion(idx, { ...q, trueFalseItems: currentItems });
                          }}
                          className={`px-2.5 py-1 rounded-md font-bold text-[11px] cursor-pointer transition-colors ${
                            !item.isCorrect
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          SAI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION III: Short answer */}
              {q.section === 'SHORT_ANSWER' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Đáp án / Từ khóa trả lời ngắn (Học sinh phải điền khớp):
                  </label>
                  <input
                    type="text"
                    value={q.shortAnswerKey || ''}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, { ...q, shortAnswerKey: e.target.value })
                    }
                    placeholder="Ví dụ: 0.05, hoặc 12, hoặc CH3COOH..."
                    className="w-full sm:w-1/2 p-2 border rounded-lg bg-white dark:bg-slate-900 font-bold text-purple-700 dark:text-purple-300 text-xs"
                  />
                </div>
              )}

              {/* SECTION IV: Essay sample answer and rubrics */}
              {q.section === 'ESSAY' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Đáp án mẫu / Nội dung tự luận cần trình bày:
                    </label>
                    <textarea
                      rows={2}
                      value={q.sampleEssayAnswer || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, { ...q, sampleEssayAnswer: e.target.value })
                      }
                      placeholder="Trình bày các bước lập luận, tính toán và đáp án chi tiết..."
                      className="w-full p-2 bg-white dark:bg-slate-900 border rounded-lg"
                    />
                  </div>

                  {/* Rubric items */}
                  {q.essayRubric && q.essayRubric.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Tiêu chí chấm Rubric ({q.essayRubric.length} tiêu chí):
                      </label>
                      {q.essayRubric.map((rub, rIdx) => (
                        <div key={rub.id || rIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border">
                          <input
                            type="text"
                            value={rub.criteria}
                            onChange={(e) => {
                              const list = [...(q.essayRubric || [])];
                              list[rIdx] = { ...list[rIdx], criteria: e.target.value };
                              handleUpdateQuestion(idx, { ...q, essayRubric: list });
                            }}
                            placeholder="Tiêu chí..."
                            className="p-1.5 border rounded-lg"
                          />
                          <input
                            type="text"
                            value={rub.expectedContent}
                            onChange={(e) => {
                              const list = [...(q.essayRubric || [])];
                              list[rIdx] = { ...list[rIdx], expectedContent: e.target.value };
                              handleUpdateQuestion(idx, { ...q, essayRubric: list });
                            }}
                            placeholder="Nội dung mong đợi..."
                            className="p-1.5 border rounded-lg"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Điểm:</span>
                            <input
                              type="number"
                              step="0.1"
                              value={rub.points}
                              onChange={(e) => {
                                const list = [...(q.essayRubric || [])];
                                list[rIdx] = { ...list[rIdx], points: parseFloat(e.target.value) || 0 };
                                handleUpdateQuestion(idx, { ...q, essayRubric: list });
                              }}
                              className="w-16 p-1.5 border rounded-lg font-bold text-center"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Hướng dẫn giải / Lời giải chi tiết:
                </label>
                <input
                  type="text"
                  placeholder="Hướng dẫn giải / Lời giải chi tiết..."
                  value={q.explanation || ''}
                  onChange={(e) =>
                    handleUpdateQuestion(idx, { ...q, explanation: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-600 dark:text-slate-400"
                />
              </div>
            </div>
          ))}

          {/* Persistent Floating Bottom Bar for Saving Changes */}
          <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border-2 border-emerald-500/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs">
                Đang chỉnh sửa: {activeEditingExam.title}
              </span>
              <span className="text-xs text-slate-500 font-medium">({activeEditingExam.questions.length} câu hỏi)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('LIBRARY')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                ← Trở lại thư viện
              </button>
              <button
                type="button"
                onClick={handleSaveActiveEditingExam}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer transition-all hover:scale-105"
                title="Lưu lại tất cả thay đổi trong đề thi này vào hệ thống"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Verification Results Modal */}
      {showVerifyModal && verifyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kết quả AI kiểm tra chất lượng đề
                </h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                verifyResult.status === 'HOP_LE'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : verifyResult.status === 'CAN_XEM_LAI'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {verifyResult.status === 'HOP_LE' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="font-bold">
                {verifyResult.status === 'HOP_LE'
                  ? 'ĐỀ THI HỢP LỆ (100%)'
                  : verifyResult.status === 'CAN_XEM_LAI'
                  ? 'CẦN XEM LẠI'
                  : 'CÓ LỖI CẦN SỬA TRƯỚC KHI DUYỆT'}
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {verifyResult.summary}
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {verifyResult.issues.map((iss, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    iss.type === 'ERROR'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : iss.type === 'WARNING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{iss.message}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
