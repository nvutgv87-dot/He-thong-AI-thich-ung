/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Activity,
  CheckCircle,
  Clock,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Target,
  Calendar,
  HelpCircle,
  Plus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
} from 'lucide-react';
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
  WARNING_LEVEL_DEFINITIONS,
  StudentStatus,
  WarningLevel,
} from '../../types';

interface Student360ProfileProps {
  student: Student;
  records: WeeklyLearningRecord[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  observations: TeacherObservation[];
  signals: RiskSignal[];
  interventions: InterventionPlan[];
  selfChecks: StudentSelfCheck[];
  focusSessions: FocusSession[];
  privacyMode: boolean;
  onBack: () => void;
  onOpenWhyWarning: (signal: RiskSignal) => void;
  onAddObservation: (obs: Omit<TeacherObservation, 'id'>) => void;
  onCreateIntervention: (studentId: string) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onSaveRecord: (record: WeeklyLearningRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onSaveAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onSaveSubmission: (submission: AssignmentSubmission) => void;
  onUpdateObservation: (observation: TeacherObservation) => void;
  onDeleteObservation: (observationId: string) => void;
  onUpdateIntervention: (plan: InterventionPlan) => void;
  onDeleteIntervention: (planId: string) => void;
  onSaveSignal?: (signal: RiskSignal) => void;
  onUpdateSignal?: (signal: RiskSignal) => void;
  onDeleteSignal: (signalId: string) => void;
}

type ProfileTab =
  | 'OVERVIEW'
  | 'PROGRESS'
  | 'PARTICIPATION'
  | 'ASSIGNMENTS'
  | 'DELAY'
  | 'OBSERVATIONS'
  | 'SIGNALS'
  | 'INTERVENTIONS'
  | 'FEEDBACK'
  | 'ADVANCEMENT'
  | 'GOALS'
  | 'TIMELINE';

export const Student360Profile: React.FC<Student360ProfileProps> = ({
  student,
  records,
  assignments,
  submissions,
  observations,
  signals,
  interventions,
  selfChecks,
  focusSessions,
  privacyMode,
  onBack,
  onOpenWhyWarning,
  onAddObservation,
  onCreateIntervention,
  onUpdateStudent,
  onDeleteStudent,
  onSaveRecord,
  onDeleteRecord,
  onSaveAssignment,
  onDeleteAssignment,
  onSaveSubmission,
  onUpdateObservation,
  onDeleteObservation,
  onUpdateIntervention,
  onDeleteIntervention,
  onSaveSignal,
  onUpdateSignal,
  onDeleteSignal,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('OVERVIEW');

  // Modals for editing
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] = useState(false);

  // Signal edit & add state
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState<RiskSignal | null>(null);
  const [signalTitle, setSignalTitle] = useState('');
  const [signalType, setSignalType] = useState<RiskSignal['type']>('TRÌ_HOÃN_NHIỆM_VỤ');
  const [signalLevel, setSignalLevel] = useState<RiskSignal['level']>(2);
  const [signalFrequency, setSignalFrequency] = useState<RiskSignal['frequency']>('LẶP_LẠI');
  const [signalConfidence, setSignalConfidence] = useState<number>(85);
  const [signalStatus, setSignalStatus] = useState<RiskSignal['status']>('CHỜ_XÁC_NHẬN');
  const [signalWhatIsChanging, setSignalWhatIsChanging] = useState('');
  const [signalIndicatorName, setSignalIndicatorName] = useState('Tỷ lệ nộp bài đúng hạn');
  const [signalDelta, setSignalDelta] = useState('-30% so với baseline');
  const [signalHypothesis, setSignalHypothesis] = useState('');

  // Observation state
  const [showObsModal, setShowObsModal] = useState(false);
  const [editingObs, setEditingObs] = useState<TeacherObservation | null>(null);
  const [newObsContext, setNewObsContext] = useState<TeacherObservation['context']>('TRONG_LỚP');
  const [newObsLesson, setNewObsLesson] = useState('');
  const [newObsDesc, setNewObsDesc] = useState('');
  const [newObsBehaviors, setNewObsBehaviors] = useState('');

  // Record edit/add state
  const [editingRecord, setEditingRecord] = useState<WeeklyLearningRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Assignment edit/add state
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Submission edit state
  const [editingSubmission, setEditingSubmission] = useState<{ sub: AssignmentSubmission; asn: Assignment } | null>(null);

  // Intervention edit state
  const [editingPlan, setEditingPlan] = useState<InterventionPlan | null>(null);

  // Goal edit state
  const [newGoalText, setNewGoalText] = useState('');

  // Item deletion state for safe in-app confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{ type: string; title: string; onConfirm: () => void } | null>(null);

  // Edit student form state
  const [editFullName, setEditFullName] = useState(student.fullName);
  const [editCode, setEditCode] = useState(student.code);
  const [editBirthDate, setEditBirthDate] = useState(student.birthDate);
  const [editGender, setEditGender] = useState(student.gender);
  const [editStatus, setEditStatus] = useState<StudentStatus>(student.currentStatus);
  const [editWarningLevel, setEditWarningLevel] = useState<WarningLevel>(student.warningLevel);
  const [editBaselineAvgScore, setEditBaselineAvgScore] = useState(student.baseline.avgScore);
  const [editBaselineOnTimeRate, setEditBaselineOnTimeRate] = useState(student.baseline.onTimeRate);
  const [editBaselineParticipation, setEditBaselineParticipation] = useState(student.baseline.participationScore);
  const [editHabits, setEditHabits] = useState(student.profile.taskCompletionHabits);
  const [editNotes, setEditNotes] = useState(student.notes || '');

  const displayName = privacyMode ? student.code : student.fullName;
  const levelMeta = WARNING_LEVEL_DEFINITIONS[student.warningLevel];

  const studentRecords = records
    .filter((r) => r.studentId === student.id)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  const studentSubmissions = submissions.filter((s) => s.studentId === student.id);
  const studentObservations = observations.filter((o) => o.studentId === student.id);
  const studentSignals = signals.filter((s) => s.studentId === student.id);
  const studentInterventions = interventions.filter((i) => i.studentId === student.id);
  const studentSelfChecks = selfChecks.filter((sc) => sc.studentId === student.id);
  const studentFocusSessions = focusSessions.filter((fs) => fs.studentId === student.id);

  // Save Observation (Create or Update)
  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObsDesc.trim()) return;

    if (editingObs) {
      onUpdateObservation({
        ...editingObs,
        lessonName: newObsLesson,
        context: newObsContext,
        neutralDescription: newObsDesc,
        observedBehaviors: newObsBehaviors.split(',').map((b) => b.trim()).filter(Boolean),
      });
      setEditingObs(null);
    } else {
      onAddObservation({
        studentId: student.id,
        date: new Date().toLocaleDateString('vi-VN'),
        lessonName: newObsLesson || 'Tiết học trên lớp',
        context: newObsContext,
        neutralDescription: newObsDesc,
        observedBehaviors: newObsBehaviors.split(',').map((b) => b.trim()).filter(Boolean),
        followUpRecommended: true,
      });
    }

    setNewObsDesc('');
    setNewObsLesson('');
    setNewObsBehaviors('');
    setShowObsModal(false);
  };

