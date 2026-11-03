/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  TrendingDown,
  Clock,
  Database,
  FileQuestion,
  Lightbulb,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { RiskSignal, Student, WARNING_LEVEL_DEFINITIONS } from '../../types';
import { aiService } from '../../services/aiService';

interface WhyWarningModalProps {
  signal: RiskSignal;
  student: Student;
  privacyMode: boolean;
  onClose: () => void;
  onAcceptSignal?: () => void;
  onRejectSignal?: () => void;
}

export const WhyWarningModal: React.FC<WhyWarningModalProps> = ({
  signal,
  student,
  privacyMode,
  onClose,
  onAcceptSignal,
  onRejectSignal,
}) => {
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [explanation, setExplanation] = useState(signal.explanation);

  const levelMeta = WARNING_LEVEL_DEFINITIONS[signal.level];
  const displayName = privacyMode ? student.code : student.fullName;

  const handleDeepAIAnalysis = async () => {
    setIsDeepAnalyzing(true);
    try {
      const result = await aiService.explainSignal({
        studentCode: student.code,
        signalType: signal.type,
        baseline: student.baseline,
        currentMetrics: {
          onTimeRate: signal.evidence.primaryIndicators[0]?.currentValue,
          participationLevel: student.baseline.participationScore,
          overdueCount: 2,
        },
        observedWeeks: signal.evidence.observedWeeks,
        contextNotes: student.notes,
      });
      setExplanation(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeepAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Tại sao bạn nhận được cảnh báo này?
              </h2>
              <p className="text-xs text-slate-500">
                Minh bạch logic phát hiện tín hiệu cho học sinh: <span className="font-semibold text-slate-700 dark:text-slate-300">{displayName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & Confidence summary */}
        <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs text-slate-500 mb-1">Mức độ phân loại</div>
            <div className={`text-xs font-semibold ${levelMeta.colorClass}`}>
              {levelMeta.name}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs text-slate-500 mb-1">Tần suất xuất hiện</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {signal.frequency} ({signal.evidence.observedWeeks.length} tuần quan sát)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs text-slate-500 mb-1">Độ tin cậy của thuật toán</div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {signal.confidenceScore}% (Dựa trên baseline cá nhân)
            </div>
          </div>
        </div>

        {/* Section 1: Indicators & Evidence Table */}
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            1. Các chỉ báo định lượng đối chiếu với Baseline
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3">Chỉ báo theo dõi</th>
                  <th className="py-2 px-3">Baseline cá nhân</th>
                  <th className="py-2 px-3">Giá trị hiện tại</th>
                  <th className="py-2 px-3">Mức độ biến thiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {signal.evidence.primaryIndicators.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {item.indicatorName}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono">
                      {item.baselineValue}
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-white font-mono font-medium">
                      {item.currentValue}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {item.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Transparent AI Explanation (6 mandatory questions) */}
        <div className="space-y-3.5 mb-5 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
              Điều gì đang thay đổi & Từ thời điểm nào?
            </div>
            <p className="leading-relaxed">{explanation.whatIsChanging}</p>
            <div className="mt-1.5 text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{explanation.sinceWhen}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
              <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
              Dữ liệu còn thiếu & Các yếu tố bối cảnh cần kiểm tra thêm
            </div>
            <ul className="list-disc list-inside space-y-1 mt-1 text-slate-600 dark:text-slate-300">
              {explanation.potentialContextFactors.map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
            {explanation.missingData && explanation.missingData.length > 0 && (
              <div className="mt-2 text-amber-700 dark:text-amber-400 text-xs">
                <span className="font-medium">Dữ liệu cần bổ sung: </span>
                {explanation.missingData.join(' · ')}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Đề xuất hành vi giáo viên nên quan sát tiếp theo
            </div>
            <ul className="list-disc list-inside space-y-1 mt-1 text-slate-600 dark:text-slate-300">
              {explanation.recommendedObservations.map((obs, i) => (
                <li key={i}>{obs}</li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 bg-slate-100/50 dark:bg-slate-800/40 p-2.5 rounded-md">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Nguyên tắc đạo đức sư phạm: </strong>
              {explanation.transparencyRationale} Hệ thống không thay thế nhận định trực tiếp của thầy cô.
            </span>
          </div>
        </div>

        {/* Actions & Teacher Decision */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleDeepAIAnalysis}
            disabled={isDeepAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>{isDeepAnalyzing ? 'Đang phân tích...' : 'Yêu cầu AI cập nhật phân tích sâu'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onRejectSignal && (
              <button
                onClick={onRejectSignal}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Bỏ qua (Có lý do chính đáng)
              </button>
            )}
            {onAcceptSignal && (
              <button
                onClick={onAcceptSignal}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận & Mở kế hoạch hỗ trợ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
