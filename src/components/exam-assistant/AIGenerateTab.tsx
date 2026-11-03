import React, { useState } from 'react';
import { ExamPaper, ExamSectionType } from '../../types/examTypes';
import { CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { QUICK_STRUCTURE_PRESETS, formatScore, calculateStructurePoints } from '../../utils/scoreUtils';
import { SUBJECT_CURRICULA, SubjectCurriculumTopic } from '../../data/subjectCurriculumBank';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  RotateCcw,
  Zap,
  Info,
  GraduationCap,
  Sparkle,
  Upload,
  FileUp,
  FileText,
  Image as ImageIcon,
  FileCode,
  Check,
  X,
  Eye,
  Trash2,
  Paperclip,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { parseCurriculumFile, CurriculumParseResult } from '../../utils/curriculumFileParser';

interface AIGenerateTabProps {
  onExamGenerated: (newExam: ExamPaper) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

const SUPPORTED_SUBJECTS = [
  'Hóa học',
  'Vật lí',
  'Sinh học',
  'Toán học',
  'Tin học',
  'Ngữ văn',
  'Tiếng Anh',
  'Khoa học tự nhiên',
  'Lịch sử',
  'Địa lí',
];

export const AIGenerateTab: React.FC<AIGenerateTabProps> = ({
  onExamGenerated,
  userRole,
}) => {
  // Required fields according to Section XLV:
  const [subject, setSubject] = useState('Hóa học');
  const [grade, setGrade] = useState(11);
  const [examTitle, setExamTitle] = useState(
    'Đề kiểm tra định kỳ Hóa học 11 - Chương 5 (Kết nối tri thức)'
  );
  const [chapter, setChapter] = useState('Chương 5: Dẫn xuất Halogen - Alcohol - Phenol');
  const [topic, setTopic] = useState('Dẫn xuất Halogen, Alcohol và Phenol trong thực tiễn');
  const [knowledgeContent, setKnowledgeContent] = useState(
    'Công thức cấu tạo, danh pháp IUPAC, tính chất vật lý, liên kết hydrogen, phản ứng hóa học đặc trưng và ứng dụng của alcohol, phenol.'
  );
  const [learningObjectives, setLearningObjectives] = useState(
    'Đánh giá năng lực hóa học: nhận thức hóa học (BIẾT), tìm hiểu thế giới tự nhiên dưới góc độ hóa học (HIỂU) và vận dụng kiến thức, kỹ năng đã học (VẬN DỤNG) theo SGK Kết nối tri thức.'
  );
  const [teacherCustomPrompt, setTeacherCustomPrompt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const totalPoints = 10.0; // Bắt buộc thang 10,0 điểm

  // MANDATORY: EXACT 3 COGNITIVE LEVELS ONLY (BIẾT, HIỂU, VẬN DỤNG)
  // Configurable percentages, must sum to 100%
  const [ratioKnow, setRatioKnow] = useState(40);
  const [ratioUnderstand, setRatioUnderstand] = useState(40);
  const [ratioApply, setRatioApply] = useState(20);

  // 4-Part Structure configuration (Max limits according to XLVII)
  // Part I: max 40; Part II: max 20; Part III: max 20; Part IV: max 10
  const [part1Count, setPart1Count] = useState(12);
  const [part2Count, setPart2Count] = useState(2);
  const [part3Count, setPart3Count] = useState(6);
  const [part4Count, setPart4Count] = useState(1);

  // Selected quick preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset_standard');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Available topics for selected subject
  const currentSubjectCurriculum = SUBJECT_CURRICULA[subject];
  const subjectTopics = currentSubjectCurriculum?.topics || [];

  // Calculation of points per question
  const currentStructureConfig = { part1Count, part2Count, part3Count, part4Count };
  const pointBreakdown = calculateStructurePoints(currentStructureConfig);
  const totalQuestions = part1Count + part2Count + part3Count + part4Count;

  // Validation
  const sumRatio = ratioKnow + ratioUnderstand + ratioApply;
  const isRatioValid = sumRatio === 100;

  // Document Upload State for YCCD (Image, Word, PDF)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [uploadedFileResult, setUploadedFileResult] = useState<CurriculumParseResult | null>(null);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [syncDetectedMeta, setSyncDetectedMeta] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleCurriculumFileUpload = async (file: File) => {
    if (!file) return;
    setIsExtractingFile(true);
    try {
      toastService.info(`Đang tải lên và trích xuất nội dung từ tệp "${file.name}"...`);
      const result = await parseCurriculumFile(file, subject, grade);
      if (!result.success) {
        toastService.error(result.error || 'Không thể trích xuất nội dung từ tệp.');
        return;
      }
      setUploadedFileResult(result);
      setShowFilePreviewModal(true);
      toastService.success(`Đã trích xuất thành công YCCĐ từ tệp "${file.name}"!`);
    } catch (err: any) {
      toastService.error(`Lỗi khi xử lý tệp: ${err?.message || 'Không xác định'}`);
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyExtractedObjectives = (mode: 'REPLACE' | 'APPEND') => {
    if (!uploadedFileResult) return;

    if (mode === 'REPLACE') {
      setLearningObjectives(uploadedFileResult.learningObjectives);
    } else {
      setLearningObjectives((prev) =>
        prev ? `${prev}\n\n${uploadedFileResult.learningObjectives}` : uploadedFileResult.learningObjectives
      );
    }

    if (syncDetectedMeta && uploadedFileResult.detectedMeta) {
      const meta = uploadedFileResult.detectedMeta;
      if (meta.subject && SUPPORTED_SUBJECTS.includes(meta.subject)) {
        setSubject(meta.subject);
      }
      if (meta.grade) {
        setGrade(meta.grade);
      }
      if (meta.chapter) {
        setChapter(meta.chapter);
      }
      if (meta.topic) {
        setTopic(meta.topic);
      }
      if (meta.knowledgeContent) {
        setKnowledgeContent(meta.knowledgeContent);
      }
      if (meta.examTitle) {
        setExamTitle(meta.examTitle);
      }
    }

    setShowFilePreviewModal(false);
    toastService.success('Đã nạp Yêu cầu cần đạt chuẩn SGK thành công vào biểu mẫu!');
  };

  const handleClearUploadedFile = () => {
    setUploadedFileResult(null);
    setShowFilePreviewModal(false);
    toastService.info('Đã hủy tệp tài liệu đính kèm.');
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    const curr = SUBJECT_CURRICULA[newSubject];
    if (curr && curr.topics.length > 0) {
      const firstTopic = curr.topics[0];
      setChapter(firstTopic.chapter);
      setTopic(firstTopic.topic);
      setKnowledgeContent(firstTopic.knowledgeContent);
      setLearningObjectives(firstTopic.learningObjectives);
      setExamTitle(firstTopic.defaultTitle);
      toastService.info(`Đã nạp chuẩn chương trình ${newSubject} 11 - SGK Kết nối tri thức.`);
    } else {
      setExamTitle(`Đề kiểm tra định kỳ ${newSubject} ${grade} (Kết nối tri thức)`);
      setChapter(`Chương trình môn ${newSubject}`);
      setTopic(`Nội dung kiến thức trọng tâm môn ${newSubject}`);
      setKnowledgeContent(`Các khái niệm, nguyên lý và kỹ năng bộ môn ${newSubject}.`);
      setLearningObjectives(`Đạt chuẩn yêu cầu cần đạt môn ${newSubject} theo 3 mức độ: BIẾT, HIỂU, VẬN DỤNG.`);
    }
  };

  const handleSelectCurriculumTopic = (topicObj: SubjectCurriculumTopic) => {
    setChapter(topicObj.chapter);
    setTopic(topicObj.topic);
    setKnowledgeContent(topicObj.knowledgeContent);
    setLearningObjectives(topicObj.learningObjectives);
    setExamTitle(topicObj.defaultTitle);
    toastService.info(`Đã nạp chủ đề: "${topicObj.topic}" (${subject} 11).`);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = QUICK_STRUCTURE_PRESETS.find((p: { id: string }) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setPart1Count(preset.config.part1Count);
    setPart2Count(preset.config.part2Count);
    setPart3Count(preset.config.part3Count);
    setPart4Count(preset.config.part4Count);
    toastService.info(`Đã áp dụng mẫu cấu trúc: "${preset.name}".`);
  };

  const handleGenerateExam = async () => {
    if (!isRatioValid) {
      toastService.error(
        `Tổng tỷ lệ BIẾT + HIỂU + VẬN DỤNG (${sumRatio}%) chưa bằng 100%. Vui lòng điều chỉnh lại trước khi tạo đề!`
      );
      return;
    }

    if (!examTitle.trim()) {
      toastService.error('Vui lòng nhập Tên đề kiểm tra!');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStatus('PROCESSING');
    setGenerationStep(`AI đang phân tích yêu cầu cần đạt môn ${subject} (${curriculumName})...`);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setGenerationStep(`AI đang tự động thiết lập Bảng Ma trận đề theo 3 mức độ (BIẾT ${ratioKnow}%, HIỂU ${ratioUnderstand}%, VẬN DỤNG ${ratioApply}%)...`);

      await new Promise((r) => setTimeout(r, 600));
      setGenerationStep(`AI đang lập Bản đặc tả câu hỏi và đối chiếu chuẩn đầu ra môn ${subject}...`);

      await new Promise((r) => setTimeout(r, 600));
      setGenerationStep(`AI đang sinh bộ câu hỏi 4 phần theo thang điểm 10,0đ và kiểm tra tính nhất quán...`);

      const result = await examService.generateExamWithAI({
        subject,
        grade,
        curriculum: 'Kết nối tri thức',
        chapter,
        topic,
        knowledgeContent,
        learningObjectives,
        teacherCustomPrompt,
        durationMinutes,
        ratio: { know: ratioKnow, understand: ratioUnderstand, apply: ratioApply },
        structure: currentStructureConfig,
      });

      result.exam.title = examTitle;
      const syncedExam = examService.syncExamIntegrity(result.exam);
      examService.saveExam(syncedExam);

      setIsGenerating(false);
      setGenerationStatus('SUCCESS');

      if (result.isAIGenerated) {
        toastService.success(`AI đã tạo thành công đề "${syncedExam.title}" bám sát 100% môn ${subject}!`);
      } else {
        toastService.info(
          `Đã tạo đề "${syncedExam.title}" từ Ngân hàng chuẩn môn ${subject} SGK Kết nối tri thức.`
        );
      }

      onExamGenerated(syncedExam);
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStatus('ERROR');
      setGenerationError(err?.message || 'Có lỗi xảy ra khi AI sinh đề');
      toastService.error('Không thể tạo đề: ' + (err?.message || 'Lỗi không xác định'));
    }
  };

  const curriculumName = 'SGK Kết nối tri thức';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              1. AI tạo đề kiểm tra thông minh
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                Chuẩn Bộ GD&ĐT
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Nhập cấu hình mục tiêu, AI tự lập Ma trận → Bản đặc tả → Sinh câu hỏi 4 phần → Đề hoàn chỉnh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
            Tổng điểm: 10,0đ
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            {totalQuestions} câu hỏi
          </span>
        </div>
      </div>

      {/* Main Grid: Parameters Form & Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Exam metadata (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Thông tin chung & Mục tiêu khảo thí</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tên đề kiểm tra:
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: Đề kiểm tra định kỳ Hóa học 11 - Chương 5..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Môn học:
                </label>
                <select
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-purple-700 dark:text-purple-300"
                >
                  {SUPPORTED_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Khối lớp:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value) || 11)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value={10}>Lớp 10</option>
                  <option value={11}>Lớp 11</option>
                  <option value={12}>Lớp 12</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Thời gian làm bài:
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value={15}>15 phút (Đánh giá thường xuyên)</option>
                  <option value={45}>45 phút (Định kỳ 1 tiết)</option>
                  <option value={60}>60 phút</option>
                  <option value={90}>90 phút (Học kỳ / Khảo sát)</option>
                </select>
              </div>
            </div>

            {/* Quick Topic Presets for Selected Subject */}
            {subjectTopics.length > 0 && (
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Nạp nhanh chương trình chuẩn SGK Kết nối tri thức ({subject} {grade}):</span>
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                    Bấm để tự động điền nội dung & yêu cầu cần đạt
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subjectTopics.map((topItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCurriculumTopic(topItem)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-medium text-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs text-left"
                    >
                      <span className="font-bold text-purple-600 mr-1">
                        {topItem.chapter.split(':')[0]}:
                      </span>
                      <span>{topItem.topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chương / Bài học:
                </label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chủ đề trọng tâm:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nội dung kiến thức cần kiểm tra:
              </label>
              <textarea
                rows={2}
                value={knowledgeContent}
                onChange={(e) => setKnowledgeContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed"
              />
            </div>

            {/* Hidden File Input for Image, Word, PDF */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCurriculumFileUpload(file);
              }}
            />

            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isDraggingOver
                  ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleCurriculumFileUpload(file);
              }}
            >
              {/* Header with Title and Upload Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Yêu cầu cần đạt chuẩn SGK Kết nối tri thức (YCCD):
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      Gắn 1:1 vào từng câu hỏi & Bản đặc tả
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hỗ trợ nhập tay hoặc tải lên trực tiếp từ ảnh chụp SGK, đề cương Word hoặc tệp PDF
                  </p>
                </div>

                {/* Primary Upload Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtractingFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isExtractingFile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang đọc tệp...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải lên (Ảnh, Word, PDF)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Supported Formats Info Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-900/60 mb-2.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-2 text-slate-500">
                  <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Paperclip className="w-3 h-3 text-purple-600" />
                    Định dạng tải lên:
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium text-[10px]">
                    <ImageIcon className="w-3 h-3" /> Ảnh (PNG, JPG, WEBP)
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium text-[10px]">
                    <FileText className="w-3 h-3" /> Word (.doc, .docx)
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-medium text-[10px]">
                    <FileText className="w-3 h-3" /> PDF (.pdf)
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 italic font-medium">
                  Kéo thả tệp vào đây
                </span>
              </div>

              {/* Uploaded File Banner if available */}
              {uploadedFileResult && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {uploadedFileResult.fileType === 'IMAGE' ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{uploadedFileResult.fileName}</span>
                        <span className="text-[10px] font-normal text-slate-400 shrink-0">
                          ({uploadedFileResult.fileSizeFormatted})
                        </span>
                        {uploadedFileResult.isAIExtracted ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 shrink-0">
                            AI Trích xuất
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 shrink-0">
                            Trích xuất văn bản
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                        {uploadedFileResult.detectedMeta?.topic || uploadedFileResult.detectedMeta?.chapter
                          ? `Đã nhận diện: ${uploadedFileResult.detectedMeta.chapter || ''} ${uploadedFileResult.detectedMeta.topic ? '• ' + uploadedFileResult.detectedMeta.topic : ''}`
                          : 'Đã sẵn sàng nạp vào Yêu cầu cần đạt (YCCD)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => setShowFilePreviewModal(true)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem & Nạp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearUploadedFile}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hủy tệp này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Textarea for YCCD */}
              <textarea
                rows={3}
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="Nhập hoặc tải lên tài liệu (ảnh/word/pdf) để AI tự động trích xuất Yêu cầu cần đạt chuẩn SGK..."
                className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal"
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                <span className="text-slate-400 font-medium">Gợi ý nhanh YCCD:</span>
                {[
                  'Nhận biết định nghĩa & công thức',
                  'Giải thích hiện tượng & phân biệt bản chất',
                  'Vận dụng giải bài toán định lượng',
                  'Vận dụng giải quyết tình huống thực tế',
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => {
                      if (!learningObjectives.includes(chip)) {
                        setLearningObjectives((prev) => (prev ? `${prev}; ${chip}` : chip));
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-700 cursor-pointer border border-slate-200/80 dark:border-slate-700 transition-colors shadow-2xs"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                <span>Yêu cầu riêng của giáo viên (Tùy chọn):</span>
                <span className="text-[10px] text-slate-400 font-normal">AI sẽ tối ưu hóa câu hỏi theo hướng này</span>
              </label>
              <input
                type="text"
                value={teacherCustomPrompt}
                onChange={(e) => setTeacherCustomPrompt(e.target.value)}
                placeholder="VD: Ưu tiên tình huống thực tế, câu hỏi phân tích đồ thị, liên hệ cuộc sống..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Cognitive Ratio Configuration (BẮT BUỘC: 3 MỨC ĐỘ) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Cấu hình 3 Mức độ nhận thức (Bắt buộc)</span>
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isRatioValid
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                Tổng: {sumRatio}% {isRatioValid ? '(Hợp lệ)' : '(Chưa = 100%)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Toàn hệ thống tuân thủ nghiêm ngặt 3 mức độ: <strong>BIẾT</strong>, <strong>HIỂU</strong>, <strong>VẬN DỤNG</strong>. Giáo viên có thể điều chỉnh tỷ lệ phần trăm theo yêu cầu khảo thí.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* BIẾT */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    1. BIẾT
                  </span>
                  <span className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
                    {ratioKnow}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={ratioKnow}
                  onChange={(e) => setRatioKnow(parseInt(e.target.value) || 0)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-normal">
                  Nhớ, nhận diện định nghĩa, công thức, gọi tên, tái hiện kiến thức trực tiếp.
                </p>
              </div>

              {/* HIỂU */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    2. HIỂU
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                    {ratioUnderstand}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={ratioUnderstand}
                  onChange={(e) => setRatioUnderstand(parseInt(e.target.value) || 0)}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-normal">
                  Giải thích, so sánh, phân loại, giải thích hiện tượng ở tình huống quen thuộc.
                </p>
              </div>

              {/* VẬN DỤNG */}
              <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                    3. VẬN DỤNG
                  </span>
                  <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                    {ratioApply}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={ratioApply}
                  onChange={(e) => setRatioApply(parseInt(e.target.value) || 0)}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 leading-normal">
                  Áp dụng giải quyết vấn đề, tính toán định lượng, xử lý tình huống thực tiễn.
                </p>
              </div>
            </div>

            {/* Quick Ratio Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400">Tỷ lệ mẫu phổ biến:</span>
              <button
                type="button"
                onClick={() => {
                  setRatioKnow(40);
                  setRatioUnderstand(40);
                  setRatioApply(20);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 cursor-pointer"
              >
                40% - 40% - 20% (Chuẩn định kỳ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRatioKnow(30);
                  setRatioUnderstand(40);
                  setRatioApply(30);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 cursor-pointer"
              >
                30% - 40% - 30% (Nâng cao)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRatioKnow(50);
                  setRatioUnderstand(30);
                  setRatioApply(20);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold hover:bg-slate-200 cursor-pointer"
              >
                50% - 30% - 20% (Cơ bản)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 4-Part Structure & Generate Button */}
        <div className="space-y-5">
          {/* 4-Part Structure Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Cấu trúc 4 Phần & Thang 10,0đ</span>
            </h3>

            {/* Quick Presets selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chọn mẫu cấu trúc nhanh:
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                {QUICK_STRUCTURE_PRESETS.map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Form inputs for 4 parts with real-time formula */}
            <div className="space-y-3 text-xs">
              {/* Part 1 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">PHẦN I. Trắc nghiệm (5,0đ)</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatScore(pointBreakdown.part1PerItem)}đ / câu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số câu:</span>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={part1Count}
                    onChange={(e) => setPart1Count(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-center font-bold border rounded-lg bg-white dark:bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">câu (tối đa 40 câu)</span>
                </div>
              </div>

              {/* Part 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">PHẦN II. Đúng/Sai (2,0đ)</span>
                  <span className="text-purple-600 dark:text-purple-400">Tối đa 1,0đ / câu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số câu:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={part2Count}
                    onChange={(e) => setPart2Count(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-center font-bold border rounded-lg bg-white dark:bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">câu (mỗi câu 4 ý a-b-c-d)</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Thang chuẩn: 1 ý = 0,10đ · 2 ý = 0,25đ · 3 ý = 0,50đ · 4 ý = 1,00đ
                </p>
              </div>

              {/* Part 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">PHẦN III. Trả lời ngắn (1,5đ)</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatScore(pointBreakdown.part3PerItem)}đ / câu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số câu:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={part3Count}
                    onChange={(e) => setPart3Count(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-center font-bold border rounded-lg bg-white dark:bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">câu (tối đa 20 câu)</span>
                </div>
              </div>

              {/* Part 4 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">PHẦN IV. Tự luận Rubric (1,5đ)</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatScore(pointBreakdown.part4PerItem)}đ / câu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Số câu:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={part4Count}
                    onChange={(e) => setPart4Count(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-center font-bold border rounded-lg bg-white dark:bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-400">câu (tối đa 10 câu)</span>
                </div>
              </div>
            </div>

            {/* Total Points summary box */}
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900 dark:text-purple-300">
                Tổng điểm đề thi:
              </span>
              <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
                10,0 điểm (Khép kín)
              </span>
            </div>
          </div>

          {/* AI Generation Trigger & Status */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            {/* Status indicator banner */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">Trạng thái AI:</span>
              {isGenerating ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Đang xử lý...
                </span>
              ) : generationStatus === 'SUCCESS' ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Thành công
                </span>
              ) : generationStatus === 'ERROR' ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  Thất bại
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Sẵn sàng
                </span>
              )}
            </div>

            {generationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <div className="font-bold">Tạo đề thất bại:</div>
                    <div className="text-[11px] leading-relaxed">{generationError}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateExam}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Thử lại</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const fallbackExam = examService.generateExamOffline({
                          subject,
                          grade,
                          chapter,
                          topic,
                          durationMinutes,
                          ratio: { know: ratioKnow, understand: ratioUnderstand, apply: ratioApply },
                          structure: currentStructureConfig,
                        });
                        fallbackExam.title = examTitle;
                        examService.saveExam(fallbackExam);
                        setGenerationError(null);
                        setGenerationStatus('SUCCESS');
                        toastService.info('Đã tạo thành công đề từ Ngân hàng câu hỏi dự phòng nội bộ.');
                        onExamGenerated(fallbackExam);
                      } catch (e: any) {
                        toastService.error(e.message || 'Lỗi tạo đề');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-semibold text-xs cursor-pointer text-slate-800 dark:text-slate-200"
                  >
                    Dùng ngân hàng nội bộ
                  </button>
                </div>
              </div>
            )}

            {isGenerating ? (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 font-bold animate-pulse text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                  <span>ĐANG XỬ LÝ TẠO ĐỀ BẰNG AI...</span>
                </div>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 italic">
                  {generationStep}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateExam}
                disabled={!isRatioValid}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all ${
                  isRatioValid
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200 dark:shadow-none'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI TẠO ĐỀ KIỂM TRA THEO MÔN & MA TRẬN</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                <Zap className="w-3 h-3" />
                Chế độ dự phòng tự động
              </span>
              <span>Giáo viên toàn quyền duyệt & sửa</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview & Apply Modal for YCCD */}
      {showFilePreviewModal && uploadedFileResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-xs space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Trích xuất tài liệu chuẩn SGK Kết nối tri thức</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                      {uploadedFileResult.fileType}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {uploadedFileResult.fileName} ({uploadedFileResult.fileSizeFormatted})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilePreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Thumbnail if image */}
            {uploadedFileResult.previewImageUrl && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                <span className="text-[11px] font-semibold text-slate-500 mb-2">Ảnh tài liệu gốc tải lên:</span>
                <img
                  src={uploadedFileResult.previewImageUrl}
                  alt={uploadedFileResult.fileName}
                  className="max-h-56 max-w-full rounded-lg object-contain shadow-xs border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            {/* Detected Metadata preview if any */}
            {uploadedFileResult.detectedMeta && (
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
                <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Thông tin nhận diện tự động từ tài liệu:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {uploadedFileResult.detectedMeta.subject && (
                    <div>
                      <span className="text-slate-500">Môn học: </span>
                      <strong className="text-purple-700 dark:text-purple-300">
                        {uploadedFileResult.detectedMeta.subject}
                      </strong>
                    </div>
                  )}
                  {uploadedFileResult.detectedMeta.grade && (
                    <div>
                      <span className="text-slate-500">Khối lớp: </span>
                      <strong className="text-purple-700 dark:text-purple-300">
                        Lớp {uploadedFileResult.detectedMeta.grade}
                      </strong>
                    </div>
                  )}
                  {uploadedFileResult.detectedMeta.chapter && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Chương / Bài: </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {uploadedFileResult.detectedMeta.chapter}
                      </strong>
                    </div>
                  )}
                  {uploadedFileResult.detectedMeta.topic && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Chủ đề trọng tâm: </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {uploadedFileResult.detectedMeta.topic}
                      </strong>
                    </div>
                  )}
                  {uploadedFileResult.detectedMeta.examTitle && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Gợi ý tên đề thi: </span>
                      <strong className="text-purple-800 dark:text-purple-200">
                        {uploadedFileResult.detectedMeta.examTitle}
                      </strong>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/60 text-[11px] font-semibold text-purple-800 dark:text-purple-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncDetectedMeta}
                    onChange={(e) => setSyncDetectedMeta(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Đồng thời đồng bộ cả Chương, Chủ đề và Tiêu đề đề thi nếu có</span>
                </label>
              </div>
            )}

            {/* Extracted Objectives Content */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Nội dung Yêu cầu cần đạt (YCCD) trích xuất được:</span>
                <span className="text-[10px] text-slate-400 font-normal">Có thể tinh chỉnh trực tiếp trước khi nạp</span>
              </label>
              <textarea
                rows={6}
                value={uploadedFileResult.learningObjectives}
                onChange={(e) =>
                  setUploadedFileResult({
                    ...uploadedFileResult,
                    learningObjectives: e.target.value,
                  })
                }
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed font-mono"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowFilePreviewModal(false)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleApplyExtractedObjectives('APPEND')}
                className="px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-50 dark:hover:bg-purple-950/60 cursor-pointer"
              >
                + Thêm nối tiếp vào YCCĐ
              </button>
              <button
                type="button"
                onClick={() => handleApplyExtractedObjectives('REPLACE')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ghi đè vào YCCĐ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
