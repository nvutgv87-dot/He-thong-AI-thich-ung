/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  Lightbulb,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Filter,
  Plus,
  Trash2,
  Search,
  Edit2,
  X,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Check,
  CheckSquare,
  Square,
  Activity,
  FileUp,
  FileCheck,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import {
  Student,
  RiskSignal,
  InterventionPlan,
  Assignment,
  AssignmentSubmission,
  WeeklyLearningRecord,
  WARNING_LEVEL_DEFINITIONS,
  DataQualityIssue,
  CenterConfig,
  TimelineTrendItem,
  COGNITIVE_LEVEL_META,
} from '../../types';
import { examService } from '../../services/examService';
import {
  storageService,
  DEFAULT_CENTER_CONFIG,
  DEFAULT_TIMELINE_ITEMS,
} from '../../services/storageService';
import {
  parseStudentFile,
  buildStudentFromParsedRow,
  downloadSampleExcelStudentTemplate,
  downloadSampleWordStudentTemplate,
  downloadSamplePdfGuide,
  ParsedStudentRow,
  FileParseResult,
} from '../../utils/studentFileParser';

interface TeacherDashboardProps {
  students: Student[];
  signals: RiskSignal[];
  interventions: InterventionPlan[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  records: WeeklyLearningRecord[];
  dataIssues: DataQualityIssue[];
  privacyMode: boolean;
  onSelectStudent: (studentId: string) => void;
  onOpenWhyWarning: (signal: RiskSignal) => void;
  onOpenInterventions: () => void;
  onOpenDataQuality: () => void;
  onAddStudent?: (student: Student) => void;
  onAddStudents?: (students: Student[]) => void;
  onUpdateStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onSaveSignal?: (signal: RiskSignal) => void;
  onUpdateSignal?: (signal: RiskSignal) => void;
  onDeleteSignal?: (signalId: string) => void;
  onSaveSubmission?: (submission: AssignmentSubmission) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  signals,
  interventions,
  assignments,
  submissions,
  records,
  dataIssues,
  privacyMode,
  onSelectStudent,
  onOpenWhyWarning,
  onOpenInterventions,
  onOpenDataQuality,
  onAddStudent,
  onAddStudents,
  onUpdateStudent,
  onDeleteStudent,
  onSaveSignal,
  onUpdateSignal,
  onDeleteSignal,
  onSaveSubmission,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OBSERVE' | 'INTERVENE' | 'IMPROVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [newFullName, setNewFullName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [newOnTimeRate, setNewOnTimeRate] = useState(85);
  const [newAvgScore, setNewAvgScore] = useState(7.5);

  // Why AI modal state for Phase 3
  const [whyAiModalData, setWhyAiModalData] = useState<{
    title: string;
    rationale: string;
    samplesCount: number;
    timeRange: string;
    confidence: 'CAO' | 'TRUNG_BINH' | 'THAP';
  } | null>(null);

  // File import for Add Student
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addStudentMode, setAddStudentMode] = useState<'FILE' | 'MANUAL'>('FILE');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([]);
  const [fileImportSuccessMsg, setFileImportSuccessMsg] = useState<string | null>(null);

  // Signals Management & Edit State
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState<RiskSignal | null>(null);
  const [signalStudentId, setSignalStudentId] = useState(students[0]?.id || '');
  const [signalTitle, setSignalTitle] = useState('');
  const [signalType, setSignalType] = useState<RiskSignal['type']>('TRÌ_HOÃN_NHIỆM_VỤ');
  const [signalLevel, setSignalLevel] = useState<RiskSignal['level']>(2);
  const [signalFrequency, setSignalFrequency] = useState<RiskSignal['frequency']>('LẶP_LẠI');
  const [signalConfidence, setSignalConfidence] = useState<number>(85);
  const [signalStatus, setSignalStatus] = useState<RiskSignal['status']>('CHỜ_XÁC_NHẬN');
  const [signalWhatIsChanging, setSignalWhatIsChanging] = useState('');
  const [signalIndicatorName, setSignalIndicatorName] = useState('Tỷ lệ nộp bài đúng hạn');
  const [signalDelta, setSignalDelta] = useState('-35% so với baseline');
  const [signalHypothesis, setSignalHypothesis] = useState('');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'CHỜ_XÁC_NHẬN' | 'ĐANG_CAN_THIỆP' | 'ĐÃ_CẢI_THIỆN' | 'BÁO_ĐỘNG_GIẢ'>('ALL');
  const [signalToDelete, setSignalToDelete] = useState<RiskSignal | null>(null);

  // Center Configuration & Edit State
  const [centerConfig, setCenterConfig] = useState<CenterConfig>(() => storageService.getCenterConfig());
  const [showEditCenterModal, setShowEditCenterModal] = useState(false);
  const [tempCenterConfig, setTempCenterConfig] = useState<CenterConfig>(centerConfig);

  // Timeline Trends Configuration & Edit State
  const [timelineItems, setTimelineItems] = useState<TimelineTrendItem[]>(() => storageService.getTimelineConfig());
  const [showEditTimelineModal, setShowEditTimelineModal] = useState(false);
  const [tempTimelineItems, setTempTimelineItems] = useState<TimelineTrendItem[]>(timelineItems);

  // Overdue Submission Editing State
  const [editingSubmission, setEditingSubmission] = useState<AssignmentSubmission | null>(null);

  // Compute 8 core metrics
  const totalStudents = students.length;
  const stableStudents = students.filter((s) => s.currentStatus === 'ON_DINH').length;
  const needObservation = students.filter((s) => s.currentStatus === 'CAN_QUAN_SAT').length;
  const needSupportOrDelay = students.filter((s) => s.currentStatus === 'CAN_HO_TRO' || s.warningLevel === 2).length;
  const participationDrop = signals.filter((s) => s.type === 'SUY_GIẢM_THAM_GIA' && s.status !== 'ĐÃ_CẢI_THIỆN').length;
  const activeInterventions = interventions.filter((i) => i.status === 'ĐANG_THỰC_HIỆN').length;
  const improvedStudents = students.filter((s) => s.currentStatus === 'DA_CAI_THIEN').length;
  const pendingDataStudents = students.filter((s) => s.currentStatus === 'DANG_THEO_DOI').length;

  // Filter students for the main signal/observation list
  const filteredStudents = students.filter((s) => {
    const matchesQuery = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (selectedFilter === 'OBSERVE') return s.currentStatus === 'CAN_QUAN_SAT' || s.warningLevel === 1;
    if (selectedFilter === 'INTERVENE') return s.currentStatus === 'CAN_HO_TRO' || s.warningLevel >= 2;
    if (selectedFilter === 'IMPROVED') return s.currentStatus === 'DA_CAI_THIEN';
    return true;
  });

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;
    const newStudent: Student = {
      id: `STU_${Date.now()}`,
      code: newCode.trim() || `HS0${students.length + 1}`,
      fullName: newFullName.trim(),
      birthDate: '15/01/2009',
      classId: 'LOP_11A1',
      gender: newGender,
      currentStatus: 'ON_DINH',
      warningLevel: 0,
      activeSignalsCount: 0,
      activeInterventionsCount: 0,
      baseline: {
        avgScore: Number(newAvgScore) || 7.5,
        onTimeRate: Number(newOnTimeRate) || 85,
        participationScore: 4.0,
        avgDelayHours: 1.0,
        focusMinutesAvg: 35,
        recordedPeriod: 'Tuần 1 - 4',
      },
      profile: {
        personalGoals: ['Nâng cao kết quả học tập môn Hóa học 11'],
        strengths: ['Tập trung tốt khi có hướng dẫn rõ ràng'],
        currentDifficulties: [],
        taskCompletionHabits: 'Nộp bài đúng hạn',
        participationStyle: 'Tương tác bình thường trong giờ học',
        triedStrategies: [],
        effectiveStrategies: ['Chia nhỏ bài tập'],
        ineffectiveStrategies: [],
        lastUpdated: new Date().toLocaleDateString('vi-VN'),
      },
      lastDataUpdate: new Date().toLocaleDateString('vi-VN'),
      notes: 'Học sinh mới được thêm vào lớp.',
    };

    if (onAddStudent) {
      onAddStudent(newStudent);
    }
    setNewFullName('');
    setNewCode('');
    setShowAddStudentModal(false);
  };

