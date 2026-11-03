/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import {
  Student,
  WeeklyLearningRecord,
  Assignment,
  AssignmentSubmission,
  TeacherObservation,
  RiskSignal,
  InterventionPlan,
  StudentSelfCheck,
  FocusSession,
  AuditLog,
  DataQualityIssue,
} from './types';
import { CURRENT_CLASS } from './data/initialData';
import { Header, ActiveView } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { DemoBanner } from './components/common/DemoBanner';
import { WhyWarningModal } from './components/common/WhyWarningModal';
import { CommandCenterModal } from './components/common/CommandCenterModal';
import { AuditLogModal } from './components/common/AuditLogModal';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { Student360Profile } from './components/student-profile/Student360Profile';
import { AdaptiveInterventionView } from './components/intervention/AdaptiveInterventionView';
import { DataQualityAndImport } from './components/data-center/DataQualityAndImport';
import { ReportBuilderView } from './components/reports/ReportBuilderView';
import { AIPromptBuilder } from './components/prompt-builder/AIPromptBuilder';
import { StudentSelfCheckView } from './components/student-portal/StudentSelfCheckView';
import { LearningCornerView } from './components/learning-corner/LearningCornerView';
import { ExamAssistantView } from './components/exam-assistant/ExamAssistantView';
import { ToastContainer } from './components/common/ToastContainer';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('DASHBOARD');
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU_04');

  // Modals state
  const [whyWarningSignal, setWhyWarningSignal] = useState<RiskSignal | null>(null);
  const [showCommandCenter, setShowCommandCenter] = useState<boolean>(false);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);

  // Core Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [records, setRecords] = useState<WeeklyLearningRecord[]>([]);
  const [observations, setObservations] = useState<TeacherObservation[]>([]);
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [interventions, setInterventions] = useState<InterventionPlan[]>([]);
  const [selfChecks, setSelfChecks] = useState<StudentSelfCheck[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dataIssues, setDataIssues] = useState<DataQualityIssue[]>([]);

  // Load from storage on mount
  const refreshFromStorage = () => {
    setStudents(storageService.getStudents());
    setAssignments(storageService.getAssignments());
    setSubmissions(storageService.getSubmissions());
    setRecords(storageService.getLearningRecords());
    setObservations(storageService.getObservations());
    setSignals(storageService.getSignals());
    setInterventions(storageService.getInterventions());
    setSelfChecks(storageService.getSelfChecks());
    setFocusSessions(storageService.getFocusSessions());
    setAuditLogs(storageService.getAuditLogs());
    setDataIssues(storageService.auditDataQuality());
    setPrivacyMode(storageService.getPrivacyMode());
  };

  useEffect(() => {
    refreshFromStorage();
  }, []);

  const handleTogglePrivacy = () => {
    const nextVal = !privacyMode;
    setPrivacyMode(nextVal);
    storageService.setPrivacyMode(nextVal);
  };

  const handleResetDemo = () => {
    storageService.resetToDemo();
    refreshFromStorage();
    setSelectedStudentId('STU_04');
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setActiveView('STUDENTS');
    storageService.logAction('XEM_DỮ_LIỆU', `Xem hồ sơ chi tiết 360° học sinh ID: ${id}`);
  };

  const handleAddStudent = (newStudent: Student) => {
    storageService.addStudent(newStudent);
    refreshFromStorage();
  };

  const handleAddStudents = (newStudents: Student[]) => {
    storageService.addStudents(newStudents);
    refreshFromStorage();
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    storageService.updateStudent(updatedStudent);
    refreshFromStorage();
  };

  const handleDeleteStudent = (studentId: string) => {
    storageService.deleteStudent(studentId);
    refreshFromStorage();
    if (selectedStudentId === studentId) {
      const remaining = storageService.getStudents();
      setSelectedStudentId(remaining[0]?.id || '');
    }
  };

  const handleSaveRecord = (record: WeeklyLearningRecord) => {
    const existing = records.find((r) => r.id === record.id);
    if (existing) {
      storageService.updateLearningRecord(record);
    } else {
      storageService.addLearningRecord(record);
    }
    refreshFromStorage();
  };

  const handleDeleteRecord = (recordId: string) => {
    storageService.deleteLearningRecord(recordId);
    refreshFromStorage();
  };

  const handleSaveAssignment = (assignment: Assignment) => {
    const existing = assignments.find((a) => a.id === assignment.id);
    if (existing) {
      storageService.updateAssignment(assignment);
    } else {
      storageService.addAssignment(assignment);
    }
    refreshFromStorage();
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    storageService.deleteAssignment(assignmentId);
    refreshFromStorage();
  };

  const handleSaveSubmission = (submission: AssignmentSubmission) => {
    storageService.updateSubmission(submission);
    refreshFromStorage();
  };

  const handleDeleteSubmission = (submissionId: string) => {
    storageService.deleteSubmission(submissionId);
    refreshFromStorage();
  };

  const handleAddObservation = (newObs: Omit<TeacherObservation, 'id'>) => {
    const created: TeacherObservation = {
      ...newObs,
      id: `OBS_${Date.now()}`,
    };
    const updated = [created, ...observations];
    setObservations(updated);
    storageService.saveObservations(updated);
    storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Ghi nhật ký quan sát sư phạm cho học sinh ${newObs.studentId}`);
  };

  const handleUpdateObservation = (obs: TeacherObservation) => {
    storageService.updateObservation(obs);
    refreshFromStorage();
  };

  const handleDeleteObservation = (obsId: string) => {
    storageService.deleteObservation(obsId);
    refreshFromStorage();
  };

  const handleSaveIntervention = (plan: InterventionPlan) => {
    const updated = [plan, ...interventions];
    setInterventions(updated);
    storageService.saveInterventions(updated);
    storageService.logAction('TẠO_KẾ_HOẠCH', `Thiết lập kế hoạch hỗ trợ "${plan.title}" cho học sinh ${plan.studentId}`);
  };

  const handleUpdateIntervention = (plan: InterventionPlan) => {
    storageService.updateIntervention(plan);
    refreshFromStorage();
  };

  const handleDeleteIntervention = (planId: string) => {
    storageService.deleteIntervention(planId);
    refreshFromStorage();
  };

  const handleSaveSignal = (signal: RiskSignal) => {
    const existing = signals.find((s) => s.id === signal.id);
    if (existing) {
      storageService.updateSignal(signal);
    } else {
      storageService.addSignal(signal);
    }
    refreshFromStorage();
  };

  const handleUpdateSignal = (signal: RiskSignal) => {
    storageService.updateSignal(signal);
    refreshFromStorage();
  };

  const handleDeleteSignal = (signalId: string) => {
    storageService.deleteSignal(signalId);
    refreshFromStorage();
  };

  const handleUpdateInterventionStatus = (
    id: string,
    status: InterventionPlan['status'],
    evaluation?: InterventionPlan['evaluationResult'],
    adaptationNotes?: string
  ) => {
    const updated = interventions.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status,
          evaluationResult: evaluation,
          adaptationNotes,
          afterMetrics: item.afterMetrics || {
            onTimeRate: 90,
            participationScore: 4.5,
            overdueCount: 0,
            avgScore: 8.0,
            focusMinutesWeekly: 160,
            capturedDate: new Date().toLocaleDateString('vi-VN'),
          },
        };
      }
      return item;
    });

    setInterventions(updated);
    storageService.saveInterventions(updated);

    // If evaluated as effective, update student status to DA_CAI_THIEN
    const targetPlan = interventions.find((i) => i.id === id);
    if (targetPlan && evaluation === 'HIỆU_QUẢ') {
      const updatedStudents = students.map((s) => {
        if (s.id === targetPlan.studentId) {
          return {
            ...s,
            currentStatus: 'DA_CAI_THIEN' as const,
            warningLevel: 0 as const,
          };
        }
        return s;
      });
      setStudents(updatedStudents);
      storageService.saveStudents(updatedStudents);
    }

    storageService.logAction('ĐIỀU_CHỈNH_HỖ_TRỢ', `Cập nhật trạng thái kế hoạch hỗ trợ ID ${id} sang ${status} (${evaluation || ''})`);
  };

  const handleSaveSelfCheck = (check: StudentSelfCheck) => {
    const updated = [check, ...selfChecks];
    setSelfChecks(updated);
    storageService.saveSelfChecks(updated);
    storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Học sinh gửi phiếu "Em tự kiểm tra tiến độ"`, 'HỌC_SINH', currentStudentForPortal.fullName);
  };

  const handleSaveFocusSession = (session: FocusSession) => {
    const updated = [session, ...focusSessions];
    setFocusSessions(updated);
    storageService.saveFocusSessions(updated);
    storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Học sinh hoàn thành phiên tập trung ${session.taskName} (${session.targetMinutes} phút)`, 'HỌC_SINH', currentStudentForPortal.fullName);
  };

  const currentSelectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentStudentForPortal = students.find((s) => s.id === 'STU_04') || students[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col font-sans transition-colors pb-16 md:pb-0">
      {/* Top Demo Data & Ethics Banner */}
      <DemoBanner
        onResetDemo={handleResetDemo}
        privacyMode={privacyMode}
      />

      {/* Primary Navigation Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenCommandCenter={() => setShowCommandCenter(true)}
        onOpenAuditLogs={() => setShowAuditLogs(true)}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* LEARNING_CORNER: accessible to both TEACHER and STUDENT */}
        {activeView === 'LEARNING_CORNER' && (
          <LearningCornerView
            userRole={userRole}
            students={students}
            currentStudent={currentStudentForPortal}
            onRefreshData={refreshFromStorage}
          />
        )}

        {/* AI_ASSISTANT_EXAM: accessible to both TEACHER and STUDENT */}
        {activeView === 'AI_ASSISTANT_EXAM' && (
          <ExamAssistantView
            userRole={userRole}
            students={students}
            currentStudent={currentStudentForPortal}
          />
        )}

        {/* STUDENT_PORTAL: Em tự kiểm tra tiến độ */}
        {activeView === 'STUDENT_PORTAL' && (
          <StudentSelfCheckView
            currentStudent={currentStudentForPortal}
            assignments={assignments}
            onSaveSelfCheck={handleSaveSelfCheck}
            onSaveFocusSession={handleSaveFocusSession}
            privacyMode={privacyMode}
          />
        )}

        {/* Guard for STUDENT role if on teacher-only view */}
        {userRole === 'STUDENT' &&
          activeView !== 'LEARNING_CORNER' &&
          activeView !== 'AI_ASSISTANT_EXAM' &&
          activeView !== 'STUDENT_PORTAL' && (
            <LearningCornerView
              userRole={userRole}
              students={students}
              currentStudent={currentStudentForPortal}
              onRefreshData={refreshFromStorage}
            />
          )}

        {userRole === 'TEACHER' && (
          <>
            {activeView === 'DASHBOARD' && (
              <TeacherDashboard
                students={students}
                signals={signals}
                interventions={interventions}
                assignments={assignments}
                submissions={submissions}
                records={records}
                dataIssues={dataIssues}
                privacyMode={privacyMode}
                onSelectStudent={handleSelectStudent}
                onOpenWhyWarning={(sig) => setWhyWarningSignal(sig)}
                onOpenInterventions={() => setActiveView('INTERVENTIONS')}
                onOpenDataQuality={() => setActiveView('DATA_QUALITY')}
                onAddStudent={handleAddStudent}
                onAddStudents={handleAddStudents}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onSaveSignal={handleSaveSignal}
                onUpdateSignal={handleUpdateSignal}
                onDeleteSignal={handleDeleteSignal}
                onSaveSubmission={handleSaveSubmission}
              />
            )}

            {activeView === 'STUDENTS' && currentSelectedStudent && (
              <Student360Profile
                student={currentSelectedStudent}
                records={records}
                assignments={assignments}
                submissions={submissions}
                observations={observations}
                signals={signals}
                interventions={interventions}
                selfChecks={selfChecks}
                focusSessions={focusSessions}
                privacyMode={privacyMode}
                onBack={() => setActiveView('DASHBOARD')}
                onOpenWhyWarning={(sig) => setWhyWarningSignal(sig)}
                onAddObservation={handleAddObservation}
                onCreateIntervention={(stuId) => {
                  setSelectedStudentId(stuId);
                  setActiveView('INTERVENTIONS');
                }}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onSaveRecord={handleSaveRecord}
                onDeleteRecord={handleDeleteRecord}
                onSaveAssignment={handleSaveAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onSaveSubmission={handleSaveSubmission}
                onUpdateObservation={handleUpdateObservation}
                onDeleteObservation={handleDeleteObservation}
                onUpdateIntervention={handleUpdateIntervention}
                onDeleteIntervention={handleDeleteIntervention}
                onSaveSignal={handleSaveSignal}
                onUpdateSignal={handleUpdateSignal}
                onDeleteSignal={handleDeleteSignal}
              />
            )}

            {activeView === 'INTERVENTIONS' && (
              <AdaptiveInterventionView
                students={students}
                signals={signals}
                interventions={interventions}
                privacyMode={privacyMode}
                onSaveIntervention={handleSaveIntervention}
                onUpdateIntervention={handleUpdateIntervention}
                onDeleteIntervention={handleDeleteIntervention}
                onUpdateInterventionStatus={handleUpdateInterventionStatus}
              />
            )}

            {activeView === 'DATA_QUALITY' && (
              <DataQualityAndImport
                issues={dataIssues}
                students={students}
                privacyMode={privacyMode}
                onRefreshData={refreshFromStorage}
                onResetDemo={handleResetDemo}
              />
            )}

            {activeView === 'REPORTS' && (
              <ReportBuilderView
                classroom={CURRENT_CLASS}
                students={students}
                records={records}
                signals={signals}
                interventions={interventions}
                privacyMode={privacyMode}
              />
            )}

            {activeView === 'PROMPT_BUILDER' && (
              <AIPromptBuilder
                students={students}
                privacyMode={privacyMode}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        userRole={userRole}
      />

      {/* Why Warning Modal ("Tại sao tôi nhận được cảnh báo này?") */}
      {whyWarningSignal && (
        <WhyWarningModal
          signal={whyWarningSignal}
          student={students.find((s) => s.id === whyWarningSignal.studentId) || currentSelectedStudent}
          privacyMode={privacyMode}
          onClose={() => setWhyWarningSignal(null)}
          onAcceptSignal={() => {
            handleSaveIntervention({
              id: `INT_${Date.now()}`,
              studentId: whyWarningSignal.studentId,
              title: `Kế hoạch hỗ trợ: ${whyWarningSignal.title}`,
              goal: 'Nâng tỷ lệ nộp bài đúng hạn lên >= 75% sau 2 tuần',
              targetArea: 'CHIA_NHỎ_NHIỆM_VỤ',
              strategyDescription: 'Chia bài tập 45 phút thành 3 chặng 15 phút. Thiết lập nhắc hẹn trước 18h ngày nộp.',
              microTasks: [
                'Chặng 1: Đọc đề bài và viết 2 câu mở ý (15 phút)',
                'Chặng 2: Hoàn thành phần thân bài cơ bản (20 phút)',
                'Chặng 3: Rà soát lỗi và nộp bản sơ thảo (15 phút)',
              ],
              startDate: new Date().toLocaleDateString('vi-VN'),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
              durationWeeks: 2,
              teacherInCharge: 'ThS. Nguyễn Hoàng Nam',
              targetIndicator: 'Tỷ lệ nộp bài đúng hạn',
              successCriteria: 'Không còn nhiệm vụ quá hạn',
              status: 'ĐANG_THỰC_HIỆN',
              beforeMetrics: {
                onTimeRate: 25,
                participationScore: 2.0,
                overdueCount: 2,
                avgScore: 6.5,
                focusMinutesWeekly: 60,
                capturedDate: new Date().toLocaleDateString('vi-VN'),
              },
            });
            setWhyWarningSignal(null);
            setActiveView('INTERVENTIONS');
          }}
          onRejectSignal={() => {
            storageService.logAction('TỪ_CHỐI_ĐỀ_XUẤT_AI', `Giáo viên bỏ qua tín hiệu ${whyWarningSignal.id} do có lý do sức khỏe/chính đáng`);
            setWhyWarningSignal(null);
          }}
        />
      )}

      {/* Command Center Modal ("Bạn muốn làm gì?") */}
      {showCommandCenter && (
        <CommandCenterModal
          onClose={() => setShowCommandCenter(false)}
          onNavigate={(view, stuId) => {
            if (stuId) setSelectedStudentId(stuId);
            setActiveView(view);
          }}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditLogs && (
        <AuditLogModal
          logs={auditLogs}
          onClose={() => setShowAuditLogs(false)}
        />
      )}
      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
