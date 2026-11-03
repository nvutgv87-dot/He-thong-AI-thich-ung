import React, { useState } from 'react';
import { ExamPaper, ExamSpecificationItem } from '../../types/examTypes';
import { CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  FileText,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Info,
  Edit2,
  ExternalLink,
} from 'lucide-react';

interface SpecificationTabProps {
  currentExam: ExamPaper;
  allExams: ExamPaper[];
  onSelectExam: (exam: ExamPaper) => void;
  onUpdateExam: (updated: ExamPaper) => void;
  onJumpToQuestion?: (qNumber: number) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const SpecificationTab: React.FC<SpecificationTabProps> = ({
  currentExam,
  allExams,
  onSelectExam,
  onUpdateExam,
  onJumpToQuestion,
  userRole,
}) => {
  const [specs, setSpecs] = useState<ExamSpecificationItem[]>(
    currentExam.specifications || []
  );
  const [isEditing, setIsEditing] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  React.useEffect(() => {
    setSpecs(currentExam.specifications || []);
  }, [currentExam.id, currentExam.updatedAt, currentExam.specifications]);

  const filteredSpecs = specs.filter((s) => {
    if (filterLevel === 'ALL') return true;
    return s.cognitive_level === filterLevel;
  });

  const handleSpecChange = (
    index: number,
    field: keyof ExamSpecificationItem,
    val: any
  ) => {
    const updated = [...specs];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setSpecs(updated);
  };

  const handleSaveSpecs = () => {
    if (userRole !== 'TEACHER') return;
    // Sync specs back to exam questions
    const syncedQuestions = currentExam.questions.map((q) => {
      const spec = specs.find((s) => s.questionNumber === q.questionNumber);
      if (spec) {
        return {
          ...q,
          curriculumRequirement: spec.competencyRequirement || q.curriculumRequirement,
          cognitive_level: spec.cognitive_level || q.cognitive_level,
          points: spec.points || q.points,
        };
      }
      return q;
    });

    const updatedExam: ExamPaper = {
      ...currentExam,
      specifications: specs,
      questions: syncedQuestions,
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updatedExam);
    onUpdateExam(updatedExam);
    setIsEditing(false);
    toastService.success('Đã lưu thay đổi thành công! Bản đặc tả và các Yêu cầu cần đạt đã được lưu lại.');
  };

  const handleSyncFromQuestions = () => {
    const rebuiltSpecs: ExamSpecificationItem[] = currentExam.questions.map((q) => ({
      id: `spec_${q.questionNumber}`,
      chapter: q.chapter || currentExam.chapter,
      topic: q.topic || currentExam.topic,
      competencyRequirement:
        q.curriculumRequirement ||
        `Đánh giá năng lực môn ${currentExam.subject} câu ${q.questionNumber} mức độ ${q.cognitive_level}`,
      cognitive_level: q.cognitive_level,
      section: q.section,
      questionNumber: q.questionNumber,
      points: q.points,
      questionPreview: q.content.slice(0, 60),
    }));

    setSpecs(rebuiltSpecs);
    const updatedExam: ExamPaper = {
      ...currentExam,
      specifications: rebuiltSpecs,
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updatedExam);
    onUpdateExam(updatedExam);
    toastService.success('Đã tái thiết lập Bản đặc tả chuẩn xác từ toàn bộ câu hỏi trong đề!');
  };

  const handleReset = () => {
    setSpecs(currentExam.specifications || []);
    setIsEditing(false);
    toastService.info('Đã hủy bỏ các thay đổi trên bản đặc tả.');
  };

  // Check linking between Matrix, Specs, Questions
  const specsCount = specs.length;
  const questionsCount = currentExam.questions.length;
  const isCountSynced = specsCount === questionsCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                3. Bản đặc tả đề kiểm tra
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                  SGK Kết nối tri thức
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Chuỗi liên kết: Ma trận → Bản đặc tả → Câu hỏi → Đề kiểm tra
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Đang xem đề:
          </label>
          <select
            value={currentExam.id}
            onChange={(e) => {
              const selected = allExams.find((x) => x.id === e.target.value);
              if (selected) onSelectExam(selected);
            }}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title.slice(0, 45)}...
              </option>
            ))}
          </select>

          {userRole === 'TEACHER' && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleSaveSpecs}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSyncFromQuestions}
                    title="Tự động đồng bộ hóa bản đặc tả chuẩn theo toàn bộ câu hỏi trong đề"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đồng bộ từ đề</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa đặc tả</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Tính toàn vẹn liên kết:
          </span>
          {isCountSynced ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle className="w-3 h-3" />
              Khớp 100% ({specsCount} mục đặc tả = {questionsCount} câu hỏi)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <AlertTriangle className="w-3 h-3" />
              Lệch số lượng ({specsCount} mục đặc tả ≠ {questionsCount} câu hỏi)
            </span>
          )}
        </div>

        {/* Filter by cognitive level */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Lọc mức độ:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                filterLevel === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả ({specs.length})
            </button>
            <button
              onClick={() => setFilterLevel('KNOW')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                filterLevel === 'KNOW'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
              }`}
            >
              BIẾT ({specs.filter((s) => s.cognitive_level === 'KNOW').length})
            </button>
            <button
              onClick={() => setFilterLevel('UNDERSTAND')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                filterLevel === 'UNDERSTAND'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              HIỂU ({specs.filter((s) => s.cognitive_level === 'UNDERSTAND').length})
            </button>
            <button
              onClick={() => setFilterLevel('APPLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                filterLevel === 'APPLY'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
              }`}
            >
              VẬN DỤNG ({specs.filter((s) => s.cognitive_level === 'APPLY').length})
            </button>
          </div>
        </div>
      </div>

      {/* Specification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <th className="py-3 px-3 w-14 text-center">Câu</th>
                <th className="py-3 px-3 w-40">Chủ đề & Bài</th>
                <th className="py-3 px-3 min-w-[280px]">Yêu cầu cần đạt chuẩn SGK Kết nối tri thức</th>
                <th className="py-3 px-3 w-28 text-center">Mức nhận thức</th>
                <th className="py-3 px-3 w-24 text-center">Dạng câu</th>
                <th className="py-3 px-3 w-16 text-center">Điểm</th>
                <th className="py-3 px-3 min-w-[200px]">Trích đoạn câu hỏi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSpecs.map((spec, idx) => {
                const correspondingQ = currentExam.questions.find(
                  (q) => q.questionNumber === spec.questionNumber
                );

                return (
                  <tr
                    key={spec.id || idx}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                      {spec.questionNumber}
                    </td>

                    <td className="py-3 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={spec.topic}
                          onChange={(e) => handleSpecChange(idx, 'topic', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {spec.topic}
                          </div>
                          <div className="text-[11px] text-slate-400">{spec.chapter}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={spec.competencyRequirement}
                          onChange={(e) =>
                            handleSpecChange(idx, 'competencyRequirement', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {spec.competencyRequirement}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <select
                          value={spec.cognitive_level}
                          onChange={(e) =>
                            handleSpecChange(idx, 'cognitive_level', e.target.value as CognitiveLevel)
                          }
                          className="px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900 font-bold"
                        >
                          <option value="KNOW">BIẾT</option>
                          <option value="UNDERSTAND">HIỂU</option>
                          <option value="APPLY">VẬN DỤNG</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            spec.cognitive_level === 'KNOW'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : spec.cognitive_level === 'UNDERSTAND'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          }`}
                        >
                          {spec.cognitive_level === 'KNOW'
                            ? 'BIẾT'
                            : spec.cognitive_level === 'UNDERSTAND'
                            ? 'HIỂU'
                            : 'VẬN DỤNG'}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                      {spec.section === 'MULTIPLE_CHOICE'
                        ? 'Phần I (TN)'
                        : spec.section === 'TRUE_FALSE'
                        ? 'Phần II (Đ/S)'
                        : spec.section === 'SHORT_ANSWER'
                        ? 'Phần III (Ngắn)'
                        : 'Phần IV (Tự luận)'}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {formatScore(spec.points)}đ
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      <div className="line-clamp-2 italic">
                        "{correspondingQ ? correspondingQ.content : spec.questionPreview || '...'}"
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Save Bar when editing */}
      {userRole === 'TEACHER' && isEditing && (
        <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-emerald-500/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Đang chỉnh sửa Bản đặc tả: {currentExam.title}
            </span>
            <span className="text-slate-500">({specs.length} mục yêu cầu cần đạt)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveSpecs}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