  // File Upload & Parser Handlers
  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setFileImportSuccessMsg(null);
    try {
      const res = await parseStudentFile(file);
      setParseResult(res);
      if (res.success && res.students.length > 0) {
        setParsedRows([...res.students]);
        setSelectedRowIndices(res.students.map((_, i) => i));
      } else {
        setParsedRows([]);
        setSelectedRowIndices([]);
      }
    } catch (err: any) {
      setParseResult({
        success: false,
        fileType: 'UNKNOWN',
        fileName: file.name,
        students: [],
        error: `Lỗi đọc tệp: ${err?.message || 'Không thể trích xuất dữ liệu.'}`,
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleConfirmImportStudents = () => {
    if (parsedRows.length === 0 || selectedRowIndices.length === 0) return;
    const selectedStudentsToImport = selectedRowIndices.map((idx, i) => {
      const row = parsedRows[idx];
      return buildStudentFromParsedRow(row, students.length + i);
    });

    if (onAddStudents) {
      onAddStudents(selectedStudentsToImport);
    } else if (onAddStudent) {
      selectedStudentsToImport.forEach((s) => onAddStudent(s));
    }

    setFileImportSuccessMsg(`Đã nhập thành công ${selectedStudentsToImport.length} học sinh vào lớp!`);
    setTimeout(() => {
      setShowAddStudentModal(false);
      setParseResult(null);
      setParsedRows([]);
      setSelectedRowIndices([]);
      setFileImportSuccessMsg(null);
    }, 1200);
  };

  // Signal Add & Edit Handlers
  const handleOpenCreateSignal = (forStudentId?: string) => {
    setEditingSignal(null);
    const targetId = forStudentId || students[0]?.id || '';
    const stu = students.find((s) => s.id === targetId);
    setSignalStudentId(targetId);
    setSignalTitle(stu ? `Tín hiệu quan sát tiến trình: ${stu.fullName}` : 'Tín hiệu quan sát mới');
    setSignalType('TRÌ_HOÃN_NHIỆM_VỤ');
    setSignalLevel(2);
    setSignalFrequency('LẶP_LẠI');
    setSignalConfidence(85);
    setSignalStatus('CHỜ_XÁC_NHẬN');
    setSignalWhatIsChanging(stu ? `Tỷ lệ nộp bài đúng hạn của ${stu.fullName} giảm đáng kể so với baseline` : 'Ghi nhận biến động nhịp độ học tập');
    setSignalIndicatorName('Tỷ lệ nộp bài đúng hạn');
    setSignalDelta('-35% so với baseline');
    setSignalHypothesis('Có thể do bài tập phần đại số dài hoặc gặp rào cản phân bổ thời gian tự học');
    setShowSignalModal(true);
  };

  const handleOpenEditSignal = (sig: RiskSignal) => {
    setEditingSignal(sig);
    setSignalStudentId(sig.studentId);
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
  };

  const handleSaveSignalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalTitle.trim()) return;

    const stu = students.find((s) => s.id === signalStudentId);

    const savedSignal: RiskSignal = {
      id: editingSignal ? editingSignal.id : `SIG_${Date.now()}`,
      studentId: signalStudentId,
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
            baselineValue: stu ? `${stu.baseline.onTimeRate}%` : '85%',
            currentValue: '50%',
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
  };

  const handleQuickUpdateSignalStatus = (sig: RiskSignal, newStatus: RiskSignal['status']) => {
    const updated: RiskSignal = {
      ...sig,
      status: newStatus,
    };
    if (onUpdateSignal) {
      onUpdateSignal(updated);
    }
  };

  // Filter signals for signals list
  const filteredSignals = signals.filter((s) => {
    if (signalFilter === 'ALL') return true;
    return s.status === signalFilter;
  });

  // Recent overdue / late submissions
  const overdueSubmissions = submissions
    .filter((sub) => sub.status === 'MUỘN' || sub.status === 'CHƯA_NỘP')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 6 Core Questions Answer Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-blue-800/60 relative">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{centerConfig.badge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{centerConfig.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              {centerConfig.description}
            </p>
          </div>

          <button
            onClick={() => {
              setTempCenterConfig({ ...centerConfig });
              setShowEditCenterModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer shrink-0 shadow-xs self-start"
            title="Chỉnh sửa thông tin và câu trả lời của trung tâm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa trung tâm</span>
          </button>
        </div>

        {/* 6 Core Questions Quick Nav */}
        <div className="mt-5 pt-4 border-t border-blue-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q1Label}</div>
            <div className="text-white font-semibold mt-1">
              {centerConfig.q1Value || `${needObservation + needSupportOrDelay} học sinh`}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q2Label}</div>
            <div className="text-white font-semibold mt-1">{centerConfig.q2Value}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q3Label}</div>
            <div className="text-white font-semibold mt-1">{centerConfig.q3Value}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q4Label}</div>
            <div className="text-white font-semibold mt-1">{centerConfig.q4Value}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q5Label}</div>
            <div className="text-white font-semibold mt-1">{centerConfig.q5Value}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
            <div className="text-blue-300 font-medium">{centerConfig.q6Label}</div>
            <div className="text-emerald-300 font-semibold mt-1">
              {centerConfig.q6Value || `${improvedStudents} em đã cải thiện`}
            </div>
          </div>
        </div>
      </div>

