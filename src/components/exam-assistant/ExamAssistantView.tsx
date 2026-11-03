import React, { useState } from 'react';
import { Student } from '../../types';
import { ExamPaper } from '../../types/examTypes';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { AIGenerateTab } from './AIGenerateTab';
import { MatrixTab } from './MatrixTab';
import { SpecificationTab } from './SpecificationTab';
import { QuestionBankTab } from './QuestionBankTab';
import { SavedExamsTab } from './SavedExamsTab';
import { AssignedExamsTab } from './AssignedExamsTab';
import { StudentExamTakingTab } from './StudentExamTakingTab';
import { GradingTab } from './GradingTab';
import { AnalyticsTab } from './AnalyticsTab';
import { AIChatTab } from './AIChatTab';
import { ExportModal } from './ExportModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  BrainCircuit,
  Sparkles,
  Layers,
  FileSpreadsheet,
  FileText,
  BookOpen,
  FolderArchive,
  Send,
  FileCheck,
  Award,
  BarChart3,
  MessageSquare,
  Download,
  Save,
  CheckCircle,
} from 'lucide-react';

export type ExamSubMenuKey =
  | 'AI_CREATE'
  | 'MATRIX'
  | 'SPECS'
  | 'QUESTION_BANK'
  | 'SAVED_EXAMS'
  | 'ASSIGNED_EXAMS'
  | 'STUDENT_SUBMISSIONS'
  | 'GRADING'
  | 'ANALYTICS'
  | 'AI_CHAT';

interface ExamAssistantViewProps {
  userRole: 'TEACHER' | 'STUDENT';
  students: Student[];
  currentStudent?: Student;
}

