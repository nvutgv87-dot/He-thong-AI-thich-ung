import React, { useState } from 'react';
import { ExamPaper, QuestionBankItem, StudentExamResult } from '../../types/examTypes';
import { examExportService, ExportSelectionOptions, DEFAULT_EXPORT_OPTIONS } from '../../utils/examExportUtils';
import { toastService } from '../../services/toastService';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Square,
  X,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamPaper;
  studentResults?: StudentExamResult[];
  questionBank?: QuestionBankItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exam,
  studentResults = [],
  questionBank = [],
}) => {
  const [options, setOptions] = useState<ExportSelectionOptions>(DEFAULT_EXPORT_OPTIONS);
  const [exportFormat, setExportFormat] = useState<'WORD' | 'EXCEL' | 'PDF'>('WORD');

  if (!isOpen) return null;

  const toggleOption = (key: keyof ExportSelectionOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecuteExport = () => {
    try {
      if (exportFormat === 'WORD') {
        examExportService.exportToWord(exam, options, studentResults, questionBank);
        toastService.success(`Đã xuất thành công bộ hồ sơ "${exam.title}" định dạng Word (.doc)!`);
      } else if (exportFormat === 'EXCEL') {
        examExportService.exportToExcel(exam, options, studentResults);
        toastService.success(`Đã xuất bảng kết quả & ma trận đề "${exam.code}" định dạng Excel (.csv)!`);
      } else {
        examExportService.printOrExportPDF(exam, options);
        toastService.info('Đang mở cửa sổ In / Lưu PDF chất lượng cao...');
      }
      onClose();
    } catch (err: any) {
      toastService.error(`Lỗi khi xuất file: ${err?.message || 'Không xác định'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xuất bộ hồ sơ kiểm tra
              </h3>
              <p className="text-xs text-slate-500">Mã đề: {exam.code} · Thang điểm 10,0đ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Định dạng xuất file */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            1. Chọn định dạng xuất file bắt buộc:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setExportFormat('WORD')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                exportFormat === 'WORD'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-5 h-5 mb-1 text-blue-600" />
              <span>Word (.docx/.doc)</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('PDF')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                exportFormat === 'PDF'
                  ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-500 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Printer className="w-5 h-5 mb-1 text-rose-600" />
              <span>PDF / In ấn</span>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('EXCEL')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                exportFormat === 'EXCEL'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mb-1 text-emerald-600" />
              <span>Excel (.xlsx/.csv)</span>
            </button>
          </div>
        </div>

        {/* Nội dung hồ sơ đính kèm */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Các thành phần bao gồm trong hồ sơ:
            </label>
            <span className="text-[11px] text-slate-400">Chọn thành phần cần xuất</span>
          </div>

          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <label
              onClick={() => toggleOption('includeExam')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeExam ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Đề kiểm tra (Cấu trúc 4 phần chuẩn Bộ GD&ĐT)</span>
            </label>

            <label
              onClick={() => toggleOption('includeAnswers')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeAnswers ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Đáp án đúng từng câu</span>
            </label>

            <label
              onClick={() => toggleOption('includeGradingGuide')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeGradingGuide ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Hướng dẫn chấm chi tiết & Rubric tự luận SGK Kết nối tri thức</span>
            </label>

            <label
              onClick={() => toggleOption('includeMatrix')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeMatrix ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Ma trận đề kiểm tra (Phân bổ số câu, điểm, tỷ lệ %)</span>
            </label>

            <label
              onClick={() => toggleOption('includeSpecifications')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeSpecifications ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Bản đặc tả đề kiểm tra (Yêu cầu cần đạt chuẩn SGK)</span>
            </label>

            <label
              onClick={() => toggleOption('includeStudentResults')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeStudentResults ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Kết quả học sinh đã làm bài ({studentResults.length} bài)</span>
            </label>

            <label
              onClick={() => toggleOption('includeCognitiveAnalysis')}
              className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 py-1 hover:text-blue-600"
            >
              {options.includeCognitiveAnalysis ? (
                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span>Phân tích kết quả theo 3 mức: BIẾT – HIỂU – VẬN DỤNG</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleExecuteExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Tải bộ hồ sơ về máy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
