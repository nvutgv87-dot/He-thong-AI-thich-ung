/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  BookOpen,
  BrainCircuit,
} from 'lucide-react';
import { ActiveView } from './Header';

interface BottomNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  setActiveView,
  userRole,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center overflow-x-auto scrollbar-none">
      {userRole === 'TEACHER' ? (
        <>
          <button
            onClick={() => setActiveView('DASHBOARD')}
            className={`flex flex-col items-center justify-center p-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 ${
              activeView === 'DASHBOARD'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Trang chủ</span>
          </button>

          <button
            onClick={() => setActiveView('STUDENTS')}
            className={`flex flex-col items-center justify-center p-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 ${
              activeView === 'STUDENTS'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Hồ sơ 360°</span>
          </button>

          <button
            onClick={() => setActiveView('LEARNING_CORNER')}
            className={`flex flex-col items-center justify-center p-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 ${
              activeView === 'LEARNING_CORNER'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5 text-emerald-500" />
            <span>Góc học tập</span>
          </button>

          <button
            onClick={() => setActiveView('AI_ASSISTANT_EXAM')}
            className={`flex flex-col items-center justify-center p-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 ${
              activeView === 'AI_ASSISTANT_EXAM'
                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4 mb-0.5 text-purple-500" />
            <span>AI Kiểm tra</span>
          </button>

          <button
            onClick={() => setActiveView('INTERVENTIONS')}
            className={`flex flex-col items-center justify-center p-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 ${
              activeView === 'INTERVENTIONS'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 mb-0.5" />
            <span>Tín hiệu</span>
          </button>
        </>
      ) : (
        <div className="flex items-center justify-around w-full">
          <button
            onClick={() => setActiveView('LEARNING_CORNER')}
            className={`flex flex-col items-center justify-center p-1 text-[11px] font-medium ${
              activeView === 'LEARNING_CORNER'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5 text-emerald-500" />
            <span>Góc học tập</span>
          </button>

          <button
            onClick={() => setActiveView('AI_ASSISTANT_EXAM')}
            className={`flex flex-col items-center justify-center p-1 text-[11px] font-medium ${
              activeView === 'AI_ASSISTANT_EXAM'
                ? 'text-purple-600 dark:text-purple-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4 mb-0.5 text-purple-500" />
            <span>Kiểm tra</span>
          </button>

          <button
            onClick={() => setActiveView('STUDENT_PORTAL')}
            className={`flex flex-col items-center justify-center p-1 text-[11px] font-medium ${
              activeView === 'STUDENT_PORTAL'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 mb-0.5" />
            <span>Tự kiểm tra</span>
          </button>
        </div>
      )}
    </nav>
  );
};