  // Open Edit Observation
  const handleOpenEditObs = (obs: TeacherObservation) => {
    setEditingObs(obs);
    setNewObsContext(obs.context);
    setNewObsLesson(obs.lessonName);
    setNewObsDesc(obs.neutralDescription);
    setNewObsBehaviors(obs.observedBehaviors.join(', '));
    setShowObsModal(true);
  };

  // Save Student Profile Edits
  const handleSaveStudentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Student = {
      ...student,
      fullName: editFullName,
      code: editCode,
      birthDate: editBirthDate,
      gender: editGender,
      currentStatus: editStatus,
      warningLevel: editWarningLevel,
      notes: editNotes,
      baseline: {
        ...student.baseline,
        avgScore: Number(editBaselineAvgScore),
        onTimeRate: Number(editBaselineOnTimeRate),
        participationScore: Number(editBaselineParticipation),
      },
      profile: {
        ...student.profile,
        taskCompletionHabits: editHabits,
        lastUpdated: new Date().toLocaleDateString('vi-VN'),
      },
      lastDataUpdate: new Date().toLocaleDateString('vi-VN'),
    };
    onUpdateStudent(updated);
    setShowEditStudentModal(false);
  };

  // Save Learning Record
  const handleSaveLearningRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onSaveRecord(editingRecord);
    setShowRecordModal(false);
    setEditingRecord(null);
  };

  // Save Assignment
  const handleSaveAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    onSaveAssignment(editingAssignment);
    setShowAssignmentModal(false);
    setEditingAssignment(null);
  };

  // Save Submission
  const handleSaveSubmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;
    onSaveSubmission(editingSubmission.sub);
    setEditingSubmission(null);
  };

  // Save Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const updatedGoals = [...student.profile.personalGoals, newGoalText.trim()];
    onUpdateStudent({
      ...student,
      profile: {
        ...student.profile,
        personalGoals: updatedGoals,
      },
    });
    setNewGoalText('');
  };

  const handleDeleteGoal = (idx: number) => {
    const updatedGoals = student.profile.personalGoals.filter((_, i) => i !== idx);
    onUpdateStudent({
      ...student,
      profile: {
        ...student.profile,
        personalGoals: updatedGoals,
      },
    });
  };

  const TABS: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW', label: '1. Tổng quan', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'PROGRESS', label: '2. Tiến độ học tập', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'PARTICIPATION', label: '3. Mức độ tham gia', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'ASSIGNMENTS', label: '4. Hoàn thành nhiệm vụ', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { id: 'DELAY', label: '5. Trì hoãn nhiệm vụ', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'OBSERVATIONS', label: '6. Nhật ký quan sát', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'SIGNALS', label: '7. Tín hiệu cảnh báo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'INTERVENTIONS', label: '8. Kế hoạch hỗ trợ', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'FEEDBACK', label: '9. Phản hồi', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'ADVANCEMENT', label: '10. Tiến bộ (Trước/Sau)', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'GOALS', label: '11. Mục tiêu cá nhân', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'TIMELINE', label: '12. Timeline', icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tổng quan</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Mã hóa định danh:</span>
          <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {student.code}
          </span>
        </div>
      </div>

      {/* Student Banner Header with Edit & Delete */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base">
            {student.code}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${levelMeta.badgeBg}`}>
                {levelMeta.name}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
              <span>Lớp: {student.classId?.replace('LOP_', '') || 'Lớp'}</span>
              <span>·</span>
              <span>Giới tính: {student.gender}</span>
              <span>·</span>
              <span>Ngày sinh: {student.birthDate}</span>
              <span>·</span>
              <span>Cập nhật: {student.lastDataUpdate}</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons (Edit Profile, Delete, Add Obs, Intervene) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditFullName(student.fullName);
              setEditCode(student.code);
              setEditBirthDate(student.birthDate);
              setEditGender(student.gender);
              setEditStatus(student.currentStatus);
              setEditWarningLevel(student.warningLevel);
              setEditBaselineAvgScore(student.baseline.avgScore);
              setEditBaselineOnTimeRate(student.baseline.onTimeRate);
              setEditBaselineParticipation(student.baseline.participationScore);
              setEditHabits(student.profile.taskCompletionHabits);
              setEditNotes(student.notes || '');
              setShowEditStudentModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Chỉnh sửa hồ sơ</span>
          </button>

          <button
            onClick={() => {
              setEditingObs(null);
              setNewObsLesson('');
              setNewObsDesc('');
              setNewObsBehaviors('');
              setShowObsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm quan sát</span>
          </button>

          <button
            onClick={() => onCreateIntervention(student.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors shadow-xs"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Tạo can thiệp</span>
          </button>

          <button
            onClick={() => setShowDeleteStudentConfirm(true)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
            title="Xóa học sinh này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar: 1. Tổng quan ... 9. Phản hồi */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl flex items-center gap-1 overflow-x-auto text-xs scrollbar-none border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Baseline Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-500">
                Baseline cá nhân ({student.baseline.recordedPeriod})
              </h3>
              <button
                onClick={() => setShowEditStudentModal(true)}
                className="text-blue-600 hover:underline text-[11px] font-medium cursor-pointer"
              >
                Chỉnh sửa
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Điểm trung bình cơ sở:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.baseline.avgScore}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tỷ lệ đúng hạn cơ sở:</span>
                <span className="font-mono font-bold text-emerald-600">{student.baseline.onTimeRate}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mức tham gia trung bình:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.baseline.participationScore}/5</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Thời lượng tập trung:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student.baseline.focusMinutesAvg} phút/buổi</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px]">
              Baseline là thước đo so sánh độc lập của học sinh với chính mình, không dùng để xếp hạng với các bạn khác.
            </div>
          </div>

          {/* Learning Habits Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-500">
              Hồ sơ Học tập Động (Learning Profile)
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Thói quen làm bài:</span>
                <p className="text-slate-500 mt-0.5">{student.profile.taskCompletionHabits}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Phong cách tương tác:</span>
                <p className="text-slate-500 mt-0.5">{student.profile.participationStyle}</p>
              </div>
              <div>
                <span className="font-medium text-emerald-600">Chiến lược đã hiệu quả:</span>
                <p className="text-slate-500 mt-0.5">{student.profile.effectiveStrategies.join(', ') || 'Chưa ghi nhận'}</p>
              </div>
            </div>
          </div>

          {/* Quick Signal & Intervention Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-500">
              Trạng thái Tín hiệu & Can thiệp
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tín hiệu đang ghi nhận:</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentSignals.length} tín hiệu</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Kế hoạch hỗ trợ:</span>
                <span className="font-bold text-blue-600">{studentInterventions.length} kế hoạch</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Phiếu tự kiểm tra (Self-check):</span>
                <span className="font-bold text-slate-900 dark:text-white">{studentSelfChecks.length} phiếu</span>
              </div>
            </div>

            {studentSignals.length > 0 && (
              <button
                onClick={() => onOpenWhyWarning(studentSignals[0])}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tại sao có cảnh báo?</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: PROGRESS (Tiến độ học tập with Add, Edit, Delete) */}
      {activeTab === 'PROGRESS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Bảng điểm quá trình & Điểm kiểm tra theo tuần
            </h3>
            <button
              onClick={() => {
                setEditingRecord({
                  id: `LR_${Date.now()}`,
                  studentId: student.id,
                  weekNumber: (studentRecords[studentRecords.length - 1]?.weekNumber || 0) + 1,
                  academicWeek: `Tuần ${(studentRecords[studentRecords.length - 1]?.weekNumber || 0) + 1}`,
                  testScore: 8.0,
                  processScore: 8.0,
                  participationLevel: 4,
                  tasksAssigned: 4,
                  tasksCompletedOnTime: 4,
                  tasksCompletedLate: 0,
                  tasksOverdue: 0,
                  reminderCount: 0,
                  focusMinutesLogged: 120,
                });
                setShowRecordModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bản ghi tuần mới</span>
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Tuần học</th>
                  <th className="py-2.5 px-3">Điểm KT</th>
                  <th className="py-2.5 px-3">Điểm QT</th>
                  <th className="py-2.5 px-3">Giao</th>
                  <th className="py-2.5 px-3">Đúng hạn</th>
                  <th className="py-2.5 px-3">Muộn/Quá hạn</th>
                  <th className="py-2.5 px-3">Số lần nhắc</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{r.academicWeek}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.testScore}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{r.processScore}</td>
                    <td className="py-2.5 px-3 font-mono">{r.tasksAssigned}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">{r.tasksCompletedOnTime}</td>
                    <td className="py-2.5 px-3 font-mono text-rose-600">{r.tasksCompletedLate + r.tasksOverdue}</td>
                    <td className="py-2.5 px-3 font-mono">{r.reminderCount}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingRecord({ ...r });
                            setShowRecordModal(true);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Chỉnh sửa bản ghi này"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete({
                              type: 'Bản ghi học tập tuần',
                              title: r.academicWeek,
                              onConfirm: () => onDeleteRecord(r.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: PARTICIPATION (Mức độ tham gia) */}
      {activeTab === 'PARTICIPATION' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Theo dõi mức độ tương tác & thời lượng tập trung
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Baseline tham gia: {student.baseline.participationScore}/5
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {studentRecords.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {r.academicWeek}
                </div>
                <div className="text-xs text-slate-500">
                  Mức tham gia: <strong className="font-mono text-blue-600">{r.participationLevel}/5</strong>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Thời lượng tập trung: <strong className="font-mono text-slate-800 dark:text-slate-200">{r.focusMinutesLogged} phút</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: ASSIGNMENTS (with Add, Edit, Delete Assignment & Submissions) */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Lịch sử nộp bài tập & nhiệm vụ được giao
            </h3>
            <button
              onClick={() => {
                setEditingAssignment({
                  id: `ASN_${Date.now()}`,
                  classId: student.classId,
                  subject: 'Hóa học',
                  title: '',
                  assignedDate: new Date().toLocaleDateString('vi-VN'),
                  dueDate: new Date(Date.now() + 4 * 86400000).toLocaleDateString('vi-VN'),
                  estimatedMinutes: 45,
                  type: 'BÀI_TẬP_VỀ_NHÀ',
                  maxScore: 10,
                });
                setShowAssignmentModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao bài tập mới</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {assignments.map((asn) => {
              const sub = studentSubmissions.find((s) => s.assignmentId === asn.id) || {
                id: `SUB_${asn.id}_${student.id}`,
                assignmentId: asn.id,
                studentId: student.id,
                submittedAt: null,
                status: 'CHƯA_NỘP' as const,
                delayHours: 0,
                extensionCount: 0,
                reminderCount: 0,
              };

              return (
                <div key={asn.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{asn.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({asn.type})</span>
                    </div>
                    <div className="text-slate-500">
                      Giao: {asn.assignedDate} · Hạn: {asn.dueDate} · {asn.estimatedMinutes} phút
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded font-medium ${
                      sub?.status === 'ĐÚNG_HẠN'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : sub?.status === 'MUỘN'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    }`}>
                      {sub?.status}
                    </span>

                    {sub?.score !== undefined && (
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{sub.score} đ</span>
                    )}

                    <button
                      onClick={() => setEditingSubmission({ sub: { ...sub }, asn })}
                      className="px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/60 rounded hover:bg-blue-100 cursor-pointer"
                      title="Chấm điểm hoặc cập nhật tình trạng bài nộp"
                    >
                      Chấm điểm/Cập nhật
                    </button>

                    <button
                      onClick={() => {
                        setEditingAssignment({ ...asn });
                        setShowAssignmentModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Sửa thông tin bài tập"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setItemToDelete({
                          type: 'Bài tập',
                          title: asn.title,
                          onConfirm: () => onDeleteAssignment(asn.id),
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa bài tập"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: DELAY */}
      {activeTab === 'DELAY' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Phân tích thói quen và xu hướng hoàn thành nhiệm vụ
          </h3>
          <p className="text-slate-500">
            Hệ thống nhận diện các biểu hiện như: bắt đầu sát hạn nộp, tỷ lệ nộp bài sau 23h, 
            hoặc chia nhỏ bài tập. Không sử dụng định kiến để đánh giá học sinh.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500">Độ trễ trung bình</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {student.baseline.avgDelayHours} giờ
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500">Số lần xin gia hạn</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {studentSubmissions.reduce((a, b) => a + b.extensionCount, 0)} lần
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500">Số lần cần giáo viên nhắc</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                {studentSubmissions.reduce((a, b) => a + b.reminderCount, 0)} lần
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: OBSERVATIONS (with Edit & Delete) */}
      {activeTab === 'OBSERVATIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Nhật ký quan sát hành vi trung tính của giáo viên
            </h3>
            <button
              onClick={() => {
                setEditingObs(null);
                setNewObsLesson('');
                setNewObsDesc('');
                setNewObsBehaviors('');
                setShowObsModal(true);
              }}
              className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/60 rounded-md hover:bg-blue-100 cursor-pointer"
            >
              + Ghi nhật ký mới
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {studentObservations.length === 0 ? (
              <div className="text-slate-400 py-4 text-center">Chưa có ghi chú quan sát nào.</div>
            ) : (
              studentObservations.map((obs) => (
                <div key={obs.id} className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{obs.lessonName}</span>
                    <div className="flex items-center gap-2">
                      <span>{obs.date} · {obs.context}</span>
                      <button
                        onClick={() => handleOpenEditObs(obs)}
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Sửa nhật ký"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            type: 'Nhật ký quan sát',
                            title: `${obs.lessonName} (${obs.date})`,
                            onConfirm: () => onDeleteObservation(obs.id),
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Xóa nhật ký"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{obs.neutralDescription}</p>
                  {obs.observedBehaviors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-slate-500">
                      <span>Chỉ báo quan sát:</span>
                      {obs.observedBehaviors.map((b, i) => (
                        <span key={i} className="text-slate-700 dark:text-slate-300">· {b}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 7: SIGNALS (with Add, Edit, Delete) */}
      {activeTab === 'SIGNALS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Các tín hiệu quan sát thích ứng của {student.fullName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Phát hiện dựa trên độ lệch so với Baseline cá nhân. Giáo viên có thể tùy chỉnh hoặc thêm mới.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSignal(null);
                setSignalTitle(`Tín hiệu theo dõi: ${student.fullName}`);
                setSignalType('TRÌ_HOÃN_NHIỆM_VỤ');
                setSignalLevel(2);
                setSignalFrequency('LẶP_LẠI');
                setSignalConfidence(85);
                setSignalStatus('CHỜ_XÁC_NHẬN');
                setSignalWhatIsChanging(`Tỷ lệ nộp bài đúng hạn của ${student.fullName} giảm so với baseline ${student.baseline.onTimeRate}%`);
                setSignalIndicatorName('Tỷ lệ nộp bài đúng hạn');
                setSignalDelta('-30%');
                setSignalHypothesis('Khó khăn khi xử lý bài tập dài, cần chia nhỏ chặng 15 phút');
                setShowSignalModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm tín hiệu mới</span>
            </button>
          </div>

          {studentSignals.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Không có tín hiệu cảnh báo nào. Học sinh duy trì phong độ ổn định theo baseline.
            </div>
          ) : (
            studentSignals.map((sig) => (
              <div key={sig.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    {sig.title}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${WARNING_LEVEL_DEFINITIONS[sig.level].badgeBg}`}>
                      {WARNING_LEVEL_DEFINITIONS[sig.level].name}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSignal(sig);
                        setSignalTitle(sig.title);
                        setSignalType(sig.type);
                        setSignalLevel(sig.level);
                        setSignalFrequency(sig.frequency);
                        setSignalConfidence(sig.confidenceScore);
                        setSignalStatus(sig.status);
                        setSignalWhatIsChanging(sig.explanation.whatIsChanging);
                        const primary = sig.evidence.primaryIndicators[0];
                        setSignalIndicatorName(primary?.indicatorName || 'Tỷ lệ nộp bài đúng hạn');
                        setSignalDelta(primary?.delta || '-25%');
                        setSignalHypothesis(sig.explanation.potentialContextFactors[0] || '');
                        setShowSignalModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                      title="Chỉnh sửa tín hiệu này"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({
                          type: 'Tín hiệu cảnh báo',
                          title: sig.title,
                          onConfirm: () => onDeleteSignal(sig.id),
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa tín hiệu cảnh báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{sig.explanation.whatIsChanging}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Độ tin cậy: {sig.confidenceScore}% · Trạng thái: <strong>{sig.status}</strong></span>
                  <button
                    onClick={() => onOpenWhyWarning(sig)}
                    className="flex items-center gap-1 text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Xem giải thích đầy đủ "Tại sao có cảnh báo?"</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 8: INTERVENTIONS (with Edit & Delete) */}
      {activeTab === 'INTERVENTIONS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Kế hoạch can thiệp cá nhân hóa thích ứng
            </h3>
            <button
              onClick={() => onCreateIntervention(student.id)}
              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer"
            >
              + Tạo kế hoạch mới
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {studentInterventions.length === 0 ? (
              <div className="text-slate-400 py-6 text-center">Chưa có kế hoạch hỗ trợ nào cho học sinh này.</div>
            ) : (
              studentInterventions.map((plan) => (
                <div key={plan.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{plan.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {plan.status}
                      </span>
                      <button
                        onClick={() => setEditingPlan({ ...plan })}
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Sửa kế hoạch can thiệp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            type: 'Kế hoạch can thiệp',
                            title: plan.title,
                            onConfirm: () => onDeleteIntervention(plan.id),
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Xóa kế hoạch can thiệp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{plan.goal}</div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Các bước chia nhỏ (Micro-tasks):</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      {plan.microTasks.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-slate-500 flex items-center justify-between pt-1">
                    <span>Thời lượng: {plan.durationWeeks} tuần</span>
                    <span>Phụ trách: {plan.teacherInCharge}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 9: FEEDBACK */}
      {activeTab === 'FEEDBACK' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Phản hồi 2 chiều: Giáo viên & Học sinh
          </h3>
          {studentInterventions.map((plan) => (
            <div key={plan.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="font-semibold text-slate-900 dark:text-white">{plan.title}</div>
              {plan.studentFeedback ? (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">Phản hồi từ học sinh:</div>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">"{plan.studentFeedback.comment}"</p>
                  <div className="mt-1 text-emerald-700 text-[11px]">
                    Độ khó: {plan.studentFeedback.easeOfExecution} · Mức hữu ích: {plan.studentFeedback.helpfulness}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">Chưa nhận được phản hồi từ học sinh cho kế hoạch này.</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 10: ADVANCEMENT */}
      {activeTab === 'ADVANCEMENT' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Đối chiếu số liệu Định lượng: Trước vs Sau Can thiệp
          </h3>
          {studentInterventions.map((plan) => (
            <div key={plan.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="font-semibold text-slate-900 dark:text-white">{plan.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <div className="font-semibold text-rose-800 dark:text-rose-300 mb-1">Trước can thiệp</div>
                  <div>Tỷ lệ đúng hạn: <strong className="font-mono">{plan.beforeMetrics.onTimeRate}%</strong></div>
                  <div>Nhiệm vụ quá hạn: <strong className="font-mono">{plan.beforeMetrics.overdueCount} bài</strong></div>
                  <div>Mức tham gia: <strong className="font-mono">{plan.beforeMetrics.participationScore}/5</strong></div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Sau can thiệp</div>
                  <div>Tỷ lệ đúng hạn: <strong className="font-mono">{plan.afterMetrics?.onTimeRate ?? 'Đang thực hiện...'}%</strong></div>
                  <div>Nhiệm vụ quá hạn: <strong className="font-mono">{plan.afterMetrics?.overdueCount ?? 0} bài</strong></div>
                  <div>Mức tham gia: <strong className="font-mono">{plan.afterMetrics?.participationScore ?? 4.5}/5</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 11: GOALS (with Add & Delete) */}
      {activeTab === 'GOALS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Mục tiêu học tập cá nhân của học sinh
          </h3>
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <input
              type="text"
              placeholder="Thêm mục tiêu cá nhân mới..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer"
            >
              Thêm mục tiêu
            </button>
          </form>

          <div className="space-y-2">
            {student.profile.personalGoals.map((goal, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">{goal}</span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Xóa mục tiêu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 12: TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Dòng thời gian tiến trình học tập & can thiệp thích ứng
          </h3>
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900"></div>
              <div className="font-semibold text-slate-900 dark:text-white">Tuần 1 - 2: Thiết lập Baseline</div>
              <p className="text-slate-500 mt-0.5">Thu thập 4 bài tập cơ sở, chuẩn hóa nhịp độ làm bài.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-500 border-4 border-white dark:border-slate-900"></div>
              <div className="font-semibold text-slate-900 dark:text-white">Tuần 3 - 4: Tín hiệu & Quyết định sư phạm</div>
              <p className="text-slate-500 mt-0.5">Thuật toán ghi nhận độ lệch, giáo viên kiểm tra và thống nhất kế hoạch hỗ trợ.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900"></div>
              <div className="font-semibold text-slate-900 dark:text-white">Tuần 5 trở đi: Thích ứng & Tự quản</div>
              <p className="text-slate-500 mt-0.5">Đo lường sau can thiệp, chuyển giao quyền tự quản cho học sinh.</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Profile Modal */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Chỉnh sửa thông tin học sinh
              </h3>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Họ và tên:</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Mã học sinh:</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Ngày sinh:</label>
                  <input
                    type="text"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Giới tính:</label>
                  <select
                    value={editGender}
                    onChange={(e: any) => setEditGender(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Trạng thái quan sát:</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option value="ON_DINH">ỔN ĐỊNH</option>
                    <option value="CAN_QUAN_SAT">CẦN QUAN SÁT</option>
                    <option value="CAN_HO_TRO">CẦN HỖ TRỢ</option>
                    <option value="DANG_THEO_DOI">ĐANG THEO DÕI</option>
                    <option value="DA_CAI_THIEN">ĐÃ CẢI THIỆN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Mức cảnh báo (0-3):</label>
                  <select
                    value={editWarningLevel}
                    onChange={(e: any) => setEditWarningLevel(Number(e.target.value) as WarningLevel)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option value={0}>Mức 0 - Ổn định</option>
                    <option value={1}>Mức 1 - Theo dõi</option>
                    <option value={2}>Mức 2 - Cần hỗ trợ</option>
                    <option value={3}>Mức 3 - Cần trao đổi</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Baseline cá nhân:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500">Đúng hạn (%):</label>
                    <input
                      type="number"
                      value={editBaselineOnTimeRate}
                      onChange={(e) => setEditBaselineOnTimeRate(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Điểm TB (0-10):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editBaselineAvgScore}
                      onChange={(e) => setEditBaselineAvgScore(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Tham gia (1-5):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editBaselineParticipation}
                      onChange={(e) => setEditBaselineParticipation(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Thói quen hoàn thành bài tập:</label>
                <input
                  type="text"
                  value={editHabits}
                  onChange={(e) => setEditHabits(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Ghi chú sư phạm:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {showDeleteStudentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              Xác nhận xóa hồ sơ học sinh
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh <strong>{student.fullName} ({student.code})</strong>?
              Thao tác này sẽ xóa đồng thời toàn bộ bài nộp, nhật ký quan sát, tín hiệu cảnh báo và kế hoạch hỗ trợ liên quan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteStudentConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(student.id);
                  setShowDeleteStudentConfirm(false);
                  onBack();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal (Add or Edit) */}
      {showObsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingObs ? 'Chỉnh sửa nhật ký quan sát' : 'Ghi nhật ký quan sát sư phạm'}
              </h3>
              <button onClick={() => setShowObsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Bối cảnh quan sát:</label>
                <select
                  value={newObsContext}
                  onChange={(e: any) => setNewObsContext(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                >
                  <option value="TRONG_LỚP">Trong tiết học trên lớp</option>
                  <option value="BÀI_TẬP_VỀ_NHÀ">Bài tập tự học ở nhà</option>
                  <option value="HOẠT_ĐỘNG_NHÓM">Hoạt động làm việc nhóm</option>
                  <option value="THỰC_HÀNH">Tiết thực hành / bài tập</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Tên bài học / Tiết:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đại số chương 2 - Tiết 14"
                  value={newObsLesson}
                  onChange={(e) => setNewObsLesson(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Mô tả hành vi quan sát được (Không gán nhãn):</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể thời gian, hành vi bắt đầu làm bài, giơ tay phát biểu..."
                  value={newObsDesc}
                  onChange={(e) => setNewObsDesc(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Các chỉ báo cụ thể (cách nhau bằng dấu phẩy):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chưa bắt đầu viết câu 1 trong 10 phút, Ngại phát biểu trước lớp"
                  value={newObsBehaviors}
                  onChange={(e) => setNewObsBehaviors(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium cursor-pointer"
                >
                  {editingObs ? 'Cập nhật nhật ký' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Modal (Add or Edit) */}
      {showRecordModal && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Thông tin bản ghi học tập tuần
            </h3>
            <form onSubmit={handleSaveLearningRecord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Tuần số:</label>
                  <input
                    type="number"
                    value={editingRecord.weekNumber}
                    onChange={(e) => setEditingRecord({ ...editingRecord, weekNumber: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Tên tuần học:</label>
                  <input
                    type="text"
                    value={editingRecord.academicWeek}
                    onChange={(e) => setEditingRecord({ ...editingRecord, academicWeek: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Điểm KT:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.testScore}
                    onChange={(e) => setEditingRecord({ ...editingRecord, testScore: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Điểm QT:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRecord.processScore}
                    onChange={(e) => setEditingRecord({ ...editingRecord, processScore: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Mức tham gia:</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editingRecord.participationLevel}
                    onChange={(e) => setEditingRecord({ ...editingRecord, participationLevel: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Số bài giao:</label>
                  <input
                    type="number"
                    value={editingRecord.tasksAssigned}
                    onChange={(e) => setEditingRecord({ ...editingRecord, tasksAssigned: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Đúng hạn:</label>
                  <input
                    type="number"
                    value={editingRecord.tasksCompletedOnTime}
                    onChange={(e) => setEditingRecord({ ...editingRecord, tasksCompletedOnTime: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Trễ/Quá hạn:</label>
                  <input
                    type="number"
                    value={editingRecord.tasksCompletedLate}
                    onChange={(e) => setEditingRecord({ ...editingRecord, tasksCompletedLate: Number(e.target.value) })}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium"
                >
                  Lưu bản ghi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal (Add or Edit) */}
      {showAssignmentModal && editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Thông tin nhiệm vụ / Bài tập
            </h3>
            <form onSubmit={handleSaveAssignmentSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Tiêu đề bài tập:</label>
                <input
                  type="text"
                  value={editingAssignment.title}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  placeholder="Ví dụ: Bài tập hàm số bậc hai"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Ngày giao:</label>
                  <input
                    type="text"
                    value={editingAssignment.assignedDate}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, assignedDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Hạn nộp:</label>
                  <input
                    type="text"
                    value={editingAssignment.dueDate}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Thời lượng ước tính (phút):</label>
                  <input
                    type="number"
                    value={editingAssignment.estimatedMinutes}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, estimatedMinutes: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Loại nhiệm vụ:</label>
                  <select
                    value={editingAssignment.type}
                    onChange={(e: any) => setEditingAssignment({ ...editingAssignment, type: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  >
                    <option value="BÀI_TẬP_VỀ_NHÀ">Bài tập về nhà</option>
                    <option value="PHIẾU_ÔN_TẬP">Phiếu ôn tập</option>
                    <option value="DỰ_ÁN_NHỎ">Dự án nhỏ</option>
                    <option value="BÀI_ĐỌC_TRƯỚC">Bài đọc trước</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium"
                >
                  Lưu bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submission Edit Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cập nhật bài nộp: {editingSubmission.asn.title}
            </h3>
            <form onSubmit={handleSaveSubmissionSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Trạng thái nộp:</label>
                  <select
                    value={editingSubmission.sub.status}
                    onChange={(e: any) => setEditingSubmission({
                      ...editingSubmission,
                      sub: { ...editingSubmission.sub, status: e.target.value }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  >
                    <option value="ĐÚNG_HẠN">ĐÚNG HẠN</option>
                    <option value="MUỘN">NỘP MUỘN</option>
                    <option value="CHƯA_NỘP">CHƯA NỘP</option>
                    <option value="GIA_HẠN">XIN GIA HẠN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Điểm số (0-10):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingSubmission.sub.score ?? ''}
                    onChange={(e) => setEditingSubmission({
                      ...editingSubmission,
                      sub: { ...editingSubmission.sub, score: e.target.value === '' ? undefined : Number(e.target.value) }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                    placeholder="Chưa chấm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Thời gian nộp:</label>
                  <input
                    type="text"
                    value={editingSubmission.sub.submittedAt || ''}
                    onChange={(e) => setEditingSubmission({
                      ...editingSubmission,
                      sub: { ...editingSubmission.sub, submittedAt: e.target.value }
                    })}
                    placeholder="dd/mm/yyyy hh:mm"
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Số giờ trễ:</label>
                  <input
                    type="number"
                    value={editingSubmission.sub.delayHours}
                    onChange={(e) => setEditingSubmission({
                      ...editingSubmission,
                      sub: { ...editingSubmission.sub, delayHours: Number(e.target.value) }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Ghi chú của học sinh/giáo viên:</label>
                <textarea
                  rows={2}
                  value={editingSubmission.sub.studentNote || ''}
                  onChange={(e) => setEditingSubmission({
                    ...editingSubmission,
                    sub: { ...editingSubmission.sub, studentNote: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  placeholder="Ghi chú lý do nộp muộn hoặc lời nhận xét..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium"
                >
                  Lưu bài nộp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intervention Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Chỉnh sửa kế hoạch can thiệp
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateIntervention(editingPlan);
              setEditingPlan(null);
            }} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Tên kế hoạch:</label>
                <input
                  type="text"
                  value={editingPlan.title}
                  onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Mục tiêu đo lường:</label>
                <input
                  type="text"
                  value={editingPlan.goal}
                  onChange={(e) => setEditingPlan({ ...editingPlan, goal: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Chiến lược sư phạm:</label>
                <textarea
                  rows={2}
                  value={editingPlan.strategyDescription}
                  onChange={(e) => setEditingPlan({ ...editingPlan, strategyDescription: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Các bước chia nhỏ (mỗi dòng 1 bước):</label>
                <textarea
                  rows={3}
                  value={editingPlan.microTasks.join('\n')}
                  onChange={(e) => setEditingPlan({ ...editingPlan, microTasks: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent font-mono text-[11px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Thời lượng (tuần):</label>
                  <input
                    type="number"
                    value={editingPlan.durationWeeks}
                    onChange={(e) => setEditingPlan({ ...editingPlan, durationWeeks: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Trạng thái:</label>
                  <select
                    value={editingPlan.status}
                    onChange={(e: any) => setEditingPlan({ ...editingPlan, status: e.target.value })}
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
                  onClick={() => setEditingPlan(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium"
                >
                  Lưu kế hoạch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Item Deletion Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-rose-600 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              <span>Xác nhận xóa {itemToDelete.type}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa: <strong>"{itemToDelete.title}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  itemToDelete.onConfirm();
                  setItemToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signal Add / Edit Modal in Profile */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSignal ? 'Chỉnh sửa Tín hiệu Học tập Thích ứng' : 'Thêm Tín hiệu Thích ứng Mới'} ({student.fullName})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSignalModal(false);
                  setEditingSignal(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!signalTitle.trim()) return;

                const savedSignal: RiskSignal = {
                  id: editingSignal ? editingSignal.id : `SIG_${Date.now()}`,
                  studentId: student.id,
                  detectedDate: editingSignal ? editingSignal.detectedDate : new Date().toLocaleDateString('vi-VN'),
                  type: signalType,
                  level: signalLevel,
                  frequency: signalFrequency,
                  confidenceScore: Number(signalConfidence) || 85,
                  title: signalTitle.trim(),
                  evidence: {
                    primaryIndicators: [
                      {
                        indicatorName: signalIndicatorName,
                        baselineValue: `${student.baseline.onTimeRate}%`,
                        currentValue: '55%',
                        delta: signalDelta,
                        significance: signalLevel >= 2 ? 'RÕ_RỆT' : 'ĐÁNG_LƯU_Ý',
                      },
                    ],
                    observedWeeks: [3, 4],
                    dataSufficiency: 'ĐẦY_ĐỦ',
                  },
                  explanation: {
                    whatIsChanging: signalWhatIsChanging || 'Ghi nhận biến động nhịp độ học tập so với baseline cá nhân',
                    sinceWhen: 'Tuần 3 & 4',
                    supportingData: [
                      `Chỉ báo: ${signalIndicatorName} (${signalDelta})`,
                      'Dữ liệu bài nộp trên hệ thống và tương tác tự học',
                    ],
                    occurrenceCount: 2,
                    missingData: ['Cần kết hợp nhật ký tự đánh giá của học sinh'],
                    potentialContextFactors: [signalHypothesis || 'Chưa thiết lập chặng làm bài 15 phút hoặc khó khăn nội dung mới'],
                    recommendedObservations: [
                      'Quan sát thời gian bắt đầu làm câu hỏi đầu tiên trong 10 phút đầu',
                      'Đề xuất vi phân bài tập 15 phút và đặt lời nhắc trước 18h',
                    ],
                    transparencyRationale: 'Dựa trên phương sai điểm và tỷ lệ hoàn thành nhiệm vụ đối chiếu trực tiếp với baseline cá nhân.',
                  },
                  status: signalStatus,
                };

                if (editingSignal) {
                  if (onUpdateSignal) onUpdateSignal(savedSignal);
                } else {
                  if (onSaveSignal) onSaveSignal(savedSignal);
                }

                setShowSignalModal(false);
                setEditingSignal(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tiêu đề tín hiệu cảnh báo:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xu hướng trì hoãn nộp bài liên tiếp 2 tuần"
                  value={signalTitle}
                  onChange={(e) => setSignalTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Phân loại tín hiệu:</label>
                  <select
                    value={signalType}
                    onChange={(e: any) => setSignalType(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option value="TRÌ_HOÃN_NHIỆM_VỤ">Trì hoãn nhiệm vụ</option>
                    <option value="SUY_GIẢM_THAM_GIA">Suy giảm tham gia</option>
                    <option value="BIẾN_THIÊN_BẤT_THƯỜNG">Biến thiên bất thường</option>
                    <option value="CẦN_THÊM_DỮ_LIỆU">Cần thêm dữ liệu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mức độ cảnh báo:</label>
                  <select
                    value={signalLevel}
                    onChange={(e: any) => setSignalLevel(Number(e.target.value) as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent font-medium"
                  >
                    <option value={0}>Mức 0 - Bình thường</option>
                    <option value={1}>Mức 1 - Cần quan sát (Theo dõi)</option>
                    <option value={2}>Mức 2 - Cần can thiệp (Vi phân 15p)</option>
                    <option value={3}>Mức 3 - Cần phối hợp phụ huynh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tần suất:</label>
                  <select
                    value={signalFrequency}
                    onChange={(e: any) => setSignalFrequency(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  >
                    <option value="ĐƠN_LẺ">Đơn lẻ</option>
                    <option value="LẶP_LẠI">Lặp lại</option>
                    <option value="XU_HƯỚNG_MỚI">Xu hướng mới</option>
                    <option value="KÉO_DÀI">Kéo dài</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Độ tin cậy (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={signalConfidence}
                    onChange={(e) => setSignalConfidence(Number(e.target.value))}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Trạng thái:</label>
                  <select
                    value={signalStatus}
                    onChange={(e: any) => setSignalStatus(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent font-semibold"
                  >
                    <option value="CHỜ_XÁC_NHẬN">Chờ xác nhận</option>
                    <option value="ĐÃ_XÁC_NHẬN">Đã xác nhận</option>
                    <option value="ĐANG_CAN_THIỆP">Đang can thiệp</option>
                    <option value="ĐÃ_CẢI_THIỆN">Đã cải thiện</option>
                    <option value="BÁO_ĐỘNG_GIẢ">Báo động giả</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mô tả diễn biến thay đổi (So với baseline):</label>
                <textarea
                  rows={2}
                  value={signalWhatIsChanging}
                  onChange={(e) => setSignalWhatIsChanging(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tên chỉ báo cốt lõi:</label>
                  <input
                    type="text"
                    value={signalIndicatorName}
                    onChange={(e) => setSignalIndicatorName(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Độ lệch (Delta):</label>
                  <input
                    type="text"
                    value={signalDelta}
                    onChange={(e) => setSignalDelta(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Giả thuyết bối cảnh / Sư phạm:</label>
                <textarea
                  rows={2}
                  value={signalHypothesis}
                  onChange={(e) => setSignalHypothesis(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignalModal(false);
                    setEditingSignal(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 cursor-pointer shadow-xs"
                >
                  {editingSignal ? 'Lưu cập nhật tín hiệu' : 'Tạo tín hiệu mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
