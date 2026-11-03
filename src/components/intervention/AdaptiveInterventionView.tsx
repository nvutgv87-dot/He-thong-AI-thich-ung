/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  MessageSquare,
  ThumbsUp,
  RefreshCw,
  TrendingUp,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  Student,
  InterventionPlan,
  RiskSignal,
  InterventionTargetArea,
} from '../../types';
import { aiService } from '../../services/aiService';

interface AdaptiveInterventionViewProps {
  students: Student[];
  signals: RiskSignal[];
  interventions: InterventionPlan[];
  privacyMode: boolean;
  onSaveIntervention: (plan: InterventionPlan) => void;
  onUpdateInterventionStatus: (id: string, status: InterventionPlan['status'], evaluation?: InterventionPlan['evaluationResult'], adaptationNotes?: string) => void;
  onUpdateIntervention?: (plan: InterventionPlan) => void;
  onDeleteIntervention?: (planId: string) => void;
}

export const AdaptiveInterventionView: React.FC<AdaptiveInterventionViewProps> = ({
  students,
  signals,
  interventions,
  privacyMode,
  onSaveIntervention,
  onUpdateInterventionStatus,
  onUpdateIntervention,
  onDeleteIntervention,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [planTitle, setPlanTitle] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planStrategy, setPlanStrategy] = useState('');
  const [targetArea, setTargetArea] = useState<InterventionTargetArea>('CHIA_NHỎ_NHIỆM_VỤ');
  const [microTasksText, setMicroTasksText] = useState('Chặng 1: 15 phút đọc đề và lập dàn ý\nChặng 2: 20 phút hoàn thành bài tập cơ bản\nChặng 3: 15 phút kiểm tra lại');
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [successCriteria, setSuccessCriteria] = useState('Nâng tỷ lệ nộp bài đúng hạn lên >= 80%');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Evaluation modal state
  const [evaluatingPlan, setEvaluatingPlan] = useState<InterventionPlan | null>(null);
  const [evalResult, setEvalResult] = useState<InterventionPlan['evaluationResult']>('HIỆU_QUẢ');
  const [evalAdaptation, setEvalAdaptation] = useState('');

  // Editing plan state
  const [editingPlanData, setEditingPlanData] = useState<InterventionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<InterventionPlan | null>(null);

  const handleAIAutoSuggest = async () => {
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setIsGeneratingAI(true);
    try {
      const suggestion = await aiService.proposeIntervention({
        studentCode: student.code,
        signalType: student.warningLevel === 2 ? 'TRÌ_HOÃN_NHIỆM_VỤ' : 'SUY_GIẢM_THAM_GIA',
        delayPattern: student.profile.taskCompletionHabits,
        strengths: student.profile.strengths,
        difficulties: student.profile.currentDifficulties,
        currentGoal: student.profile.personalGoals[0],
      });

      if (suggestion.title) setPlanTitle(suggestion.title);
      if (suggestion.goal) setPlanGoal(suggestion.goal);
      if (suggestion.strategyDescription) setPlanStrategy(suggestion.strategyDescription);
      if (suggestion.targetArea) setTargetArea(suggestion.targetArea);
      if (suggestion.microTasks && suggestion.microTasks.length > 0) {
        setMicroTasksText(suggestion.microTasks.join('\n'));
      }
      if (suggestion.successCriteria) setSuccessCriteria(suggestion.successCriteria);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    const newPlan: InterventionPlan = {
      id: `INT_${Date.now()}`,
      studentId: selectedStudentId,
      title: planTitle || 'Kế hoạch hỗ trợ thích ứng',
      goal: planGoal,
      targetArea,
      strategyDescription: planStrategy,
      microTasks: microTasksText.split('\n').filter((t) => t.trim()),
      startDate: new Date().toLocaleDateString('vi-VN'),
      endDate: new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
      durationWeeks,
      teacherInCharge: 'ThS. Nguyễn Hoàng Nam',
      targetIndicator: 'Tỷ lệ nộp bài và tương tác học tập',
      successCriteria,
      status: 'ĐANG_THỰC_HIỆN',
      beforeMetrics: {
        onTimeRate: student.baseline.onTimeRate,
        participationScore: student.baseline.participationScore,
        overdueCount: 1,
        avgScore: student.baseline.avgScore,
        focusMinutesWeekly: student.baseline.focusMinutesAvg * 2,
        capturedDate: new Date().toLocaleDateString('vi-VN'),
      },
      teacherNotes: 'Giáo viên đã xác nhận và thiết lập các bước hỗ trợ.',
    };

    onSaveIntervention(newPlan);
    setShowCreateModal(false);
    // Reset form
    setPlanTitle('');
    setPlanGoal('');
    setPlanStrategy('');
  };

  const handleSaveEvaluation = () => {
    if (!evaluatingPlan) return;
    onUpdateInterventionStatus(
      evaluatingPlan.id,
      evalResult === 'HIỆU_QUẢ' ? 'ĐÃ_HOÀN_THÀNH' : 'ĐIỀU_CHỈNH',
      evalResult,
      evalAdaptation
    );
    setEvaluatingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Động cơ Can thiệp Thích ứng (Adaptive Intervention Engine)
          </h1>
          <p className="text-xs text-slate-500">
            Cơ chế: PHÁT HIỆN → ĐỀ XUẤT → THỰC HIỆN → ĐO LƯỜNG → ĐIỀU CHỈNH
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo kế hoạch can thiệp mới</span>
        </button>
      </div>

      {/* 5-step Adaptive Loop Explanation Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-blue-600">1. Phát hiện</div>
          <div className="text-slate-500 mt-1">So sánh với baseline cá nhân qua chuỗi thời gian liên tục.</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-indigo-600">2. Đề xuất</div>
          <div className="text-slate-500 mt-1">AI gợi ý vi phân nhiệm vụ 15 phút hoặc bài học vi mô.</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-purple-600">3. Thực hiện</div>
          <div className="text-slate-500 mt-1">Giáo viên kiểm tra chặng 1 sau 24h, học sinh ghi nhận.</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-amber-600">4. Đo lường</div>
          <div className="text-slate-500 mt-1">Thu thập số liệu trước và sau can thiệp 2 tuần.</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-emerald-600">5. Điều chỉnh</div>
          <div className="text-slate-500 mt-1">Tự động thích ứng đề xuất dựa trên phản hồi thực tế.</div>
        </div>
      </div>

      {/* Interventions list */}
      <div className="space-y-4">
        {interventions.map((plan) => {
          const student = students.find((s) => s.id === plan.studentId);
          const displayName = student ? (privacyMode ? student.code : student.fullName) : 'HS';

          return (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {displayName}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {plan.title}
                    </span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-3 text-[11px]">
                    <span>Bắt đầu: {plan.startDate}</span>
                    <span>·</span>
                    <span>Kết thúc: {plan.endDate}</span>
                    <span>·</span>
                    <span>Thời lượng: {plan.durationWeeks} tuần</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    plan.status === 'ĐÃ_HOÀN_THÀNH'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {plan.status === 'ĐÃ_HOÀN_THÀNH' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                  </span>

                  {plan.status === 'ĐANG_THỰC_HIỆN' && (
                    <button
                      onClick={() => {
                        setEvaluatingPlan(plan);
                        setEvalResult('HIỆU_QUẢ');
                        setEvalAdaptation('');
                      }}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                    >
                      Đánh giá kết quả
                    </button>
                  )}

                  <button
                    onClick={() => setEditingPlanData({ ...plan })}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Chỉnh sửa kế hoạch này"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPlanToDelete(plan)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                    title="Xóa kế hoạch này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Goal and strategy */}
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Mục tiêu cụ thể: </span>
                  <span className="text-slate-600 dark:text-slate-400">{plan.goal}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Chiến lược can thiệp: </span>
                  <span className="text-slate-600 dark:text-slate-400">{plan.strategyDescription}</span>
                </div>
              </div>

              {/* Micro-tasks block */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Các mốc vi phân nhiệm vụ (Micro-tasks):
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  {plan.microTasks.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Before and After Quantitative Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <div className="font-semibold text-rose-800 dark:text-rose-300 mb-1">Dữ liệu Trước can thiệp</div>
                  <div>Tỷ lệ nộp đúng hạn: <strong className="font-mono">{plan.beforeMetrics.onTimeRate}%</strong></div>
                  <div>Nhiệm vụ quá hạn: <strong className="font-mono">{plan.beforeMetrics.overdueCount} bài</strong></div>
                  <div>Điểm tham gia: <strong className="font-mono">{plan.beforeMetrics.participationScore}/5</strong></div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Dữ liệu Sau can thiệp</div>
                  <div>Tỷ lệ nộp đúng hạn: <strong className="font-mono">{plan.afterMetrics?.onTimeRate ?? 'Đang theo dõi...'}%</strong></div>
                  <div>Nhiệm vụ quá hạn: <strong className="font-mono">{plan.afterMetrics?.overdueCount ?? 0} bài</strong></div>
                  <div>Điểm tham gia: <strong className="font-mono">{plan.afterMetrics?.participationScore ?? 4.5}/5</strong></div>
                </div>
              </div>

              {/* Student Feedback & Adaptation notes */}
              {plan.studentFeedback && (
                <div className="p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">Phản hồi của học sinh: </span>
                  <span className="italic text-slate-700 dark:text-slate-300">"{plan.studentFeedback.comment}"</span>
                  <span className="text-slate-500 text-[11px] ml-2">
                    (Độ khó: {plan.studentFeedback.easeOfExecution} · Độ hữu ích: {plan.studentFeedback.helpfulness})
                  </span>
                </div>
              )}

              {plan.adaptationNotes && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span><strong>Điều chỉnh kế tiếp: </strong>{plan.adaptationNotes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-500" />
                Thiết lập Kế hoạch Can thiệp Sư phạm Cá nhân hóa
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Chọn học sinh:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {privacyMode ? s.code : s.fullName} ({s.code}) - {s.currentStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI auto suggest trigger */}
              <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Gợi ý từ Động cơ AI Thích ứng
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Tự động phân tích điểm mạnh & khó khăn của học sinh để sinh chiến lược vi mô.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAIAutoSuggest}
                  disabled={isGeneratingAI}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors disabled:opacity-60 shrink-0"
                >
                  {isGeneratingAI ? 'Đang tạo...' : 'AI đề xuất'}
                </button>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tên kế hoạch:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kế hoạch vi phân nhiệm vụ 15 phút & nhắc hẹn thân thiện"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mục tiêu đo lường:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nâng tỷ lệ nộp bài đúng hạn lên >= 75% sau 2 tuần"
                  value={planGoal}
                  onChange={(e) => setPlanGoal(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mô tả chiến lược sư phạm:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cách chia bài tập, phản hồi nhanh của thầy cô..."
                  value={planStrategy}
                  onChange={(e) => setPlanStrategy(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Các bước chia nhỏ (mỗi dòng 1 bước):</label>
                <textarea
                  rows={3}
                  value={microTasksText}
                  onChange={(e) => setMicroTasksText(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold cursor-pointer"
                >
                  Xác nhận & Bắt đầu can thiệp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Modal */}
      {evaluatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Đánh giá kết quả can thiệp sư phạm
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Đánh giá của giáo viên:</label>
                <select
                  value={evalResult}
                  onChange={(e: any) => setEvalResult(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="HIỆU_QUẢ">Hiệu quả (Dữ liệu phục hồi tốt)</option>
                  <option value="HIỆU_QUẢ_MỘT_PHẦN">Hiệu quả một phần</option>
                  <option value="CHƯA_HIỆU_QUẢ">Chưa hiệu quả</option>
                  <option value="KHÔNG_PHÙ_HỢP">Không phù hợp (Cần đổi chiến lược)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Ghi chú điều chỉnh cho giai đoạn tiếp theo:</label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Giảm tần suất nhắc nhở, chuyển giao quyền tự quản hoàn toàn cho học sinh..."
                  value={evalAdaptation}
                  onChange={(e) => setEvalAdaptation(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEvaluatingPlan(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleSaveEvaluation}
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold cursor-pointer"
                >
                  Lưu đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Intervention Plan Modal */}
      {editingPlanData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Chỉnh sửa kế hoạch can thiệp
              </h3>
              <button
                onClick={() => setEditingPlanData(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateIntervention && editingPlanData) {
                  onUpdateIntervention(editingPlanData);
                }
                setEditingPlanData(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tên kế hoạch:</label>
                <input
                  type="text"
                  value={editingPlanData.title}
                  onChange={(e) => setEditingPlanData({ ...editingPlanData, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mục tiêu đo lường:</label>
                <input
                  type="text"
                  value={editingPlanData.goal}
                  onChange={(e) => setEditingPlanData({ ...editingPlanData, goal: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Chiến lược can thiệp:</label>
                <textarea
                  rows={2}
                  value={editingPlanData.strategyDescription}
                  onChange={(e) => setEditingPlanData({ ...editingPlanData, strategyDescription: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Các bước chia nhỏ (mỗi dòng 1 bước):</label>
                <textarea
                  rows={3}
                  value={editingPlanData.microTasks.join('\n')}
                  onChange={(e) => setEditingPlanData({
                    ...editingPlanData,
                    microTasks: e.target.value.split('\n').filter(Boolean)
                  })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent font-mono text-[11px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Thời lượng (tuần):</label>
                  <input
                    type="number"
                    value={editingPlanData.durationWeeks}
                    onChange={(e) => setEditingPlanData({ ...editingPlanData, durationWeeks: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Trạng thái:</label>
                  <select
                    value={editingPlanData.status}
                    onChange={(e: any) => setEditingPlanData({ ...editingPlanData, status: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  >
                    <option value="ĐANG_THỰC_HIỆN">ĐANG THỰC HIỆN</option>
                    <option value="ĐÃ_HOÀN_THÀNH">ĐÃ HOÀN THÀNH</option>
                    <option value="ĐIỀU_CHỈNH">ĐIỀU CHỈNH</option>
                    <option value="TỪ_CHỐI">TỪ CHỐI</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlanData(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Xác nhận xóa kế hoạch can thiệp</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa kế hoạch: <strong>"{planToDelete.title}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteIntervention) {
                    onDeleteIntervention(planToDelete.id);
                  }
                  setPlanToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
