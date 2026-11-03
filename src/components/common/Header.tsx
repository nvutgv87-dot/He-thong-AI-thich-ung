/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  History,
  Sparkles,
  BookOpen,
  BrainCircuit,
} from 'lucide-react';

export type ActiveView = 
  | 'DASHBOARD'
  | 'STUDENTS'
  | 'INTERVENTIONS'
  | 'DATA_QUALITY'
  | 'REPORTS'
  | 'PROMPT_BUILDER'
  | 'LEARNING_CORNER'
  | 'AI_ASSISTANT_EXAM'
  | 'STUDENT_PORTAL';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenCommandCenter: () => void;
  onOpenAuditLogs: () => void;
  userRole: 'TEACHER' | 'STUDENT';
  setUserRole: (role: 'TEACHER' | 'STUDENT') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  privacyMode,
  onTogglePrivacy,
  onOpenCommandCenter,
  onOpenAuditLogs,
  userRole,
  setUserRole,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Zone 1: Single text wordmark with Class & Subject badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveView('DASHBOARD')}
            className="text-left group cursor-pointer focus:outline-none flex items-center"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              ADAPTIVE AI
            </span>
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Lớp
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {userRole === 'TEACHER' ? (
            <>
              <button
                onClick={() => setActiveView('DASHBOARD')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'DASHBOARD'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveView('STUDENTS')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'STUDENTS'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hồ sơ 360°
              </button>
              <button
                onClick={() => setActiveView('INTERVENTIONS')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'INTERVENTIONS'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tín hiệu & Hỗ trợ
              </button>
              <button
                onClick={() => setActiveView('DATA_QUALITY')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'DATA_QUALITY'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Kiểm tra dữ liệu
              </button>
              <button
                onClick={() => setActiveView('REPORTS')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'REPORTS'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Báo cáo
              </button>
              <button
                onClick={() => setActiveView('PROMPT_BUILDER')}
                className={`flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'PROMPT_BUILDER'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Gợi ý AI</span>
              </button>
              <button
                onClick={() => setActiveView('LEARNING_CORNER')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'LEARNING_CORNER'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Góc học tập</span>
              </button>
              <button
                onClick={() => setActiveView('AI_ASSISTANT_EXAM')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'AI_ASSISTANT_EXAM'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Kiểm tra & Đánh giá</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4 text-xs font-medium">
              <button
                onClick={() => setActiveView('LEARNING_CORNER')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'LEARNING_CORNER'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Góc học tập</span>
              </button>
              <button
                onClick={() => setActiveView('AI_ASSISTANT_EXAM')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'AI_ASSISTANT_EXAM'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Kiểm tra & Đánh giá</span>
              </button>
              <button
                onClick={() => setActiveView('STUDENT_PORTAL')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  activeView === 'STUDENT_PORTAL'
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tự phản tư & Tập trung
              </button>
            </div>
          )}
        </nav>

        {/* Zone 3: Actions (Perspective switch, Command Center, Privacy mode, Audit) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command center quick search */}
          <button
            onClick={onOpenCommandCenter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Mở thanh lệnh: Bạn muốn làm gì?"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Bạn muốn làm gì?</span>
          </button>

          {/* Privacy mode toggle */}
          <button
            onClick={onTogglePrivacy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              privacyMode
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
            title="Ẩn danh tên thật học sinh (chuyển sang HS01, HS02) khi trình chiếu"
          >
            {privacyMode ? (
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {privacyMode ? 'Ẩn danh: BẬT' : 'Ẩn danh: TẮT'}
            </span>
          </button>

          {/* Audit log trigger */}
          <button
            onClick={onOpenAuditLogs}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Nhật ký kiểm toán hệ thống (Audit Log)"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Role switcher toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setUserRole('TEACHER');
                if (activeView === 'STUDENT_PORTAL') setActiveView('DASHBOARD');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                userRole === 'TEACHER'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Giáo viên</span>
            </button>
            <button
              onClick={() => {
                setUserRole('STUDENT');
                setActiveView('STUDENT_PORTAL');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                userRole === 'STUDENT'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Học sinh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