      {/* 8 Core Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Metric 1 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Tổng học sinh</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalStudents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lớp</div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Dữ liệu ổn định</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stableStudents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Không cảnh báo giả</div>
        </div>

        {/* Metric 3 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between">
            <span>Cần quan sát</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {needObservation}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mức 1 (Theo dõi)</div>
        </div>

        {/* Metric 4 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span>Trì hoãn nhiệm vụ</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {needSupportOrDelay}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mức 2 (Cần hỗ trợ)</div>
        </div>

        {/* Metric 5 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Giảm tham gia</span>
            <TrendingDown className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
            {participationDrop}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ít tương tác lớp</div>
        </div>

        {/* Metric 6 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
            <span>Đang can thiệp</span>
            <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {activeInterventions}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kế hoạch vi mô</div>
        </div>

        {/* Metric 7 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>Đã cải thiện</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {improvedStudents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đo lường sau can thiệp</div>
        </div>

        {/* Metric 8 */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>Cần thêm dữ liệu</span>
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
            {pendingDataStudents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; 3 tuần học</div>
        </div>
      </div>

      {/* Adaptive Learning Signals Center */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                Tín hiệu Học tập Thích ứng & Can thiệp Đa chỉ báo
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {signals.length} tín hiệu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phát hiện độ lệch nhịp độ so với Baseline cá nhân từng học sinh (không chẩn đoán y khoa, không gán nhãn). Giáo viên có toàn quyền thêm, sửa, đổi trạng thái hoặc xóa tín hiệu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCreateSignal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm tín hiệu thích ứng</span>
            </button>
          </div>
        </div>

        {/* Signal status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setSignalFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              signalFilter === 'ALL'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả ({signals.length})
          </button>
          <button
            onClick={() => setSignalFilter('CHỜ_XÁC_NHẬN')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              signalFilter === 'CHỜ_XÁC_NHẬN'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Chờ xác nhận ({signals.filter((s) => s.status === 'CHỜ_XÁC_NHẬN').length})
          </button>
          <button
            onClick={() => setSignalFilter('ĐANG_CAN_THIỆP')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              signalFilter === 'ĐANG_CAN_THIỆP'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Đang can thiệp ({signals.filter((s) => s.status === 'ĐANG_CAN_THIỆP').length})
          </button>
          <button
            onClick={() => setSignalFilter('ĐÃ_CẢI_THIỆN')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              signalFilter === 'ĐÃ_CẢI_THIỆN'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Đã cải thiện ({signals.filter((s) => s.status === 'ĐÃ_CẢI_THIỆN').length})
          </button>
          <button
            onClick={() => setSignalFilter('BÁO_ĐỘNG_GIẢ')}
            className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              signalFilter === 'BÁO_ĐỘNG_GIẢ'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Báo động giả ({signals.filter((s) => s.status === 'BÁO_ĐỘNG_GIẢ').length})
          </button>
        </div>

        {/* Signals List Cards */}
        {filteredSignals.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Không có tín hiệu nào phù hợp với bộ lọc đã chọn.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {filteredSignals.map((sig) => {
              const targetStudent = students.find((s) => s.id === sig.studentId);
              const studentName = targetStudent ? (privacyMode ? targetStudent.code : targetStudent.fullName) : sig.studentId;
              const levelMeta = WARNING_LEVEL_DEFINITIONS[sig.level];

              return (
                <div
                  key={sig.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between gap-2.5 hover:shadow-xs transition-shadow"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectStudent(sig.studentId)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                        >
                          {studentName}
                        </button>
                        {targetStudent && <span className="text-[11px] text-slate-400">({targetStudent.code})</span>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${levelMeta.badgeBg}`}>
                          {levelMeta.name}
                        </span>
                        <button
                          onClick={() => handleOpenEditSignal(sig)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Chỉnh sửa tín hiệu thích ứng này"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSignalToDelete(sig)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Xóa tín hiệu cảnh báo này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {sig.title}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {sig.explanation.whatIsChanging}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Độ tin cậy: <strong className="font-mono text-slate-700 dark:text-slate-300">{sig.confidenceScore}%</strong></span>
                      <span>·</span>
                      <span>Tần suất: <strong className="text-slate-700 dark:text-slate-300">{sig.frequency}</strong></span>
                      <span>·</span>
                      <span>Ngày: <strong className="text-slate-700 dark:text-slate-300">{sig.detectedDate}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                    {/* Quick status switch */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Trạng thái:</span>
                      <select
                        value={sig.status}
                        onChange={(e: any) => handleQuickUpdateSignalStatus(sig, e.target.value)}
                        className="p-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        <option value="CHỜ_XÁC_NHẬN">Chờ xác nhận</option>
                        <option value="ĐÃ_XÁC_NHẬN">Đã xác nhận</option>
                        <option value="ĐANG_CAN_THIỆP">Đang can thiệp</option>
                        <option value="ĐÃ_CẢI_THIỆN">Đã cải thiện</option>
                        <option value="BÁO_ĐỘNG_GIẢ">Báo động giả</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onOpenWhyWarning(sig)}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Tại sao có cảnh báo?</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Student Signal Matrix & Observation List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Danh sách Học sinh & Tín hiệu Quan sát
                </h2>
                <p className="text-xs text-slate-500">
                  Phân tích chuỗi thời gian so sánh với baseline cá nhân
                </p>
              </div>

              {/* Search & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã HS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36 sm:w-44 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setAddStudentMode('FILE');
                    setShowAddStudentModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700/60 cursor-pointer transition-colors shadow-xs"
                  title="Thêm học sinh bằng tệp Word, PDF hoặc Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Thêm từ file (Word, PDF, Excel...)</span>
                </button>

                <button
                  onClick={() => {
                    setAddStudentMode('MANUAL');
                    setShowAddStudentModal(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thủ công</span>
                </button>
              </div>

              {/* Filter controls */}
              <div className="w-full flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs overflow-x-auto">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                    selectedFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({students.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('OBSERVE')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                    selectedFilter === 'OBSERVE'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Cần quan sát
                </button>
                <button
                  onClick={() => setSelectedFilter('INTERVENE')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                    selectedFilter === 'INTERVENE'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Cần hỗ trợ
                </button>
                <button
                  onClick={() => setSelectedFilter('IMPROVED')}
                  className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                    selectedFilter === 'IMPROVED'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Đã cải thiện
                </button>
              </div>
            </div>

            {/* Student List Cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy học sinh nào phù hợp với bộ lọc/tìm kiếm.
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const levelMeta = WARNING_LEVEL_DEFINITIONS[student.warningLevel];
                  const studentSignal = signals.find((s) => s.studentId === student.id);
                  const displayName = privacyMode ? student.code : student.fullName;

                  return (
                    <div
                      key={student.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 text-xs sm:text-sm cursor-pointer transition-colors"
                          >
                            {displayName}
                          </button>
                          <span className="text-slate-400 text-xs">({student.code})</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${levelMeta.badgeBg}`}>
                            {levelMeta.name}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span>Baseline nộp bài: <strong className="font-mono text-slate-700 dark:text-slate-300">{student.baseline.onTimeRate}%</strong></span>
                          <span>·</span>
                          <span>Điểm tham gia: <strong className="font-mono text-slate-700 dark:text-slate-300">{student.baseline.participationScore}/5</strong></span>
                          {student.notes && (
                            <>
                              <span>·</span>
                              <span className="text-slate-600 dark:text-slate-400 italic">
                                {student.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {studentSignal ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onOpenWhyWarning(studentSignal)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Tại sao có cảnh báo?</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditSignal(studentSignal)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                              title="Chỉnh sửa tín hiệu thích ứng này"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 px-1 py-1">
                              {student.currentStatus === 'DANG_THEO_DOI' ? 'Đang tích lũy dữ liệu' : 'Chỉ số bình thường'}
                            </span>
                            <button
                              onClick={() => handleOpenCreateSignal(student.id)}
                              className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-600 px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Tạo tín hiệu cảnh báo thích ứng cho học sinh này"
                            >
                              <Plus className="w-3 h-3 text-blue-500" />
                              <span>Gán tín hiệu</span>
                            </button>
                          </div>
                        )}

                        {onUpdateStudent && (
                          <button
                            onClick={() => setEditingStudent({ ...student })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin học sinh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectStudent(student.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Xem Hồ sơ 360°"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {onDeleteStudent && (
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa học sinh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Timeline trend explanation card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Diễn biến Xu hướng qua Chuỗi Thời gian
              </h3>
              <button
                onClick={() => {
                  setTempTimelineItems(timelineItems.map((item) => ({ ...item })));
                  setShowEditTimelineModal(true);
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                title="Chỉnh sửa các mốc chuỗi thời gian"
              >
                <Edit2 className="w-3 h-3" />
                <span>Chỉnh sửa mốc tuần</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {timelineItems.map((item, idx) => {
                const bgColors = [
                  'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300',
                  'bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300',
                  'bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300',
                  'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300',
                ];
                const colorClass = bgColors[idx % bgColors.length];

                return (
                  <div key={item.id || idx} className={`p-3 rounded-lg border ${colorClass}`}>
                    <div className="font-semibold">{item.phase}: {item.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1">{item.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Active Interventions, Overdue tasks & Data Quality */}
        <div className="space-y-4">
          {/* Active Interventions Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
                Kế hoạch hỗ trợ đang thực hiện
              </h3>
              <button
                onClick={onOpenInterventions}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1">
              {interventions.map((plan) => {
                const targetStudent = students.find((s) => s.id === plan.studentId);
                const sName = targetStudent ? (privacyMode ? targetStudent.code : targetStudent.fullName) : 'Học sinh';

                return (
                  <div key={plan.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {sName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        plan.status === 'ĐÃ_HOÀN_THÀNH'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      }`}>
                        {plan.status === 'ĐÃ_HOÀN_THÀNH' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                      </span>
                    </div>

                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {plan.title}
                    </div>

                    <div className="text-slate-500 line-clamp-2">
                      {plan.strategyDescription}
                    </div>

                    {plan.evaluationResult && (
                      <div className="text-[11px] text-emerald-600 font-medium pt-1">
                        Kết quả đánh giá: {plan.evaluationResult}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue / Late Task Radar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Nhiệm vụ nộp muộn / quá hạn gần đây
            </h3>

            <div className="space-y-2 text-xs">
              {overdueSubmissions.map((sub) => {
                const stu = students.find((s) => s.id === sub.studentId);
                const asn = assignments.find((a) => a.id === sub.assignmentId);
                const displayName = stu ? (privacyMode ? stu.code : stu.fullName) : 'HS';

                return (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {displayName} · {asn?.title || 'Bài tập'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Trạng thái: <span className="font-semibold text-rose-600">{sub.status}</span>
                        {sub.delayHours > 0 && ` (Trễ ${sub.delayHours} giờ)`}
                      </div>
                      {sub.studentNote && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-1">
                          "{sub.studentNote}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingSubmission({ ...sub })}
                      className="px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded cursor-pointer shrink-0 transition-colors"
                      title="Cập nhật trạng thái bài nộp"
                    >
                      Cập nhật
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Quality Warning Notice */}
          {dataIssues.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Cảnh báo chất lượng dữ liệu ({dataIssues.length})
                </span>
                <button
                  onClick={onOpenDataQuality}
                  className="text-amber-700 hover:underline cursor-pointer"
                >
                  Chi tiết
                </button>
              </div>
              <p className="text-amber-700 dark:text-amber-400/90 leading-relaxed">
                Có {dataIssues.length} trường hợp chưa đủ dữ liệu hoặc thiếu tự phản tư. Hệ thống đã khóa cảnh báo tự động để chống suy diễn sai.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal with File Import (Word, PDF, Excel) and Manual Entry */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-xs space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thêm học sinh mới vào lớp
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hỗ trợ nhập trực tiếp hoặc quét từ tệp Word, PDF, Excel
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setParseResult(null);
                  setParsedRows([]);
                  setSelectedRowIndices([]);
                  setFileImportSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => setAddStudentMode('FILE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md font-semibold cursor-pointer transition-colors ${
                  addStudentMode === 'FILE'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Thêm từ tệp (Word, PDF, Excel...)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  Khuyên dùng
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAddStudentMode('MANUAL')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md font-semibold cursor-pointer transition-colors ${
                  addStudentMode === 'MANUAL'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Nhập thủ công</span>
              </button>
            </div>

            {/* TAB 1: FILE IMPORT */}
            {addStudentMode === 'FILE' && (
              <div className="space-y-4">
                {/* Supported formats banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-[11px]">
                      Hệ thống tự động phân tích cấu trúc cột và bảng điểm:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-emerald-300 text-emerald-700">
                      Excel (.xlsx, .xls, .csv)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-blue-300 text-blue-700">
                      Word (.docx, .doc)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-rose-300 text-rose-700">
                      PDF (.pdf)
                    </span>
                  </div>
                </div>

                {/* File Dropzone Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv,.docx,.doc,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 space-y-2.5"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Bấm vào đây để chọn tệp, hoặc kéo thả tệp vào khung này
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ tải lên danh sách học sinh theo bảng Excel, tài liệu Word hoặc PDF
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn tệp Word / PDF / Excel từ máy</span>
                  </div>
                </div>

                {/* Sample Template Downloads */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Tải biểu mẫu danh sách mẫu:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={downloadSampleExcelStudentTemplate}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      title="Tải bảng tính Excel mẫu chuẩn"
                    >
                      <Download className="w-3 h-3 text-emerald-600" />
                      <span>Mẫu Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadSampleWordStudentTemplate}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      title="Tải văn bản Word mẫu dạng bảng"
                    >
                      <Download className="w-3 h-3 text-blue-600" />
                      <span>Mẫu Word (.doc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadSamplePdfGuide}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                      title="Xem hướng dẫn định dạng PDF / Văn bản"
                    >
                      <Download className="w-3 h-3 text-rose-600" />
                      <span>Hướng dẫn mẫu PDF</span>
                    </button>
                  </div>
                </div>

                {/* Parsing Status / Loading */}
                {isParsingFile && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                    <RotateCcw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="font-semibold">Đang đọc và phân tích cấu trúc dữ liệu tệp...</span>
                  </div>
                )}

                {/* Success Message Banner */}
                {fileImportSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{fileImportSuccessMsg}</span>
                  </div>
                )}

                {/* Parsing Error Banner */}
                {parseResult && !parseResult.success && (
                  <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Không thể trích xuất học sinh từ tệp: {parseResult.fileName}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {parseResult.error || 'Vui lòng kiểm tra lại định dạng tệp hoặc tải về bảng tính mẫu bên trên để sử dụng đúng cấu trúc.'}
                    </p>
                  </div>
                )}

                {/* Parsed Result Preview Table */}
                {parseResult && parseResult.success && parsedRows.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          Trích xuất được {parsedRows.length} học sinh từ tệp "{parseResult.fileName}":
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedRowIndices.length === parsedRows.length) {
                              setSelectedRowIndices([]);
                            } else {
                              setSelectedRowIndices(parsedRows.map((_, i) => i));
                            }
                          }}
                          className="text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          {selectedRowIndices.length === parsedRows.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                    </div>

                    {/* Table of Parsed Students */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRowIndices.length === parsedRows.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRowIndices(parsedRows.map((_, i) => i));
                                  } else {
                                    setSelectedRowIndices([]);
                                  }
                                }}
                              />
                            </th>
                            <th className="p-2">Mã HS</th>
                            <th className="p-2">Họ và tên</th>
                            <th className="p-2">Giới tính</th>
                            <th className="p-2">Đúng hạn (%)</th>
                            <th className="p-2">Điểm TB</th>
                            <th className="p-2">Ghi chú</th>
                            <th className="p-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {parsedRows.map((row, idx) => {
                            const isSelected = selectedRowIndices.includes(idx);
                            return (
                              <tr key={idx} className={isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'opacity-60'}>
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRowIndices([...selectedRowIndices, idx]);
                                      } else {
                                        setSelectedRowIndices(selectedRowIndices.filter((i) => i !== idx));
                                      }
                                    }}
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.code}
                                    onChange={(e) => {
                                      const updated = [...parsedRows];
                                      updated[idx].code = e.target.value;
                                      setParsedRows(updated);
                                    }}
                                    className="w-16 p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono font-bold"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.fullName}
                                    onChange={(e) => {
                                      const updated = [...parsedRows];
                                      updated[idx].fullName = e.target.value;
                                      setParsedRows(updated);
                                    }}
                                    className="w-36 p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-medium"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <select
                                    value={row.gender}
                                    onChange={(e: any) => {
                                      const updated = [...parsedRows];
                                      updated[idx].gender = e.target.value;
                                      setParsedRows(updated);
                                    }}
                                    className="p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                                  >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                  </select>
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={row.onTimeRate}
                                    onChange={(e) => {
                                      const updated = [...parsedRows];
                                      updated[idx].onTimeRate = Number(e.target.value);
                                      setParsedRows(updated);
                                    }}
                                    className="w-14 p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-center font-mono"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    max={10}
                                    value={row.avgScore}
                                    onChange={(e) => {
                                      const updated = [...parsedRows];
                                      updated[idx].avgScore = Number(e.target.value);
                                      setParsedRows(updated);
                                    }}
                                    className="w-14 p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-center font-mono"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.notes || ''}
                                    onChange={(e) => {
                                      const updated = [...parsedRows];
                                      updated[idx].notes = e.target.value;
                                      setParsedRows(updated);
                                    }}
                                    className="w-32 p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-500"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = parsedRows.filter((_, i) => i !== idx);
                                      setParsedRows(updated);
                                      setSelectedRowIndices(selectedRowIndices.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                    title="Xóa hàng này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Actions for File Import */}
                    <div className="flex items-center justify-between pt-2">
                      {parsedRows.length === 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = parsedRows[0];
                            setNewFullName(r.fullName);
                            setNewCode(r.code);
                            setNewGender(r.gender);
                            setNewOnTimeRate(r.onTimeRate);
                            setNewAvgScore(r.avgScore);
                            setAddStudentMode('MANUAL');
                          }}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Điền vào biểu mẫu nhập lẻ →
                        </button>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setShowAddStudentModal(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmImportStudents}
                          disabled={selectedRowIndices.length === 0}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Thêm {selectedRowIndices.length} học sinh vào lớp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MANUAL ENTRY */}
            {addStudentMode === 'MANUAL' && (
              <form onSubmit={handleCreateStudentSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Họ và tên học sinh:</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Khánh Linh"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mã học sinh (HSxx):</label>
                    <input
                      type="text"
                      placeholder={`HS0${students.length + 1}`}
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Giới tính:</label>
                    <select
                      value={newGender}
                      onChange={(e: any) => setNewGender(e.target.value)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Baseline đúng hạn (%):</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newOnTimeRate}
                      onChange={(e) => setNewOnTimeRate(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Điểm TB khởi đầu (0-10):</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      value={newAvgScore}
                      onChange={(e) => setNewAvgScore(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    Lưu học sinh
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Adaptive Learning Signal Modal */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingSignal ? 'Chỉnh sửa Tín hiệu Học tập Thích ứng' : 'Thêm Tín hiệu Thích ứng Mới'}
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

            <form onSubmit={handleSaveSignalSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Học sinh đối tượng:</label>
                <select
                  value={signalStudentId}
                  onChange={(e) => setSignalStudentId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200 font-semibold"
                  required
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.fullName} ({stu.code}) - Baseline: {stu.baseline.onTimeRate}% đúng hạn
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Ví dụ: Tỷ lệ đúng hạn giảm từ 85% xuống 50% trong tuần 3 và tuần 4..."
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
                  placeholder="Ví dụ: Khó khăn phân bổ thời gian khi làm bài tự luận dài..."
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

      {/* Delete Signal Confirmation Modal */}
      {signalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold">Xác nhận xóa tín hiệu</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa tín hiệu <strong className="text-slate-900 dark:text-white">"{signalToDelete.title}"</strong>?
              Hành động này sẽ gỡ tín hiệu cảnh báo ra khỏi bảng theo dõi của giáo viên.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSignalToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSignal) {
                    onDeleteSignal(signalToDelete.id);
                  }
                  setSignalToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xóa tín hiệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Chỉnh sửa thông tin học sinh ({editingStudent.code})</span>
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateStudent && editingStudent) {
                  onUpdateStudent(editingStudent);
                }
                setEditingStudent(null);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Họ và tên:</label>
                  <input
                    type="text"
                    value={editingStudent.fullName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mã học sinh:</label>
                  <input
                    type="text"
                    value={editingStudent.code}
                    onChange={(e) => setEditingStudent({ ...editingStudent, code: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Trạng thái quan sát:</label>
                  <select
                    value={editingStudent.currentStatus}
                    onChange={(e: any) => setEditingStudent({ ...editingStudent, currentStatus: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  >
                    <option value="ON_DINH">Ổn định</option>
                    <option value="CAN_QUAN_SAT">Cần quan sát</option>
                    <option value="CAN_HO_TRO">Cần hỗ trợ</option>
                    <option value="DANG_THEO_DOI">Đang tích lũy dữ liệu</option>
                    <option value="DA_CAI_THIEN">Đã cải thiện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mức độ cảnh báo (0-3):</label>
                  <select
                    value={editingStudent.warningLevel}
                    onChange={(e) => setEditingStudent({ ...editingStudent, warningLevel: Number(e.target.value) as any })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  >
                    <option value={0}>Mức 0 - Ổn định</option>
                    <option value={1}>Mức 1 - Cần chú ý</option>
                    <option value={2}>Mức 2 - Cần can thiệp</option>
                    <option value={3}>Mức 3 - Cần phối hợp phụ huynh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Baseline nộp đúng hạn (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.baseline.onTimeRate}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      baseline: { ...editingStudent.baseline, onTimeRate: Number(e.target.value) }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Baseline điểm TB:</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={editingStudent.baseline.avgScore}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      baseline: { ...editingStudent.baseline, avgScore: Number(e.target.value) }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Ghi chú sư phạm:</label>
                <textarea
                  rows={2}
                  value={editingStudent.notes || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                  placeholder="Ghi nhận khách quan của giáo viên..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  Cập nhật thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold">Xác nhận xóa học sinh</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa học sinh <strong className="text-slate-900 dark:text-white">{studentToDelete.fullName} ({studentToDelete.code})</strong>?
              Hành động này sẽ xóa đồng bộ bản ghi học tập, tín hiệu và bài tập liên quan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(studentToDelete.id);
                  }
                  setStudentToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Center Configuration Modal */}
      {showEditCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chỉnh sửa Trung tâm Theo dõi Tiến trình & Tín hiệu Học tập
                </h3>
              </div>
              <button
                onClick={() => setShowEditCenterModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                storageService.saveCenterConfig(tempCenterConfig);
                setCenterConfig({ ...tempCenterConfig });
                setShowEditCenterModal(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Tiêu đề trung tâm:
                  </label>
                  <input
                    type="text"
                    value={tempCenterConfig.title}
                    onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, title: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Huy hiệu / Phụ đề hệ thống:
                  </label>
                  <input
                    type="text"
                    value={tempCenterConfig.badge}
                    onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, badge: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Mô tả nguyên lý sư phạm & cảnh báo:
                  </label>
                  <textarea
                    rows={2}
                    value={tempCenterConfig.description}
                    onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, description: e.target.value })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 6 Core Answers Customization */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>Tùy chỉnh 6 câu hỏi và câu trả lời trọng tâm</span>
                  <span className="text-[11px] font-normal text-slate-400">Có thể để trống để hệ thống tự tính</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 1: {tempCenterConfig.q1Label}</label>
                    <input
                      type="text"
                      placeholder="Để trống sẽ tự tính số học sinh cần chú ý"
                      value={tempCenterConfig.q1Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q1Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 2: {tempCenterConfig.q2Label}</label>
                    <input
                      type="text"
                      value={tempCenterConfig.q2Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q2Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 3: {tempCenterConfig.q3Label}</label>
                    <input
                      type="text"
                      value={tempCenterConfig.q3Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q3Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 4: {tempCenterConfig.q4Label}</label>
                    <input
                      type="text"
                      value={tempCenterConfig.q4Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q4Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 5: {tempCenterConfig.q5Label}</label>
                    <input
                      type="text"
                      value={tempCenterConfig.q5Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q5Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                    <label className="font-medium text-slate-700 dark:text-slate-300">Câu 6: {tempCenterConfig.q6Label}</label>
                    <input
                      type="text"
                      placeholder="Để trống sẽ tự tính số học sinh đã cải thiện"
                      value={tempCenterConfig.q6Value}
                      onChange={(e) => setTempCenterConfig({ ...tempCenterConfig, q6Value: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTempCenterConfig({ ...DEFAULT_CENTER_CONFIG })}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại mặc định</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditCenterModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    Lưu thông tin trung tâm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Timeline Trends Modal */}
      {showEditTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Chỉnh sửa Diễn biến Xu hướng qua Chuỗi Thời gian
                </h3>
              </div>
              <button
                onClick={() => setShowEditTimelineModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                storageService.saveTimelineConfig(tempTimelineItems);
                setTimelineItems([...tempTimelineItems]);
                setShowEditTimelineModal(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {tempTimelineItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">Giai đoạn / Tuần:</label>
                        <input
                          type="text"
                          value={item.phase}
                          onChange={(e) => {
                            const updated = [...tempTimelineItems];
                            updated[idx].phase = e.target.value;
                            setTempTimelineItems(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 text-[11px] mb-0.5">Tiêu đề mốc:</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...tempTimelineItems];
                            updated[idx].title = e.target.value;
                            setTempTimelineItems(updated);
                          }}
                          className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-medium"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[11px] mb-0.5">Mô tả diễn biến:</label>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...tempTimelineItems];
                          updated[idx].description = e.target.value;
                          setTempTimelineItems(updated);
                        }}
                        className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTempTimelineItems([...DEFAULT_TIMELINE_ITEMS])}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại mặc định</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditTimelineModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                  >
                    Lưu các mốc tuần
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Overdue Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl p-5 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Cập nhật bài tập / nhiệm vụ nộp muộn</span>
              </h3>
              <button
                onClick={() => setEditingSubmission(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onSaveSubmission && editingSubmission) {
                  onSaveSubmission(editingSubmission);
                }
                setEditingSubmission(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Trạng thái nộp bài:</label>
                <select
                  value={editingSubmission.status}
                  onChange={(e: any) => setEditingSubmission({ ...editingSubmission, status: e.target.value })}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-200"
                >
                  <option value="ĐÚNG_HẠN">ĐÚNG HẠN (Đã khắc phục / bù bài)</option>
                  <option value="MUỘN">MUỘN</option>
                  <option value="CHƯA_NỘP">CHƯA NỘP</option>
                  <option value="QUÁ_HẠN">QUÁ HẠN</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Số giờ trễ (nếu có):</label>
                  <input
                    type="number"
                    min={0}
                    value={editingSubmission.delayHours}
                    onChange={(e) => setEditingSubmission({ ...editingSubmission, delayHours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Điểm số (nếu có):</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={editingSubmission.score ?? ''}
                    onChange={(e) => setEditingSubmission({
                      ...editingSubmission,
                      score: e.target.value === '' ? undefined : Number(e.target.value)
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Ghi chú của học sinh / giáo viên:</label>
                <textarea
                  rows={2}
                  value={editingSubmission.studentNote || ''}
                  onChange={(e) => setEditingSubmission({ ...editingSubmission, studentNote: e.target.value })}
                  placeholder="Lý do chậm trễ hoặc giải pháp khắc phục..."
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
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
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
