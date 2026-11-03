import React, { useState } from 'react';
import { QuestionBankItem, ExamPaper, ExamQuestion, ExamSectionType } from '../../types/examTypes';
import { CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRight,
  HelpCircle,
  X,
  Save,
} from 'lucide-react';

interface QuestionBankTabProps {
  currentExam?: ExamPaper | null;
  onRefreshExam?: () => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  currentExam,
  onRefreshExam,
  userRole,
}) => {
  const [bank, setBank] = useState<QuestionBankItem[]>(() => examService.getQuestionBank());
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');

  // Mandatory cognitive level checkboxes as requested:
  // [ ] BIẾT
  // [ ] HIỂU
  // [ ] VẬN DỤNG
  const [filterKnow, setFilterKnow] = useState(true);
  const [filterUnderstand, setFilterUnderstand] = useState(true);
  const [filterApply, setFilterApply] = useState(true);

  // Edit / Add modal state
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AI Auto-pick modal state
  const [showAutoPickModal, setShowAutoPickModal] = useState(false);
  const [autoPickCount, setAutoPickCount] = useState(10);
  const [autoPickRatioKnow, setAutoPickRatioKnow] = useState(40);
  const [autoPickRatioUnderstand, setAutoPickRatioUnderstand] = useState(40);
  const [autoPickRatioApply, setAutoPickRatioApply] = useState(20);

  const refreshBank = () => {
    setBank(examService.getQuestionBank());
  };

  // Filtered list
  const filteredQuestions = bank.filter((item) => {
    // Subject filter
    if (subjectFilter !== 'ALL' && item.subject !== subjectFilter) return false;

    // Cognitive level checkbox filter
    const matchesLevel =
      (item.cognitive_level === 'KNOW' && filterKnow) ||
      (item.cognitive_level === 'UNDERSTAND' && filterUnderstand) ||
      (item.cognitive_level === 'APPLY' && filterApply);

    if (!matchesLevel) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchText =
        item.content.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.curriculumRequirement || '').toLowerCase().includes(q);
      if (!matchText) return false;
    }

    // Section filter
    if (sectionFilter !== 'ALL' && item.section !== sectionFilter) return false;

    // Topic filter
    if (topicFilter !== 'ALL' && item.topic !== topicFilter) return false;

    return true;
  });

  // Unique topics & subjects in bank
  const topics = Array.from(new Set(bank.map((q) => q.topic))).filter(Boolean);
  const subjects = Array.from(new Set(bank.map((q) => q.subject))).filter(Boolean);

  const handleDuplicate = (item: QuestionBankItem) => {
    const newItem: QuestionBankItem = {
      ...item,
      id: `QB_${Date.now()}`,
      content: `${item.content} (Bản sao)`,
      usageCount: 0,
    };
    examService.saveQuestionBankItem(newItem);
    refreshBank();
    toastService.success(`Đã nhân bản câu hỏi thành công!`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng không?')) {
      examService.deleteQuestionBankItem(id);
      refreshBank();
      toastService.info('Đã xóa câu hỏi khỏi Ngân hàng.');
    }
  };

  const handleAddToExam = (item: QuestionBankItem) => {
    if (!currentExam) {
      toastService.error('Chưa có đề nào được chọn để thêm câu hỏi!');
      return;
    }
    const nextQNum = currentExam.questions.length + 1;
    const newQ: ExamQuestion = {
      ...item,
      id: `Q_ADDED_${Date.now()}`,
      questionNumber: nextQNum,
    };
    const updatedExam: ExamPaper = {
      ...currentExam,
      questions: [...currentExam.questions, newQ],
      totalQuestions: currentExam.questions.length + 1,
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updatedExam);
    onRefreshExam?.();
    toastService.success(`Đã thêm câu hỏi vào đề "${currentExam.code}" (Câu số ${nextQNum})!`);
  };

  const handleSaveModalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.cognitive_level) {
      toastService.error('Bắt buộc phải chọn Mức độ nhận thức (BIẾT / HIỂU / VẬN DỤNG)!');
      return;
    }

    examService.saveQuestionBankItem(editingItem);
    refreshBank();
    setIsModalOpen(false);
    setEditingItem(null);
    toastService.success('Đã lưu câu hỏi vào Ngân hàng thành công!');
  };

  const handleOpenAddModal = () => {
    setEditingItem({
      id: `QB_${Date.now()}`,
      section: 'MULTIPLE_CHOICE',
      questionNumber: bank.length + 1,
      content: '',
      cognitive_level: 'KNOW',
      points: 0.25,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswer: 'A',
      explanation: '',
      topic: 'Dẫn xuất Halogen - Alcohol',
      chapter: 'Chương 5: Dẫn xuất Halogen - Alcohol - Phenol',
      subject: 'Hóa học',
      grade: 11,
      usageCount: 0,
      curriculumRequirement: 'Nhận biết khái niệm, công thức cấu tạo cơ bản.',
    });
    setIsModalOpen(true);
  };

  // AI Auto Pick Questions into Current Exam
  const handleExecuteAutoPick = () => {
    if (!currentExam) {
      toastService.error('Vui lòng chọn một đề kiểm tra trước!');
      return;
    }
    const sum = autoPickRatioKnow + autoPickRatioUnderstand + autoPickRatioApply;
    if (sum !== 100) {
      toastService.error(`Tổng tỷ lệ (${sum}%) phải đúng 100%!`);
      return;
    }

    const neededKnow = Math.round((autoPickCount * autoPickRatioKnow) / 100);
    const neededUnderstand = Math.round((autoPickCount * autoPickRatioUnderstand) / 100);
    const neededApply = autoPickCount - neededKnow - neededUnderstand;

    const knowItems = bank.filter((q) => q.cognitive_level === 'KNOW').slice(0, neededKnow);
    const understandItems = bank.filter((q) => q.cognitive_level === 'UNDERSTAND').slice(0, neededUnderstand);
    const applyItems = bank.filter((q) => q.cognitive_level === 'APPLY').slice(0, neededApply);

    const picked = [...knowItems, ...understandItems, ...applyItems];
    if (picked.length === 0) {
      toastService.warning('Ngân hàng không đủ câu hỏi theo tiêu chí đã chọn.');
      return;
    }

    const startNum = currentExam.questions.length + 1;
    const newQuestions: ExamQuestion[] = picked.map((item, idx) => ({
      ...item,
      id: `Q_AUTOPICK_${Date.now()}_${idx}`,
      questionNumber: startNum + idx,
    }));

    const updatedExam: ExamPaper = {
      ...currentExam,
      questions: [...currentExam.questions, ...newQuestions],
      totalQuestions: currentExam.questions.length + newQuestions.length,
      updatedAt: new Date().toISOString(),
    };

    examService.saveExam(updatedExam);
    onRefreshExam?.();
    setShowAutoPickModal(false);
    toastService.success(`AI đã tự động chọn và nạp ${newQuestions.length} câu hỏi theo chuẩn 3 mức độ vào đề!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              4. Ngân hàng câu hỏi chuẩn hóa
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                {bank.length} câu hỏi sẵn có
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Phân loại chặt chẽ theo 3 mức độ: BIẾT · HIỂU · VẬN DỤNG bám sát SGK Kết nối tri thức
            </p>
          </div>
        </div>

        {userRole === 'TEACHER' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAutoPickModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI chọn câu phù hợp</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar with MANDATORY Checkboxes */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung câu hỏi, chủ đề, mã câu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Subject dropdown */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả môn học</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                Môn: {s}
              </option>
            ))}
          </select>

          {/* Section dropdown */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả dạng câu</option>
            <option value="MULTIPLE_CHOICE">Phần I - Trắc nghiệm (4 lựa chọn)</option>
            <option value="TRUE_FALSE">Phần II - Đúng / Sai (4 ý a-b-c-d)</option>
            <option value="SHORT_ANSWER">Phần III - Trả lời ngắn</option>
            <option value="ESSAY">Phần IV - Tự luận (Rubric)</option>
          </select>

          {/* Topic dropdown */}
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* MANDATORY Checkboxes for 3 Cognitive Levels */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Bộ lọc Mức độ nhận thức bắt buộc:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer font-semibold select-none text-blue-700 dark:text-blue-400">
            <input
              type="checkbox"
              checked={filterKnow}
              onChange={(e) => setFilterKnow(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>[ ] BIẾT ({bank.filter((q) => q.cognitive_level === 'KNOW').length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-semibold select-none text-emerald-700 dark:text-emerald-400">
            <input
              type="checkbox"
              checked={filterUnderstand}
              onChange={(e) => setFilterUnderstand(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>[ ] HIỂU ({bank.filter((q) => q.cognitive_level === 'UNDERSTAND').length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-semibold select-none text-purple-700 dark:text-purple-400">
            <input
              type="checkbox"
              checked={filterApply}
              onChange={(e) => setFilterApply(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span>[ ] VẬN DỤNG ({bank.filter((q) => q.cognitive_level === 'APPLY').length})</span>
          </label>
        </div>
      </div>

      {/* List of Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Tìm thấy {filteredQuestions.length} câu hỏi phù hợp</span>
          {currentExam && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              Đề đích: {currentExam.code} ({currentExam.questions.length} câu hiện tại)
            </span>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
            Không tìm thấy câu hỏi nào thỏa mãn bộ lọc.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Mã: {q.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      q.cognitive_level === 'KNOW'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : q.cognitive_level === 'UNDERSTAND'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}
                  >
                    {q.cognitive_level === 'KNOW'
                      ? 'BIẾT'
                      : q.cognitive_level === 'UNDERSTAND'
                      ? 'HIỂU'
                      : 'VẬN DỤNG'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {q.section === 'MULTIPLE_CHOICE'
                      ? 'Phần I (Trắc nghiệm)'
                      : q.section === 'TRUE_FALSE'
                      ? 'Phần II (Đúng/Sai)'
                      : q.section === 'SHORT_ANSWER'
                      ? 'Phần III (Trả lời ngắn)'
                      : 'Phần IV (Tự luận)'}
                  </span>
                  <span className="text-[11px] text-slate-400">· {q.topic}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {currentExam && userRole === 'TEACHER' && (
                    <button
                      onClick={() => handleAddToExam(q)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Đưa vào đề</span>
                    </button>
                  )}
                  {userRole === 'TEACHER' && (
                    <>
                      <button
                        onClick={() => handleDuplicate(q)}
                        title="Nhân bản"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(q);
                          setIsModalOpen(true);
                        }}
                        title="Chỉnh sửa"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        title="Xóa"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {q.content}
              </div>

              {/* Options for MCQ */}
              {q.section === 'MULTIPLE_CHOICE' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                  {q.options.map((opt, i) => {
                    const optLetter = String.fromCharCode(65 + i);
                    const isCorrect = q.correctAnswer === optLetter;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white dark:bg-slate-900 border font-bold">
                          {optLetter}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True/False items */}
              {q.section === 'TRUE_FALSE' && q.trueFalseItems && (
                <div className="space-y-1 pt-1 text-xs">
                  {q.trueFalseItems.map((tf) => (
                    <div
                      key={tf.label}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <span>
                        <strong>{tf.label})</strong> {tf.statement}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          tf.isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {tf.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Key & Explanation */}
              {q.explanation && (
                <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Hướng dẫn giải / Yêu cầu cần đạt:
                  </span>{' '}
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem.id.startsWith('QB_') ? 'Thêm / Sửa câu hỏi Ngân hàng' : 'Sửa câu hỏi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Nội dung câu hỏi:</label>
                <textarea
                  rows={3}
                  value={editingItem.content}
                  onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Mức độ nhận thức (Bắt buộc):</label>
                  <select
                    value={editingItem.cognitive_level}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        cognitive_level: e.target.value as CognitiveLevel,
                      })
                    }
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="KNOW">BIẾT</option>
                    <option value="UNDERSTAND">HIỂU</option>
                    <option value="APPLY">VẬN DỤNG</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Dạng câu hỏi:</label>
                  <select
                    value={editingItem.section}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        section: e.target.value as ExamSectionType,
                      })
                    }
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="MULTIPLE_CHOICE">Phần I - Trắc nghiệm</option>
                    <option value="TRUE_FALSE">Phần II - Đúng / Sai</option>
                    <option value="SHORT_ANSWER">Phần III - Trả lời ngắn</option>
                    <option value="ESSAY">Phần IV - Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Điểm số:</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingItem.points}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, points: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Chủ đề:</label>
                  <input
                    type="text"
                    value={editingItem.topic}
                    onChange={(e) => setEditingItem({ ...editingItem, topic: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Chương:</label>
                  <input
                    type="text"
                    value={editingItem.chapter}
                    onChange={(e) => setEditingItem({ ...editingItem, chapter: e.target.value })}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Multiple choice options */}
              {editingItem.section === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  <label className="font-bold block">4 Phương án lựa chọn:</label>
                  {['A', 'B', 'C', 'D'].map((optKey, idx) => (
                    <div key={optKey} className="flex items-center gap-2">
                      <span className="font-bold w-4 text-center">{optKey}:</span>
                      <input
                        type="text"
                        value={editingItem.options?.[idx] || ''}
                        onChange={(e) => {
                          const newOpts = [...(editingItem.options || ['', '', '', ''])];
                          newOpts[idx] = e.target.value;
                          setEditingItem({ ...editingItem, options: newOpts });
                        }}
                        className="flex-1 p-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
                      />
                      <label className="flex items-center gap-1 font-semibold text-[11px]">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={editingItem.correctAnswer === optKey}
                          onChange={() => setEditingItem({ ...editingItem, correctAnswer: optKey })}
                        />
                        <span>Đúng</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Hướng dẫn giải / Lời giải chi tiết:</label>
                <textarea
                  rows={2}
                  value={editingItem.explanation}
                  onChange={(e) => setEditingItem({ ...editingItem, explanation: e.target.value })}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Lưu vào Ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Auto Pick Modal */}
      {showAutoPickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI tự động chọn câu từ ngân hàng
                </h3>
              </div>
              <button onClick={() => setShowAutoPickModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Số lượng câu cần chọn:</label>
                <input
                  type="number"
                  min="1"
                  max={bank.length}
                  value={autoPickCount}
                  onChange={(e) => setAutoPickCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1 text-blue-700">Tỷ lệ BIẾT (%):</label>
                  <input
                    type="number"
                    value={autoPickRatioKnow}
                    onChange={(e) => setAutoPickRatioKnow(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-emerald-700">Tỷ lệ HIỂU (%):</label>
                  <input
                    type="number"
                    value={autoPickRatioUnderstand}
                    onChange={(e) => setAutoPickRatioUnderstand(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-purple-700">Tỷ lệ VẬN DỤNG (%):</label>
                  <input
                    type="number"
                    value={autoPickRatioApply}
                    onChange={(e) => setAutoPickRatioApply(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-xl bg-slate-50 dark:bg-slate-800 text-center font-bold"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border">
                Tổng tỷ lệ: <strong>{autoPickRatioKnow + autoPickRatioUnderstand + autoPickRatioApply}%</strong> (Bắt buộc = 100%).
                AI sẽ trích xuất số câu tương ứng từ ngân hàng và hạn chế trùng lặp nội dung.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAutoPickModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteAutoPick}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"
              >
                Nạp vào đề ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
