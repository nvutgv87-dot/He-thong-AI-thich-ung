/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Flame,
  Award,
} from 'lucide-react';
import {
  Student,
  Assignment,
  StudentSelfCheck,
  FocusSession,
} from '../../types';

interface StudentSelfCheckViewProps {
  currentStudent: Student;
  assignments: Assignment[];
  onSaveSelfCheck: (check: StudentSelfCheck) => void;
  onSaveFocusSession: (session: FocusSession) => void;
  privacyMode: boolean;
}

export const StudentSelfCheckView: React.FC<StudentSelfCheckViewProps> = ({
  currentStudent,
  assignments,
  onSaveSelfCheck,
  onSaveFocusSession,
}) => {
  const [activeTab, setActiveTab] = useState<'FOCUS_TIMER' | 'SELF_CHECK' | 'MY_PROGRESS'>('FOCUS_TIMER');

  // Focus Timer state
  const [selectedTask, setSelectedTask] = useState(assignments[0]?.title || 'Đọc đề bài và làm 2 bài tập cơ bản');
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [reflectionHelped, setReflectionHelped] = useState('');
  const [reflectionDelayed, setReflectionDelayed] = useState('');
  const [completionRate, setCompletionRate] = useState(100);

  // Self-check Form state
  const [completedItemsText, setCompletedItemsText] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [startedOnTime, setStartedOnTime] = useState(true);
  const [interruptionCauses, setInterruptionCauses] = useState<string[]>([]);
  const [requestedSupport, setRequestedSupport] = useState('');
  const [readinessRating, setReadinessRating] = useState(4);
  const [selfCheckSubmitted, setSelfCheckSubmitted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      setSessionFinished(true);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const handleStartTimer = () => {
    setTimerRunning(true);
    setSessionFinished(false);
  };

  const handlePauseTimer = () => {
    setTimerRunning(false);
  };

  const handleResetTimer = (mins: number) => {
    setTimerRunning(false);
    setTimerMinutes(mins);
    setSecondsLeft(mins * 60);
    setSessionFinished(false);
  };

  const handleSaveSessionReflection = () => {
    const newSession: FocusSession = {
      id: `FS_${Date.now()}`,
      studentId: currentStudent.id,
      taskName: selectedTask,
      targetMinutes: timerMinutes,
      completedMinutes: Math.round((timerMinutes * 60 - secondsLeft) / 60),
      startedAt: new Date().toLocaleTimeString('vi-VN'),
      endedAt: new Date().toLocaleTimeString('vi-VN'),
      status: 'COMPLETED',
      completionRate,
      reflectionNotes: {
        helpedBy: reflectionHelped || 'Tắt thông báo điện thoại',
        delayedBy: reflectionDelayed || 'Không có yếu tố gây xao nhãng',
        nextStep: 'Nghỉ ngơi 5 phút',
      },
    };
    onSaveFocusSession(newSession);
    setSessionFinished(false);
    handleResetTimer(25);
  };

  const handleToggleCause = (cause: string) => {
    if (interruptionCauses.includes(cause)) {
      setInterruptionCauses(interruptionCauses.filter((c) => c !== cause));
    } else {
      setInterruptionCauses([...interruptionCauses, cause]);
    }
  };

  const handleSubmitSelfCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const check: StudentSelfCheck = {
      id: `SC_${Date.now()}`,
      studentId: currentStudent.id,
      date: new Date().toLocaleDateString('vi-VN'),
      completedItems: completedItemsText.split('\n').filter((t) => t.trim()),
      challengesEncountered: difficulties,
      startedOnTime,
      interruptionCauses,
      requestedSupport,
      readinessRating,
    };
    onSaveSelfCheck(check);
    setSelfCheckSubmitted(true);
    setTimeout(() => setSelfCheckSubmitted(false), 3000);
    // Reset
    setCompletedItemsText('');
    setDifficulties('');
    setRequestedSupport('');
    setInterruptionCauses([]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Student Welcome Card (Empowering, Neutral, No judgment!) */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Không gian Tự quản Học tập Cá nhân
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Xin chào, {currentStudent.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              "Đây là tiến độ học tập của em." Hệ thống đồng hành giúp em chia nhỏ bài học, 
              làm chủ thời gian và duy trì nhịp tập trung mỗi ngày.
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-3 text-center border border-white/20 shrink-0">
            <div className="text-[11px] text-blue-200">Chuỗi ngày tự giác</div>
            <div className="text-2xl font-extrabold font-mono flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-5 h-5 text-amber-300" />
              <span>4 ngày</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/20 text-xs">
          <button
            onClick={() => setActiveTab('FOCUS_TIMER')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'FOCUS_TIMER'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            Phiên tập trung (Focus Timer)
          </button>
          <button
            onClick={() => setActiveTab('SELF_CHECK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'SELF_CHECK'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            Em tự kiểm tra tiến độ
          </button>
          <button
            onClick={() => setActiveTab('MY_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'MY_PROGRESS'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            Mục tiêu & Thành quả
          </button>
        </div>
      </div>

      {/* Tab 1: FOCUS TIMER */}
      {activeTab === 'FOCUS_TIMER' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bắt đầu Phiên Tập Trung Cá nhân
            </h2>
            <p className="text-xs text-slate-500">
              Chọn một nhiệm vụ nhỏ và thời lượng phù hợp. Khi đồng hồ chạy, hãy để điện thoại ở xa và tập trung giải quyết từng bước nhỏ.
            </p>
          </div>

          {/* Task selector */}
          <div className="max-w-md mx-auto space-y-2 text-xs">
            <label className="block text-slate-600 dark:text-slate-400 font-medium">
              Nhiệm vụ em muốn giải quyết trong phiên này:
            </label>
            <input
              type="text"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              placeholder="Ví dụ: Đọc đề bài và giải câu 1 phần Vectơ"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
            />
          </div>

          {/* Timer presets */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <button
              onClick={() => handleResetTimer(15)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timerMinutes === 15 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              15 phút (Khởi động)
            </button>
            <button
              onClick={() => handleResetTimer(25)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timerMinutes === 25 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              25 phút (Tiêu chuẩn)
            </button>
            <button
              onClick={() => handleResetTimer(45)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                timerMinutes === 45 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              45 phút (Chuyên sâu)
            </button>
          </div>

          {/* Big countdown clock */}
          <div className="text-center py-6">
            <div className="text-6xl sm:text-7xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatTime(secondsLeft)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {timerRunning ? 'Phiên tập trung đang diễn ra...' : 'Sẵn sàng khi em bấm Bắt đầu'}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3">
            {!timerRunning ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>Bắt đầu phiên</span>
              </button>
            ) : (
              <button
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 cursor-pointer transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Tạm dừng</span>
              </button>
            )}

            <button
              onClick={() => handleResetTimer(timerMinutes)}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Post-Session Reflection Box */}
          {sessionFinished && (
            <div className="max-w-md mx-auto p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs space-y-3 animate-in fade-in">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Hoàn thành phiên tập trung! Phản tư ngắn (1 phút):
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Em đã hoàn thành khoảng bao nhiêu % dự định?
                </label>
                <select
                  value={completionRate}
                  onChange={(e) => setCompletionRate(Number(e.target.value))}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value={100}>100% (Hoàn thành trọn vẹn)</option>
                  <option value={80}>80% (Khá tốt)</option>
                  <option value={50}>50% (Một nửa bài)</option>
                  <option value={20}>20% (Chưa xong nhiều)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Điều gì đã giúp em tập trung tốt nhất?
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bật nhạc không lời, để điện thoại ở phòng khách"
                  value={reflectionHelped}
                  onChange={(e) => setReflectionHelped(e.target.value)}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Điều gì làm em xao nhãng hoặc muốn trì hoãn?
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiếng ồn xung quanh, câu hỏi khó chưa hiểu"
                  value={reflectionDelayed}
                  onChange={(e) => setReflectionDelayed(e.target.value)}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <button
                onClick={handleSaveSessionReflection}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer transition-colors"
              >
                Lưu lại thành quả phiên
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: SELF CHECK ("EM TỰ KIỂM TRA TIẾN ĐỘ") */}
      {activeTab === 'SELF_CHECK' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs text-xs space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Em Tự Kiểm Tra Tiến Độ & Phản Tư Hằng Ngày
            </h2>
            <p className="text-slate-500">
              Đây là không gian trung thực dành cho riêng em. Thầy cô xem dữ liệu này để biết cách hỗ trợ phù hợp, không dùng để chấm điểm hay phê bình.
            </p>
          </div>

          {selfCheckSubmitted && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Đã lưu thành công phiếu tự đánh giá hôm nay! Thầy cô sẽ đọc và hỗ trợ em.</span>
            </div>
          )}

          <form onSubmit={handleSubmitSelfCheck} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                1. Hôm nay em đã hoàn thành được những nhiệm vụ gì? (mỗi dòng 1 việc)
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Giải xong 2 bài tập hình học, đọc trước bài 3"
                value={completedItemsText}
                onChange={(e) => setCompletedItemsText(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                2. Em có gặp khó khăn hay cảm thấy bị mắc kẹt ở phần nào không?
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Em chưa hiểu cách dựng vectơ pháp tuyến, thấy bài tập dài quá"
                value={difficulties}
                onChange={(e) => setDifficulties(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                3. Hôm nay em có bắt đầu nhiệm vụ đúng lúc như kế hoạch không?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStartedOnTime(true)}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    startedOnTime
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Có, em bắt đầu đúng giờ
                </button>
                <button
                  type="button"
                  onClick={() => setStartedOnTime(false)}
                  className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                    !startedOnTime
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Em có bị trì hoãn một chút
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                4. Điều gì đã làm em bị gián đoạn hoặc phân tâm? (chọn nếu có)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Thông báo điện thoại / Mạng xã hội',
                  'Chưa biết bắt đầu từ câu nào',
                  'Mệt mỏi sau giờ học trên lớp',
                  'Tiếng ồn trong gia đình',
                  'Không có gì gây gián đoạn',
                ].map((cause) => (
                  <button
                    key={cause}
                    type="button"
                    onClick={() => handleToggleCause(cause)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      interruptionCauses.includes(cause)
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                5. Em muốn được thầy cô hỗ trợ điều gì tiếp theo?
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Thầy gợi ý giúp em câu 2b, hoặc chia nhỏ bài tập tuần này"
                value={requestedSupport}
                onChange={(e) => setRequestedSupport(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Mức độ sẵn sàng cho bài học ngày mai (1 - 5 điểm):
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReadinessRating(num)}
                    className={`w-9 h-9 rounded-lg font-bold font-mono cursor-pointer transition-colors ${
                      readinessRating === num
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Gửi phiếu tự kiểm tra
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: MY PROGRESS */}
      {activeTab === 'MY_PROGRESS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs text-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Mục Tiêu & Những Bước Tiến Của Em
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Mục tiêu cá nhân
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                {currentStudent.profile.personalGoals.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Điểm mạnh của em
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                {currentStudent.profile.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <div className="font-semibold text-blue-900 dark:text-blue-200">
              Chiến lược học tập hiệu quả nhất với em:
            </div>
            <p className="text-slate-700 dark:text-slate-300 mt-1">
              {currentStudent.profile.effectiveStrategies.join(' · ') || 'Chia nhỏ bài tập 15 phút, tắt thông báo điện thoại.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