export const ExamAssistantView: React.FC<ExamAssistantViewProps> = ({
  userRole,
  students,
  currentStudent,
}) => {
  const [exams, setExams] = useState<ExamPaper[]>(() => examService.getExams());
  const [selectedExam, setSelectedExam] = useState<ExamPaper>(() => exams[0] || null);

  // Active sub-menu (Default to student taking or teacher creation)
  const [activeTab, setActiveTab] = useState<ExamSubMenuKey>(
    userRole === 'STUDENT' ? 'ASSIGNED_EXAMS' : 'AI_CREATE'
  );

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTargetExam, setExportTargetExam] = useState<ExamPaper | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; title: string } | null>(null);

  // Save changes state feedback
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Chat Context
  const [chatContext, setChatContext] = useState<any>(null);

  const refreshExams = () => {
    const list = examService.getExams();
    setExams(list);
    if (selectedExam) {
      const up = list.find((x) => x.id === selectedExam.id);
      if (up) setSelectedExam(up);
    }
  };

  const handleSaveAllChanges = () => {
    if (!selectedExam) {
      toastService.warning('Chưa có đề kiểm tra nào được chọn để lưu.');
      return;
    }

    // Fully synchronize integrity across questions, specifications, matrix and ratios
    const syncedExam = examService.syncExamIntegrity(selectedExam);

    examService.saveExam(syncedExam);
    setSelectedExam(syncedExam);
    refreshExams();

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedTime(nowStr);
    toastService.success(`Đã lưu thay đổi và đồng bộ thống nhất 100% dữ liệu đề "${syncedExam.title}" (${syncedExam.totalQuestions} câu, ${syncedExam.totalPoints}đ)!`);
  };

  const handleOpenExport = (exam: ExamPaper) => {
    setExportTargetExam(exam);
    setIsExportModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    examService.deleteExam(deleteCandidate.id, userRole === 'TEACHER' ? 'Giáo viên' : 'Học sinh');
    toastService.success(`Đã chuyển đề "${deleteCandidate.title}" vào Thùng rác hệ thống.`);
    setDeleteCandidate(null);
    refreshExams();
  };

  const handleSelectExamToTake = (exam: ExamPaper) => {
    setSelectedExam(exam);
    setActiveTab('STUDENT_SUBMISSIONS');
  };

  const handleSelectExamToGrade = (exam: ExamPaper) => {
    setSelectedExam(exam);
    setActiveTab('GRADING');
  };

  const handleOpenChatWithQuestionContext = (ctx: any) => {
    setChatContext(ctx);
    setActiveTab('AI_CHAT');
    toastService.info(`Đã mở AI Chat giải thích chi tiết câu ${ctx.questionNumber}!`);
  };

  // 9 Canonical Sub-menus + AI Chat as requested:
  const SUB_MENUS: {
    key: ExamSubMenuKey;
    label: string;
    icon: React.ReactNode;
    teacherOnly?: boolean;
  }[] = [
    {
      key: 'AI_CREATE',
      label: '1. AI tạo đề',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      teacherOnly: true,
    },
    {
      key: 'MATRIX',
      label: '2. Ma trận đề',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-500" />,
    },
    {
      key: 'SPECS',
      label: '3. Bản đặc tả',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
    },
    {
      key: 'QUESTION_BANK',
      label: '4. Ngân hàng câu hỏi',
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      teacherOnly: true,
    },
    {
      key: 'SAVED_EXAMS',
      label: '5. Đề đã lưu',
      icon: <FolderArchive className="w-4 h-4 text-purple-600" />,
      teacherOnly: true,
    },
    {
      key: 'ASSIGNED_EXAMS',
      label: '6. Đề đã giao',
      icon: <Send className="w-4 h-4 text-blue-600" />,
    },
    {
      key: 'STUDENT_SUBMISSIONS',
      label: '7. Bài làm học sinh',
      icon: <FileCheck className="w-4 h-4 text-emerald-600" />,
    },
    {
      key: 'GRADING',
      label: '8. Chấm điểm',
      icon: <Award className="w-4 h-4 text-rose-500" />,
    },
    {
      key: 'ANALYTICS',
      label: '9. Phân tích kết quả',
      icon: <BarChart3 className="w-4 h-4 text-indigo-500" />,
    },
    {
      key: 'AI_CHAT',
      label: 'AI Chat Gia sư',
      icon: <MessageSquare className="w-4 h-4 text-teal-500" />,
    },
  ];

  const visibleMenus = SUB_MENUS.filter((m) =>
    m.teacherOnly ? userRole === 'TEACHER' : true
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                AI KIỂM TRA & ĐÁNH GIÁ THÔNG MINH
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                SGK Kết nối tri thức · Đa môn học
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              Hệ thống tạo đề chuẩn yêu cầu từng môn, tự lập Ma trận → Bản đặc tả theo 3 mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG), chấm điểm tự động thang 10,0đ và phân tích cá nhân hóa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {selectedExam && (
            <>
              {lastSavedTime && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã lưu: {lastSavedTime}</span>
                </span>
              )}
              {userRole === 'TEACHER' && (
                <button
                  onClick={handleSaveAllChanges}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-102"
                  title="Lưu lại tất cả nội dung (Đề kiểm tra, Ma trận, Bản đặc tả và Câu hỏi) vào hệ thống"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              )}
              <button
                onClick={() => handleOpenExport(selectedExam)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>Xuất bộ hồ sơ (.doc, .xlsx, PDF)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 9 Sub-menus Horizontal Tab Bar (Scrollable on mobile) */}
      <div className="relative">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none border border-slate-200/60 dark:border-slate-700/60 touch-pan-x overscroll-x-contain">
          {visibleMenus.map((menu) => {
            const isActive = activeTab === menu.key;
            return (
              <button
                key={menu.key}
                onClick={() => setActiveTab(menu.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {menu.icon}
                <span>{menu.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        {/* 1. AI tạo đề */}
        {activeTab === 'AI_CREATE' && (
          <AIGenerateTab
            userRole={userRole}
            onExamGenerated={(newExam) => {
              setSelectedExam(newExam);
              refreshExams();
              setActiveTab('SAVED_EXAMS');
            }}
          />
        )}

        {/* 2. Ma trận đề */}
        {activeTab === 'MATRIX' && selectedExam && (
          <MatrixTab
            currentExam={selectedExam}
            allExams={exams}
            onSelectExam={(e) => setSelectedExam(e)}
            onUpdateExam={(e) => {
              setSelectedExam(e);
              refreshExams();
            }}
            userRole={userRole}
          />
        )}

        {/* 3. Bản đặc tả */}
        {activeTab === 'SPECS' && selectedExam && (
          <SpecificationTab
            currentExam={selectedExam}
            allExams={exams}
            onSelectExam={(e) => setSelectedExam(e)}
            onUpdateExam={(e) => {
              setSelectedExam(e);
              refreshExams();
            }}
            userRole={userRole}
          />
        )}

        {/* 4. Ngân hàng câu hỏi */}
        {activeTab === 'QUESTION_BANK' && (
          <QuestionBankTab
            currentExam={selectedExam}
            onRefreshExam={refreshExams}
            userRole={userRole}
          />
        )}

        {/* 5. Đề đã lưu */}
        {activeTab === 'SAVED_EXAMS' && (
          <SavedExamsTab
            exams={exams}
            currentExam={selectedExam}
            onSelectExam={(e) => setSelectedExam(e)}
            onRefreshExams={refreshExams}
            onOpenExportModal={handleOpenExport}
            onRequestConfirmDelete={(item) => setDeleteCandidate(item)}
            onNavigateToTab={(tabLabel) => {
              if (tabLabel.includes('AI tạo đề')) setActiveTab('AI_CREATE');
              else if (tabLabel.includes('Ma trận')) setActiveTab('MATRIX');
              else if (tabLabel.includes('Bản đặc tả')) setActiveTab('SPECS');
            }}
            userRole={userRole}
          />
        )}

        {/* 6. Đề đã giao */}
        {activeTab === 'ASSIGNED_EXAMS' && (
          <AssignedExamsTab
            exams={exams}
            students={students}
            currentStudent={currentStudent}
            onSelectExamToTake={handleSelectExamToTake}
            onSelectExamToGrade={handleSelectExamToGrade}
            onRefreshExams={refreshExams}
            userRole={userRole}
          />
        )}

        {/* 7. Bài làm học sinh */}
        {activeTab === 'STUDENT_SUBMISSIONS' && (
          <StudentExamTakingTab
            exams={exams}
            students={students}
            currentStudent={currentStudent}
            selectedExam={selectedExam}
            onGradingRequested={handleSelectExamToGrade}
            onOpenChatWithQuestionContext={handleOpenChatWithQuestionContext}
            userRole={userRole}
          />
        )}

        {/* 8. Chấm điểm */}
        {activeTab === 'GRADING' && (
          <GradingTab
            exams={exams}
            students={students}
            currentStudent={currentStudent}
            userRole={userRole}
          />
        )}

        {/* 9. Phân tích kết quả */}
        {activeTab === 'ANALYTICS' && (
          <AnalyticsTab
            exams={exams}
            students={students}
            currentStudent={currentStudent}
            userRole={userRole}
          />
        )}

        {/* 10. AI Chatbot */}
        {activeTab === 'AI_CHAT' && (
          <AIChatTab
            userRole={userRole}
            students={students}
            currentStudent={currentStudent}
            initialContext={chatContext}
          />
        )}
      </div>

      {/* Export Modal */}
      {selectedExam && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          exam={exportTargetExam || selectedExam}
          studentResults={examService.getExamResults()}
          questionBank={examService.getQuestionBank()}
        />
      )}

      {/* Delete Exam Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidate !== null}
        title="Xác nhận xóa đề kiểm tra"
        message={`Bạn có chắc chắn muốn chuyển đề "${deleteCandidate?.title}" vào Thùng rác hệ thống không? Mục này có thể khôi phục lại bất kỳ lúc nào.`}
        confirmText="Chuyển vào Thùng rác"
        cancelText="Hủy bỏ"
        type="DANGER"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
