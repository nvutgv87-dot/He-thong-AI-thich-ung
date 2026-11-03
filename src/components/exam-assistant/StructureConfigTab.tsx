import React, { useState } from 'react';
import {
  ExamStructureConfig,
  EXAM_PRESETS,
  calculateStructurePoints,
  formatScore,
  parseScore,
} from '../../utils/scoreUtils';
import {
  Layers,
  Calculator,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  RotateCcw,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface StructureConfigTabProps {
  initialConfig?: ExamStructureConfig;
  onApplyConfig?: (config: ExamStructureConfig) => void;
}

export const StructureConfigTab: React.FC<StructureConfigTabProps> = ({
  initialConfig = {
    part1Count: 20,
    part2Count: 2,
    part3Count: 6,
    part4Count: 3,
  },
  onApplyConfig,
}) => {
  const [config, setConfig] = useState<ExamStructureConfig>(initialConfig);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  const pointsCalc = calculateStructurePoints(config);

  const handleUpdateCount = (part: keyof ExamStructureConfig, delta: number) => {
    setConfig((prev) => {
      const minVal = part === 'part2Count' ? 1 : 1;
      const nextVal = Math.max(minVal, prev[part] + delta);
      return { ...prev, [part]: nextVal };
    });
  };

  const handleSetCountDirect = (part: keyof ExamStructureConfig, valueStr: string) => {
    const parsed = parseInt(valueStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setConfig((prev) => ({ ...prev, [part]: parsed }));
    }
  };

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = EXAM_PRESETS[index];
    if (preset) {
      setConfig(preset.config);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Info Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cấu trúc đề thi & Thang điểm chuẩn 10,0 điểm
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy chuẩn theo định hướng khảo thí Bộ GD&ĐT 2025 – SGK Kết nối tri thức. Điểm tự động tính toán thời gian thực theo số lượng câu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
              Tổng điểm: 10,0đ
            </span>
          </div>
        </div>

        {/* Quick Presets Selection */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Chọn mẫu nhanh (Preset) hoặc tùy chỉnh chi tiết:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {EXAM_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPresetIndex === idx
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>{preset.name}</span>
                  {selectedPresetIndex === idx && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Parts Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phần I: Trắc nghiệm 4 lựa chọn */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                I
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Phần I – Trắc nghiệm nhiều lựa chọn
                </h3>
                <p className="text-[11px] text-slate-400">Chọn 1 đáp án đúng trong 4 phương án</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              5,0 điểm
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Số lượng câu:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateCount('part1Count', -1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={config.part1Count}
                onChange={(e) => handleSetCountDirect('part1Count', e.target.value)}
                className="w-12 text-center py-1 font-bold text-slate-900 dark:text-white bg-transparent border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleUpdateCount('part1Count', 1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <strong>Công thức:</strong> {pointsCalc.formulas.part1}
          </div>
        </div>

        {/* Phần II: Đúng / Sai */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                II
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Phần II – Câu hỏi Đúng / Sai
                </h3>
                <p className="text-[11px] text-slate-400">Mỗi câu gồm 4 ý a, b, c, d</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              2,0 điểm
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Số câu (mỗi câu 4 ý):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateCount('part2Count', -1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={config.part2Count}
                onChange={(e) => handleSetCountDirect('part2Count', e.target.value)}
                className="w-12 text-center py-1 font-bold text-slate-900 dark:text-white bg-transparent border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleUpdateCount('part2Count', 1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50 leading-relaxed">
            <strong>Quy tắc chấm:</strong> {pointsCalc.formulas.part2}
          </div>
        </div>

        {/* Phần III: Trả lời ngắn */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                III
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Phần III – Trắc nghiệm trả lời ngắn
                </h3>
                <p className="text-[11px] text-slate-400">Điền số hoặc ký hiệu hóa học</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              1,5 điểm
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Số lượng câu:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateCount('part3Count', -1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={config.part3Count}
                onChange={(e) => handleSetCountDirect('part3Count', e.target.value)}
                className="w-12 text-center py-1 font-bold text-slate-900 dark:text-white bg-transparent border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleUpdateCount('part3Count', 1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50">
            <strong>Công thức:</strong> {pointsCalc.formulas.part3}
          </div>
        </div>

        {/* Phần IV: Tự luận */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                IV
              </span>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  Phần IV – Tự luận & Rubric chi tiết
                </h3>
                <p className="text-[11px] text-slate-400">Trình bày lời giải bám sát SGK Kết nối tri thức</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              1,5 điểm
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Số ý chấm (Rubric):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateCount('part4Count', -1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="10"
                value={config.part4Count}
                onChange={(e) => handleSetCountDirect('part4Count', e.target.value)}
                className="w-12 text-center py-1 font-bold text-slate-900 dark:text-white bg-transparent border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleUpdateCount('part4Count', 1)}
                className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-100 dark:border-purple-900/50">
            <strong>Công thức:</strong> {pointsCalc.formulas.part4}
          </div>
        </div>
      </div>

      {/* Action footer */}
      {onApplyConfig && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onApplyConfig(config)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Áp dụng cấu trúc điểm vào Đề kiểm tra</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
