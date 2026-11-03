import React, { useState } from 'react';
import { ExamPaper, ExamMatrixItem } from '../../types/examTypes';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { formatScore } from '../../utils/scoreUtils';
import {
  Layers,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Edit2,
  Plus,
  Trash2,
} from 'lucide-react';

interface MatrixTabProps {
  currentExam: ExamPaper;
  allExams: ExamPaper[];
  onSelectExam: (exam: ExamPaper) => void;
  onUpdateExam: (updated: ExamPaper) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  currentExam,
  allExams,
  onSelectExam,
  onUpdateExam,
  userRole,
}) => {
  const [matrixItems, setMatrixItems] = useState<ExamMatrixItem[]>(
    currentExam.matrix || []
  );
  const [isEditing, setIsEditing] = useState(false);

  // Sync state if currentExam changes
  React.useEffect(() => {
    setMatrixItems(currentExam.matrix || []);
  }, [currentExam.id, currentExam.updatedAt, currentExam.matrix]);

  // Calculations & Validation
  const totalKnowCount = matrixItems.reduce((s, m) => s + (Number(m.knowCount) || 0), 0);
  const totalUnderstandCount = matrixItems.reduce((s, m) => s + (Number(m.understandCount) || 0), 0);
  const totalApplyCount = matrixItems.reduce((s, m) => s + (Number(m.applyCount) || 0), 0);
  const totalQuestions = totalKnowCount + totalUnderstandCount + totalApplyCount;

  const totalKnowPoints = matrixItems.reduce((s, m) => s + (Number(m.knowPoints) || 0), 0);
  const totalUnderstandPoints = matrixItems.reduce((s, m) => s + (Number(m.understandPoints) || 0), 0);
  const totalApplyPoints = matrixItems.reduce((s, m) => s + (Number(m.applyPoints) || 0), 0);
  const totalPoints = Math.round((totalKnowPoints + totalUnderstandPoints + totalApplyPoints) * 100) / 100;

  const ratioKnow = currentExam.ratio?.know ?? 40;
  const ratioUnderstand = currentExam.ratio?.understand ?? 40;
  const ratioApply = currentExam.ratio?.apply ?? 20;
  const sumRatio = ratioKnow + ratioUnderstand + ratioApply;

  const isPointsValid = Math.abs(totalPoints - 10.0) <= 0.05;
  const isRatioValid = sumRatio === 100;
  const isQuestionCountMatching = totalQuestions === currentExam.questions.length;

  const handleCellChange = (
    index: number,
    field: keyof ExamMatrixItem,
    val: any
  ) => {
    const updated = [...matrixItems];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    // Recalculate row total
    const rowPoints =
      (Number(updated[index].knowPoints) || 0) +
      (Number(updated[index].understandPoints) || 0) +
      (Number(updated[index].applyPoints) || 0);
    updated[index].totalPoints = Math.round(rowPoints * 100) / 100;
    setMatrixItems(updated);
  };

  const handleSaveMatrix = () => {
    if (userRole !== 'TEACHER') return;
    const updatedExam: ExamPaper = {
      ...currentExam,
      matrix: matrixItems,
      totalQuestions,
      updatedAt: new Date().toISOString(),
    };
    examService.saveExam(updatedExam);
    onUpdateExam(updatedExam);
    setIsEditing(false);
    toastService.success('Đã lưu thay đổi thành công! Bảng Ma trận đề kiểm tra đã được lưu lại.');
  };

  const handleResetMatrix = () => {
    setMatrixItems(currentExam.matrix || []);
    setIsEditing(false);
    toastService.info('Đã hoàn tác thay đổi ma trận.');
  };

  const handleSyncFromQuestions = () => {
    const generated = examService.buildMatrixFromQuestions(
      currentExam.questions,
      currentExam.chapter,
      currentExam.topic,
      currentExam.totalPoints || 10.0
    );
    setMatrixItems(generated);
    setIsEditing(true);
    toastService.success('Đã tự động tính toán và đồng bộ Ma trận chuẩn theo toàn bộ câu hỏi trong đề!');
  };

  const handleAddRow = () => {
    const newRow: ExamMatrixItem = {
      topic: 'Chủ đề mới',
      chapter: currentExam.chapter || 'Chương trình',
      knowCount: 2,
      understandCount: 2,
      applyCount: 1,
      knowPoints: 1.0,
      understandPoints: 1.0,
      applyPoints: 0.5,
      totalPoints: 2.5,
      percentage: 25,
    };
    setMatrixItems([...matrixItems, newRow]);
    setIsEditing(true);
  };

  const handleDeleteRow = (idx: number) => {
    if (matrixItems.length <= 1) {
      toastService.warning('Ma trận đề phải có ít nhất 1 chủ đề kiến thức.');
      return;
    }
    setMatrixItems(matrixItems.filter((_, i) => i !== idx));
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Exam Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                2. Ma trận đề kiểm tra
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium">
                  Chuẩn 3 Mức độ
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Chủ đề × Số câu / Số điểm theo 3 mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG)
              </p>
            </div>
          </div>
        </div>

        {/* Exam switcher */}
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
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    onClick={handleResetMatrix}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleSaveMatrix}
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
                    title="Tự động đồng bộ hóa ma trận chuẩn theo toàn bộ câu hỏi trong đề"
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
                    <span>Chỉnh sửa ma trận</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Consistency Validation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isPointsValid
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {isPointsValid ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-bold">
              Tổng điểm ma trận: {formatScore(totalPoints)} / 10,0đ
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">
              {isPointsValid
                ? 'Tổng điểm các mức độ khớp chính xác thang 10,0 điểm.'
                : 'Cảnh báo: Tổng điểm các mức phải đúng bằng 10,0 điểm.'}
            </div>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isRatioValid
              ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}
        >
          {isRatioValid ? (
            <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-bold">
              Tỷ lệ 3 mức: {ratioKnow}% - {ratioUnderstand}% - {ratioApply}% (= {sumRatio}%)
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">
              {isRatioValid
                ? 'Tổng tỷ lệ BIẾT + HIỂU + VẬN DỤNG = 100% chuẩn quy định.'
                : 'Cảnh báo: Tổng tỷ lệ phải đạt đúng 100%.'}
            </div>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isQuestionCountMatching
              ? 'bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
              : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}
        >
          {isQuestionCountMatching ? (
            <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-bold">
              Tổng số câu hỏi: {totalQuestions} câu
            </div>
            <div className="text-[11px] opacity-90 mt-0.5">
              {isQuestionCountMatching
                ? `Khớp hoàn toàn với ${currentExam.questions.length} câu trong đề kiểm tra.`
                : `Lệch số lượng so với đề (${currentExam.questions.length} câu). Cần đồng bộ.`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Bảng ma trận chi tiết: {currentExam.title}
            </span>
          </div>
          {isEditing && (
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dòng chủ đề</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold text-center">
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-10">
                  TT
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-left min-w-[200px]">
                  Chủ đề / Bài học
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                  BIẾT ({ratioKnow}%)
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                  HIỂU ({ratioUnderstand}%)
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 bg-purple-50/60 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                  VẬN DỤNG ({ratioApply}%)
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border-r border-slate-200 dark:border-slate-700 w-20">
                  Tổng câu
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border-r border-slate-200 dark:border-slate-700 w-20 text-purple-700 dark:text-purple-300 font-bold">
                  Tổng điểm
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border-r border-slate-200 dark:border-slate-700 w-16">
                  Tỷ lệ %
                </th>
                {isEditing && <th rowSpan={2} className="py-2.5 px-2 w-10">Thao tác</th>}
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-center font-medium">
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Số câu</th>
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Điểm</th>
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Số câu</th>
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Điểm</th>
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Số câu</th>
                <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {matrixItems.map((item, idx) => {
                const rowQuestions =
                  (Number(item.knowCount) || 0) +
                  (Number(item.understandCount) || 0) +
                  (Number(item.applyCount) || 0);
                const rowPoints =
                  (Number(item.knowPoints) || 0) +
                  (Number(item.understandPoints) || 0) +
                  (Number(item.applyPoints) || 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-semibold border-r border-slate-100 dark:border-slate-800">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={item.topic}
                            onChange={(e) => handleCellChange(idx, 'topic', e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                          />
                          <input
                            type="text"
                            value={item.chapter}
                            onChange={(e) => handleCellChange(idx, 'chapter', e.target.value)}
                            placeholder="Chương..."
                            className="w-full px-2 py-0.5 text-[10px] border rounded bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.topic}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.chapter}</div>
                        </div>
                      )}
                    </td>

                    {/* BIẾT */}
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={item.knowCount}
                          onChange={(e) => handleCellChange(idx, 'knowCount', parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-blue-700 dark:text-blue-300">{item.knowCount}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.knowPoints}
                          onChange={(e) => handleCellChange(idx, 'knowPoints', parseFloat(e.target.value) || 0)}
                          className="w-14 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span>{formatScore(item.knowPoints)}đ</span>
                      )}
                    </td>

                    {/* HIỂU */}
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={item.understandCount}
                          onChange={(e) => handleCellChange(idx, 'understandCount', parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">{item.understandCount}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.understandPoints}
                          onChange={(e) => handleCellChange(idx, 'understandPoints', parseFloat(e.target.value) || 0)}
                          className="w-14 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span>{formatScore(item.understandPoints)}đ</span>
                      )}
                    </td>

                    {/* VẬN DỤNG */}
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-purple-50/20 dark:bg-purple-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={item.applyCount}
                          onChange={(e) => handleCellChange(idx, 'applyCount', parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span className="font-bold text-purple-700 dark:text-purple-300">{item.applyCount}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 bg-purple-50/20 dark:bg-purple-950/10">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.applyPoints}
                          onChange={(e) => handleCellChange(idx, 'applyPoints', parseFloat(e.target.value) || 0)}
                          className="w-14 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span>{formatScore(item.applyPoints)}đ</span>
                      )}
                    </td>

                    {/* Tổng câu */}
                    <td className="py-2 px-2 text-center font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                      {rowQuestions}
                    </td>

                    {/* Tổng điểm */}
                    <td className="py-2 px-2 text-center font-bold text-purple-700 dark:text-purple-300 border-r border-slate-100 dark:border-slate-800">
                      {formatScore(rowPoints)}đ
                    </td>

                    {/* Tỷ lệ % */}
                    <td className="py-2 px-2 text-center text-slate-500 border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.percentage}
                          onChange={(e) => handleCellChange(idx, 'percentage', parseInt(e.target.value) || 0)}
                          className="w-12 text-center px-1 py-0.5 border rounded bg-white dark:bg-slate-900"
                        />
                      ) : (
                        <span>{item.percentage}%</span>
                      )}
                    </td>

                    {isEditing && (
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Summary Row */}
              <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <td colSpan={2} className="py-3 px-3 text-center text-slate-900 dark:text-white uppercase text-xs">
                  TỔNG CỘNG
                </td>
                <td className="py-3 px-2 text-center text-blue-700 dark:text-blue-300 font-extrabold">
                  {totalKnowCount}
                </td>
                <td className="py-3 px-2 text-center text-blue-700 dark:text-blue-300 font-extrabold">
                  {formatScore(totalKnowPoints)}đ
                </td>
                <td className="py-3 px-2 text-center text-emerald-700 dark:text-emerald-300 font-extrabold">
                  {totalUnderstandCount}
                </td>
                <td className="py-3 px-2 text-center text-emerald-700 dark:text-emerald-300 font-extrabold">
                  {formatScore(totalUnderstandPoints)}đ
                </td>
                <td className="py-3 px-2 text-center text-purple-700 dark:text-purple-300 font-extrabold">
                  {totalApplyCount}
                </td>
                <td className="py-3 px-2 text-center text-purple-700 dark:text-purple-300 font-extrabold">
                  {formatScore(totalApplyPoints)}đ
                </td>
                <td className="py-3 px-2 text-center font-extrabold text-slate-900 dark:text-white">
                  {totalQuestions}
                </td>
                <td className="py-3 px-2 text-center font-extrabold text-purple-700 dark:text-purple-300">
                  {formatScore(totalPoints)}đ
                </td>
                <td className="py-3 px-2 text-center font-extrabold text-slate-900 dark:text-white">
                  100%
                </td>
                {isEditing && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pedagogical Note */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4 text-purple-500" />
          <span>Nguyên tắc ma trận đề kiểm tra chuẩn CT GDPT 2018:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 leading-relaxed">
          <li>
            <strong>BIẾT:</strong> Yêu cầu tái hiện kiến thức, nhận diện định nghĩa, công thức cấu tạo, gọi tên IUPAC alcohol, dẫn xuất halogen...
          </li>
          <li>
            <strong>HIỂU:</strong> Yêu cầu so sánh tính chất vật lý (nhiệt độ sôi, độ tan), giải thích hiện tượng phản ứng, liên kết hydrogen liên phân tử...
          </li>
          <li>
            <strong>VẬN DỤNG:</strong> Giải quyết bài toán định lượng, hiệu suất phản ứng, giải thích tác hại của cồn công nghiệp methanol trong đời sống.
          </li>
        </ul>
      </div>

      {/* Sticky Bottom Save Bar when editing */}
      {userRole === 'TEACHER' && isEditing && (
        <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-emerald-500/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Đang chỉnh sửa Ma trận đề: {currentExam.title}
            </span>
            <span className="text-slate-500 font-medium">({totalQuestions} câu · {formatScore(totalPoints)}đ)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMatrix}
              className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveMatrix}
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
