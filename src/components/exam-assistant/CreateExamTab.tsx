import React, { useState } from 'react';
import {
  ExamPaper,
  ExamQuestion,
  ExamMatrixItem,
  ExamSpecificationItem,
  ExamStatus,
  QuestionBankItem,
  ExamSectionType,
} from '../../types/examTypes';
import { CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  Plus,
  Layers,
  Sparkles,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Share2,
  Copy,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Clock,
  Printer,
  HelpCircle,
  ShieldCheck,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';

interface CreateExamTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  exams: ExamPaper[];
  onRefreshExams: () => void;
  onSelectExamToTake?: (exam: ExamPaper) => void;
  onRequestConfirmDelete?: (item: { id: string; title: string }) => void;
}

export const CreateExamTab: React.FC<CreateExamTabProps> = ({
  userRole,
  exams,
  onRefreshExams,
  onSelectExamToTake,
  onRequestConfirmDelete,
}) => {
  // Active view inside CreateExamTab: 'LIST' | 'EDITOR' | 'BANK'
  const [subView, setSubView] = useState<'LIST' | 'EDITOR' | 'BANK'>('LIST');

  // Currently editing exam
  const [activeExam, setActiveExam] = useState<ExamPaper | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'QUESTIONS' | 'MATRIX' | 'SPECS'>('QUESTIONS');

  // Search & Filter in Exam Library
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Question Bank modal or view
  const [bankSearch, setBankSearch] = useState('');
  const [bankFilterLevel, setBankFilterLevel] = useState<string>('ALL');
  const [bankFilterSection, setBankFilterSection] = useState<string>('ALL');
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => examService.getQuestionBank());

  // AI Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // New Exam Form Parameters
  const [formSubject, setFormSubject] = useState('Hóa học');
  const [formGrade, setFormGrade] = useState(11);
  const [formChapter, setFormChapter] = useState('Chương 5: Dẫn xuất Halogen - Alcohol - Phenol');
  const [formTopic, setFormTopic] = useState('Alcohol và Phenol trong thực tiễn');
  const [formDuration, setFormDuration] = useState(45);
  const [ratioKnow, setRatioKnow] = useState(40);
  const [ratioUnderstand, setRatioUnderstand] = useState(40);
  const [ratioApply, setRatioApply] = useState(20);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Filtered exams list
  const filteredExams = exams.filter((e) => {
    const matchSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Handle Create New Exam (Open generator/editor)
  const handleStartCreateNew = () => {
    const sum = ratioKnow + ratioUnderstand + ratioApply;
    if (sum !== 100) {
      toastService.error(`Tổng tỷ lệ BIẾT + HIỂU + VẬN DỤNG (${sum}%) phải đúng bằng 100%. Vui lòng điều chỉnh lại.`);
      return;
    }

    setIsGeneratingAI(true);
    setTimeout(() => {
      const generated = examService.generateExamOffline({
        subject: formSubject,
        grade: formGrade,
        chapter: formChapter,
        topic: formTopic,
        durationMinutes: formDuration,
        ratio: { know: ratioKnow, understand: ratioUnderstand, apply: ratioApply },
        structure: { part1Count: 12, part2Count: 2, part3Count: 6, part4Count: 1 },
      });
      setActiveExam(generated);
      setIsGeneratingAI(false);
      setSubView('EDITOR');
      toastService.success(`Đã tự động lập Ma trận, Đặc tả và tạo đề "${generated.title}" theo SGK Kết nối tri thức!`);
    }, 400);
  };

  // AI Verification execution
  const handleRunAIVerification = () => {
    if (!activeExam) return;
    setIsVerifying(true);
    setTimeout(() => {
      const result = examService.verifyExamPaper(activeExam);
      const updatedExam = { ...activeExam, aiVerification: result };
      setActiveExam(updatedExam);
      examService.saveExam(updatedExam);
      setIsVerifying(false);
      setShowVerifyModal(true);

      if (result.status === 'HOP_LE') {
        toastService.success('AI Kiểm tra đề: Đề thi HỢP LỆ và khớp chuẩn 100%!');
      } else if (result.status === 'CAN_XEM_LAI') {
        toastService.warning('AI Kiểm tra đề: Cần xem lại một số khuyến nghị sư phạm.');
      } else {
        toastService.error('AI Kiểm tra đề: Phát hiện lỗi cần khắc phục trước khi duyệt!');
      }
    }, 600);
  };

  // Change exam status: Duyệt đề & Phát hành
  const handleApproveExam = (exam: ExamPaper) => {
    examService.approveExam(exam.id, 'Thầy Nguyễn Vũ');
    toastService.success(`Giáo viên đã DUYỆT đề "${exam.title}"! Đề sẵn sàng để phát hành.`);
    onRefreshExams();
    if (activeExam?.id === exam.id) {
      setActiveExam({ ...activeExam, status: 'DA_DUYET' });
    }
  };

  const handlePublishExam = (exam: ExamPaper) => {
    if (exam.status === 'NHAP' || exam.status === 'CHO_DUYET') {
      toastService.warning('Đề thi chưa được Giáo viên duyệt. Vui lòng bấm [Duyệt đề] trước khi phát hành cho học sinh.');
      return;
    }
    examService.publishExam(exam.id);
    toastService.success(`Đã PHÁT HÀNH chính thức đề "${exam.title}" cho toàn thể lớp học.`);
    onRefreshExams();
    if (activeExam?.id === exam.id) {
      setActiveExam({ ...activeExam, status: 'PHAT_HANH' });
    }
  };

  const handleSaveActiveExam = () => {
    if (!activeExam) return;
    // Check Cognitive level for all questions
    const missingCognitive = activeExam.questions.some((q) => !q.cognitive_level);
    if (missingCognitive) {
      toastService.error('Không thể lưu đề! Tồn tại câu hỏi chưa có trường Mức độ nhận thức (BIẾT / HIỂU / VẬN DỤNG).');
      return;
    }

    examService.saveExam(activeExam);
    toastService.success(`Đã lưu thành công đề "${activeExam.title}".`);
    onRefreshExams();
  };

  const handleCopyLink = (exam: ExamPaper) => {
    const link = exam.shareableLink || `${window.location.origin}?exam=${exam.code}`;
    navigator.clipboard.writeText(link);
    toastService.success(`Đã sao chép link giao đề "${exam.code}" vào khay nhớ tạm!`);
  };

  const handleDuplicateExam = (examId: string) => {
    const dup = examService.duplicateExam(examId);
    if (dup) {
      toastService.success(`Đã nhân bản thành công đề "${dup.title}".`);
      onRefreshExams();
    }
  };

  const handleAddQuestionFromBank = (bankItem: QuestionBankItem) => {
    if (!activeExam) return;
    const nextQNum = activeExam.questions.length + 1;
    const newQ: ExamQuestion = {
      ...bankItem,
      id: `Q_MANUAL_${Date.now()}`,
      questionNumber: nextQNum,
    };
    const updatedQuestions = [...activeExam.questions, newQ];
    setActiveExam({ ...activeExam, questions: updatedQuestions, totalQuestions: updatedQuestions.length });
    toastService.success(`Đã thêm câu ${nextQNum} từ Ngân hàng vào đề.`);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!activeExam) return;
    const updated = activeExam.questions.filter((_, idx) => idx !== qIndex);
    // Renumber
    const renumbered = updated.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setActiveExam({ ...activeExam, questions: renumbered, totalQuestions: renumbered.length });
    toastService.info('Đã xóa câu hỏi khỏi đề.');
  };

  const handleMoveQuestion = (qIndex: number, direction: 'UP' | 'DOWN') => {
    if (!activeExam) return;
    const targetIdx = direction === 'UP' ? qIndex - 1 : qIndex + 1;
    if (targetIdx < 0 || targetIdx >= activeExam.questions.length) return;

    const newQuestions = [...activeExam.questions];
    const temp = newQuestions[qIndex];
    newQuestions[qIndex] = newQuestions[targetIdx];
    newQuestions[targetIdx] = temp;

    // Renumber
    const renumbered = newQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setActiveExam({ ...activeExam, questions: renumbered });
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation bar: Library / Editor / Question Bank */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSubView('LIST')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              subView === 'LIST'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Thư viện đề ({exams.length})
          </button>
          {activeExam && (
            <button
              onClick={() => setSubView('EDITOR')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                subView === 'EDITOR'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Chỉnh sửa đề ({activeExam.code})
            </button>
          )}
          <button
            onClick={() => setSubView('BANK')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              subView === 'BANK'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ngân hàng câu hỏi ({questionBank.length})
          </button>
        </div>

        {subView === 'LIST' && userRole === 'TEACHER' && (
          <button
            onClick={() => {
              // Open modal or create default
              handleStartCreateNew();
            }}
            disabled={isGeneratingAI}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Tạo đề mới</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: THƯ VIỆN ĐỀ KIỂM TRA (LIST)                      */}
      {/* ======================================================== */}
      {subView === 'LIST' && (
        <div className="space-y-4">
          {/* AI Generator Quick Panel for Teacher */}
          {userRole === 'TEACHER' && (
            <div className="bg-gradient-to-r from-purple-50/80 via-white to-blue-50/80 dark:from-purple-950/20 dark:via-slate-900 dark:to-blue-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-800/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Trợ lý AI Lập Ma trận & Sinh đề kiểm tra tự động
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Đảm bảo 100% chuẩn kiến thức kỹ năng SGK Kết nối tri thức và kiểm tra chéo Ma trận - Bản đặc tả - Thang điểm 10đ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Parameters Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Môn học & Khối
                  </label>
                  <input
                    type="text"
                    value={`${formSubject} - Lớp ${formGrade}`}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chương học SGK
                  </label>
                  <select
                    value={formChapter}
                    onChange={(e) => setFormChapter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Chương 5: Dẫn xuất Halogen - Alcohol - Phenol">Chương 5: Halogen - Alcohol - Phenol</option>
                    <option value="Chương 6: Hợp chất Carbonyl - Carboxylic Acid">Chương 6: Carbonyl - Carboxylic Acid</option>
                    <option value="Chương 4: Hydrocarbon">Chương 4: Hydrocarbon</option>
                    <option value="Chương 1: Cân bằng hoá học">Chương 1: Cân bằng hoá học</option>
                    <option value="Chương 2: Nitrogen và Sulfur">Chương 2: Nitrogen và Sulfur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chủ đề kiến thức trọng tâm
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Ví dụ: Tính chất Alcohol, Phản ứng tráng bạc..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thời gian làm bài
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={15}>15 phút (Kiểm tra nhanh)</option>
                    <option value={45}>45 phút (1 tiết định kỳ)</option>
                    <option value={60}>60 phút (Giữa kỳ)</option>
                    <option value={90}>90 phút (Cuối kỳ)</option>
                  </select>
                </div>
              </div>

              {/* Ratio Cognitive Level Inputs */}
              <div className="bg-white/80 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Tỷ lệ 3 Mức độ nhận thức (Tổng bắt buộc = 100%):
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      ratioKnow + ratioUnderstand + ratioApply === 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Tổng: {ratioKnow + ratioUnderstand + ratioApply}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300">BIẾT (KNOW)</span>
                      <span className="text-[11px] text-slate-500">Nhận diện, công thức</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ratioKnow}
                        onChange={(e) => setRatioKnow(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-center"
                      />
                      <span>% (tương ứng {(ratioKnow * 0.1).toFixed(1)}đ)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-700 dark:text-purple-300">HIỂU (UNDERSTAND)</span>
                      <span className="text-[11px] text-slate-500">Bản chất, giải thích</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ratioUnderstand}
                        onChange={(e) => setRatioUnderstand(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-center"
                      />
                      <span>% (tương ứng {(ratioUnderstand * 0.1).toFixed(1)}đ)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">VẬN DỤNG (APPLY)</span>
                      <span className="text-[11px] text-slate-500">Thực tiễn, tính toán</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={ratioApply}
                        onChange={(e) => setRatioApply(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-center"
                      />
                      <span>% (tương ứng {(ratioApply * 0.1).toFixed(1)}đ)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    * Đề thi chuẩn gồm 4 Phần: Trắc nghiệm 4 lựa chọn (5đ), Đúng/Sai 4 ý (2đ), Trả lời ngắn (1,5đ), Tự luận rubric (1,5đ).
                  </span>
                  <button
                    onClick={handleStartCreateNew}
                    disabled={isGeneratingAI || ratioKnow + ratioUnderstand + ratioApply !== 100}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAI ? 'Đang phân tích & lập đề...' : 'Tạo đề & Ma trận ngay'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đề, tên đề, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PHAT_HANH">Đã phát hành</option>
                <option value="DA_DUYET">Đã duyệt (Chờ phát hành)</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="NHAP">Bản nháp</option>
              </select>
            </div>
          </div>

          {/* Exams List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredExams.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
                Không tìm thấy đề kiểm tra nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredExams.map((exam) => {
                const statusBadge =
                  exam.status === 'PHAT_HANH'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : exam.status === 'DA_DUYET'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                    : exam.status === 'CHO_DUYET'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

                const statusLabel =
                  exam.status === 'PHAT_HANH'
                    ? 'Đã phát hành'
                    : exam.status === 'DA_DUYET'
                    ? 'Đã duyệt'
                    : exam.status === 'CHO_DUYET'
                    ? 'Chờ duyệt'
                    : 'Bản nháp';

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Top Row: Code, Subject badge, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {exam.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {exam.durationMinutes} phút · {exam.totalQuestions} câu
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Title & Topic */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {exam.chapter} · {exam.topic}
                      </p>
                    </div>

                    {/* Ratio Breakdown Pill */}
                    <div className="flex items-center gap-1.5 text-[10px] font-medium pt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        BIẾT: {exam.ratio.know}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                        HIỂU: {exam.ratio.understand}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        VẬN DỤNG: {exam.ratio.apply}%
                      </span>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2 text-xs">
                      {/* Left: Take Exam button (for Student or Teacher Preview) */}
                      <button
                        onClick={() => onSelectExamToTake?.(exam)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{userRole === 'STUDENT' ? 'Làm bài thi' : 'Xem / Thi thử'}</span>
                      </button>

                      {/* Right: Teacher Controls */}
                      {userRole === 'TEACHER' && (
                        <div className="flex items-center gap-1">
                          {/* Approve Button */}
                          {exam.status !== 'DA_DUYET' && exam.status !== 'PHAT_HANH' && (
                            <button
                              onClick={() => handleApproveExam(exam)}
                              className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded font-semibold transition-colors cursor-pointer border border-blue-200 dark:border-blue-800 text-[11px]"
                              title="Giáo viên duyệt đề"
                            >
                              Duyệt đề
                            </button>
                          )}

                          {/* Publish Button */}
                          {exam.status !== 'PHAT_HANH' && (
                            <button
                              onClick={() => handlePublishExam(exam)}
                              className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded font-semibold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 text-[11px]"
                              title="Phát hành cho học sinh làm"
                            >
                              Phát hành
                            </button>
                          )}

                          {/* Edit in Editor */}
                          <button
                            onClick={() => {
                              setActiveExam(exam);
                              setSubView('EDITOR');
                            }}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded cursor-pointer transition-colors"
                            title="Mở trình soạn đề & Ma trận"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicateExam(exam.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded cursor-pointer transition-colors"
                            title="Nhân bản đề này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(exam)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded cursor-pointer transition-colors"
                            title="Sao chép link giao đề"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Export Word */}
                          <button
                            onClick={() => examService.exportExamToWord(exam, true)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded cursor-pointer transition-colors"
                            title="Tải file Word (.doc kèm đáp án & hướng dẫn chấm)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete to Trash */}
                          <button
                            onClick={() =>
                              onRequestConfirmDelete
                                ? onRequestConfirmDelete({ id: exam.id, title: exam.title })
                                : examService.deleteExam(exam.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded cursor-pointer transition-colors"
                            title="Xóa vào Thùng rác"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: TRÌNH SOẠN THẢO ĐỀ, MA TRẬN & ĐẶC TẢ (EDITOR)   */}
      {/* ======================================================== */}
      {subView === 'EDITOR' && activeExam && (
        <div className="space-y-4">
          {/* Editor Header Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200">
                  {activeExam.code}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {activeExam.title}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeExam.status === 'PHAT_HANH'
                      ? 'bg-emerald-50 text-emerald-700'
                      : activeExam.status === 'DA_DUYET'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {activeExam.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeExam.chapter} · {activeExam.totalQuestions} câu · Thang 10,0 điểm · SGK Kết nối tri thức
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* AI Check button */}
              <button
                onClick={handleRunAIVerification}
                disabled={isVerifying}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Đang kiểm tra...' : 'AI KIỂM TRA ĐỀ'}</span>
              </button>

              {/* Save Exam */}
              <button
                onClick={handleSaveActiveExam}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu đề</span>
              </button>

              {/* Export Word for Teacher */}
              <button
                onClick={() => examService.exportExamToWord(activeExam, true)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Tải file Word (.doc có đáp án)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word (Đáp án)</span>
              </button>

              {/* Export Word for Student */}
              <button
                onClick={() => examService.exportExamToWord(activeExam, false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Tải file Word đề thi học sinh (không đáp án)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Đề học sinh</span>
              </button>

              {/* Back to list */}
              <button
                onClick={() => setSubView('LIST')}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Sub tabs in Editor: Questions / Matrix / Specifications */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveEditorTab('QUESTIONS')}
              className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                activeEditorTab === 'QUESTIONS'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Câu hỏi & Đáp án ({activeExam.questions.length})
            </button>
            <button
              onClick={() => setActiveEditorTab('MATRIX')}
              className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                activeEditorTab === 'MATRIX'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Ma trận đề thi (Matrix)
            </button>
            <button
              onClick={() => setActiveEditorTab('SPECS')}
              className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-colors ${
                activeEditorTab === 'SPECS'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Bản đặc tả câu hỏi (Specifications)
            </button>
          </div>

          {/* Sub Tab: QUESTIONS */}
          {activeEditorTab === 'QUESTIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Danh sách câu hỏi theo 4 phần thi chuẩn
                </span>
                <button
                  onClick={() => setSubView('BANK')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg font-bold cursor-pointer hover:bg-purple-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn thêm từ Ngân hàng câu hỏi</span>
                </button>
              </div>

              <div className="space-y-3">
                {activeExam.questions.map((q, idx) => {
                  const levelMeta = COGNITIVE_LEVEL_META[q.cognitive_level] || COGNITIVE_LEVEL_META.UNDERSTAND;
                  return (
                    <div
                      key={q.id || idx}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3"
                    >
                      {/* Top bar of question */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                            {q.questionNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {q.section === 'MULTIPLE_CHOICE'
                              ? 'Phần I: Trắc nghiệm'
                              : q.section === 'TRUE_FALSE'
                              ? 'Phần II: Đúng / Sai'
                              : q.section === 'SHORT_ANSWER'
                              ? 'Phần III: Trả lời ngắn'
                              : 'Phần IV: Tự luận'}
                          </span>
                          {/* Cognitive Level selector */}
                          <select
                            value={q.cognitive_level}
                            onChange={(e) => {
                              const newLevel = e.target.value as CognitiveLevel;
                              const updated = [...activeExam.questions];
                              updated[idx] = { ...q, cognitive_level: newLevel };
                              setActiveExam({ ...activeExam, questions: updated });
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${levelMeta.badgeClass}`}
                          >
                            <option value="KNOW">BIẾT</option>
                            <option value="UNDERSTAND">HIỂU</option>
                            <option value="APPLY">VẬN DỤNG</option>
                          </select>
                        </div>

                        {/* Question controls: Move, Delete */}
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">
                            {formatScore(q.points)}
                          </span>
                          <button
                            onClick={() => handleMoveQuestion(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Đổi lên trên"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveQuestion(idx, 'DOWN')}
                            disabled={idx === activeExam.questions.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Đổi xuống dưới"
                          >
                            ▼
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content textarea */}
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) => {
                          const updated = [...activeExam.questions];
                          updated[idx] = { ...q, content: e.target.value };
                          setActiveExam({ ...activeExam, questions: updated });
                        }}
                        className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />

                      {/* Options for Part I */}
                      {q.section === 'MULTIPLE_CHOICE' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, optIdx) => {
                            const optLetter = String.fromCharCode(65 + optIdx);
                            const isCorrect = q.correctAnswer === optLetter;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...activeExam.questions];
                                    updated[idx] = { ...q, correctAnswer: optLetter };
                                    setActiveExam({ ...activeExam, questions: updated });
                                  }}
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                  title="Đặt làm đáp án đúng"
                                >
                                  {optLetter}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updatedOpts = [...(q.options || [])];
                                    updatedOpts[optIdx] = e.target.value;
                                    const updated = [...activeExam.questions];
                                    updated[idx] = { ...q, options: updatedOpts };
                                    setActiveExam({ ...activeExam, questions: updated });
                                  }}
                                  className="flex-1 bg-transparent text-xs focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True / False for Part II */}
                      {q.section === 'TRUE_FALSE' && q.trueFalseItems && (
                        <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {q.trueFalseItems.map((tf, tfIdx) => (
                            <div key={tf.id} className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-700 dark:text-slate-300 w-5">
                                {tf.label})
                              </span>
                              <input
                                type="text"
                                value={tf.statement}
                                onChange={(e) => {
                                  const updatedTf = [...(q.trueFalseItems || [])];
                                  updatedTf[tfIdx] = { ...tf, statement: e.target.value };
                                  const updated = [...activeExam.questions];
                                  updated[idx] = { ...q, trueFalseItems: updatedTf };
                                  setActiveExam({ ...activeExam, questions: updated });
                                }}
                                className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedTf = [...(q.trueFalseItems || [])];
                                  updatedTf[tfIdx] = { ...tf, isCorrect: !tf.isCorrect };
                                  const updated = [...activeExam.questions];
                                  updated[idx] = { ...q, trueFalseItems: updatedTf };
                                  setActiveExam({ ...activeExam, questions: updated });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                  tf.isCorrect
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {tf.isCorrect ? 'ĐÚNG' : 'SAI'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Short Answer Key for Part III */}
                      {q.section === 'SHORT_ANSWER' && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Từ khóa đáp số:</span>
                          <input
                            type="text"
                            value={q.shortAnswerKey || ''}
                            onChange={(e) => {
                              const updated = [...activeExam.questions];
                              updated[idx] = { ...q, shortAnswerKey: e.target.value };
                              setActiveExam({ ...activeExam, questions: updated });
                            }}
                            placeholder="Ví dụ: 0.4 hoặc C2H5OH..."
                            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                          />
                        </div>
                      )}

                      {/* Essay Rubric for Part IV */}
                      {q.section === 'ESSAY' && (
                        <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Đáp án & Tiêu chí chấm chi tiết (Rubric):
                          </span>
                          <textarea
                            rows={3}
                            value={q.sampleEssayAnswer || ''}
                            onChange={(e) => {
                              const updated = [...activeExam.questions];
                              updated[idx] = { ...q, sampleEssayAnswer: e.target.value };
                              setActiveExam({ ...activeExam, questions: updated });
                            }}
                            placeholder="Hướng dẫn chấm chi tiết bám sát SGK Kết nối tri thức..."
                            className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub Tab: MATRIX */}
          {activeEditorTab === 'MATRIX' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ma trận đề kiểm tra (Exam Matrix)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phân bố chủ đề × số câu × số điểm × tỷ lệ % theo 3 mức độ nhận thức
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Chương & Chủ đề</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center text-blue-600">BIẾT (KNOW)</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center text-purple-600">HIỂU (UNDERSTAND)</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center text-emerald-600">VẬN DỤNG (APPLY)</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">Tổng điểm</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">Tỷ lệ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeExam.matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-medium">
                          {row.chapter} · {row.topic}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">
                          {row.knowCount} câu ({formatScore(row.knowPoints)})
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">
                          {row.understandCount} câu ({formatScore(row.understandPoints)})
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">
                          {row.applyCount} câu ({formatScore(row.applyPoints)})
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
                          {formatScore(row.totalPoints)}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
                          {row.percentage}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-purple-50/50 dark:bg-purple-950/20 font-bold">
                      <td className="border border-slate-200 dark:border-slate-700 p-2">TỔNG CỘNG TOÀN ĐỀ</td>
                      <td className="border border-slate-200 dark:border-slate-700 p-2 text-center text-blue-600">
                        {activeExam.ratio.know}% ({(activeExam.ratio.know * 0.1).toFixed(1)}đ)
                      </td>
                      <td className="border border-slate-200 dark:border-slate-700 p-2 text-center text-purple-600">
                        {activeExam.ratio.understand}% ({(activeExam.ratio.understand * 0.1).toFixed(1)}đ)
                      </td>
                      <td className="border border-slate-200 dark:border-slate-700 p-2 text-center text-emerald-600">
                        {activeExam.ratio.apply}% ({(activeExam.ratio.apply * 0.1).toFixed(1)}đ)
                      </td>
                      <td className="border border-slate-200 dark:border-slate-700 p-2 text-center text-purple-700">
                        10,0đ
                      </td>
                      <td className="border border-slate-200 dark:border-slate-700 p-2 text-center text-purple-700">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: SPECIFICATIONS */}
          {activeEditorTab === 'SPECS' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bản đặc tả đề kiểm tra (Test Specifications)
                </h3>
                <p className="text-xs text-slate-500">
                  Mô tả chuẩn Yêu cầu cần đạt SGK Kết nối tri thức ứng với từng câu hỏi
                </p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center w-12">Câu</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center w-24">Dạng câu</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center w-24">Mức độ</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Yêu cầu cần đạt chuẩn SGK</th>
                      <th className="border border-slate-200 dark:border-slate-700 p-2 text-center w-20">Điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeExam.specifications.map((spec) => (
                      <tr key={spec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
                          {spec.questionNumber}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">
                          {spec.section === 'MULTIPLE_CHOICE'
                            ? 'Trắc nghiệm'
                            : spec.section === 'TRUE_FALSE'
                            ? 'Đúng/Sai'
                            : spec.section === 'SHORT_ANSWER'
                            ? 'Trả lời ngắn'
                            : 'Tự luận'}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              COGNITIVE_LEVEL_META[spec.cognitive_level]?.badgeClass || ''
                            }`}
                          >
                            {spec.cognitive_level}
                          </span>
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2">
                          {spec.competencyRequirement}
                        </td>
                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
                          {formatScore(spec.points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: NGÂN HÀNG CÂU HỎI (QUESTION BANK)                */}
      {/* ======================================================== */}
      {subView === 'BANK' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm câu hỏi trong Ngân hàng Hóa học 11..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select
                value={bankFilterLevel}
                onChange={(e) => setBankFilterLevel(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 focus:outline-none"
              >
                <option value="ALL">Mọi mức độ</option>
                <option value="KNOW">BIẾT</option>
                <option value="UNDERSTAND">HIỂU</option>
                <option value="APPLY">VẬN DỤNG</option>
              </select>

              <select
                value={bankFilterSection}
                onChange={(e) => setBankFilterSection(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 focus:outline-none"
              >
                <option value="ALL">Mọi phần thi</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="TRUE_FALSE">Đúng / Sai</option>
                <option value="SHORT_ANSWER">Trả lời ngắn</option>
                <option value="ESSAY">Tự luận</option>
              </select>
            </div>

            {activeExam && (
              <button
                onClick={() => setSubView('EDITOR')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Quay lại đề đang soạn
              </button>
            )}
          </div>

          <div className="space-y-3">
            {questionBank
              .filter((q) => {
                const matchSearch =
                  bankSearch.trim() === '' ||
                  q.content.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  q.topic.toLowerCase().includes(bankSearch.toLowerCase());
                const matchLevel = bankFilterLevel === 'ALL' || q.cognitive_level === bankFilterLevel;
                const matchSec = bankFilterSection === 'ALL' || q.section === bankFilterSection;
                return matchSearch && matchLevel && matchSec;
              })
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {q.chapter} · {q.topic}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          COGNITIVE_LEVEL_META[q.cognitive_level]?.badgeClass || ''
                        }`}
                      >
                        {q.cognitive_level}
                      </span>
                    </div>

                    {activeExam && (
                      <button
                        onClick={() => handleAddQuestionFromBank(q)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded font-bold cursor-pointer hover:bg-purple-100"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Đưa vào đề</span>
                      </button>
                    )}
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {q.content}
                  </p>

                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {q.options.map((opt, i) => (
                        <div key={i}>{opt}</div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <strong>Đáp án / Lời giải:</strong> {q.correctAnswer || q.shortAnswerKey || 'Xem rubric tự luận'}. <em>{q.explanation}</em>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AI Verification Result Modal */}
      {showVerifyModal && activeExam?.aiVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    activeExam.aiVerification.status === 'HOP_LE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : activeExam.aiVerification.status === 'CAN_XEM_LAI'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kết quả AI Kiểm tra đề thi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Trạng thái: <strong>{activeExam.aiVerification.status}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {activeExam.aiVerification.summary}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {activeExam.aiVerification.issues.map((iss, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                    iss.type === 'ERROR'
                      ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      : iss.type === 'WARNING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{iss.message}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold cursor-pointer"
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
