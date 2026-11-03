/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudentStatus = 
  | 'ON_DINH'        // ỔN ĐỊNH
  | 'CAN_QUAN_SAT'   // CẦN QUAN SÁT
  | 'CAN_HO_TRO'     // CẦN HỖ TRỢ
  | 'DANG_THEO_DOI'  // ĐANG THEO DÕI
  | 'DA_CAI_THIEN';  // ĐÃ CẢI THIỆN

export type WarningLevel = 0 | 1 | 2 | 3;

export interface WarningLevelMeta {
  level: WarningLevel;
  name: string;
  description: string;
  colorClass: string;
  badgeBg: string;
}

export const WARNING_LEVEL_DEFINITIONS: Record<WarningLevel, WarningLevelMeta> = {
  0: {
    level: 0,
    name: 'MỨC 0 — ỔN ĐỊNH',
    description: 'Không có xu hướng đáng chú ý so với baseline cá nhân.',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  1: {
    level: 1,
    name: 'MỨC 1 — THEO DÕI',
    description: 'Xuất hiện một số thay đổi cần quan sát thêm trong tuần tới.',
    colorClass: 'text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  2: {
    level: 2,
    name: 'MỨC 2 — CẦN HỖ TRỢ',
    description: 'Có nhiều tín hiệu lặp lại hoặc xu hướng kéo dài cần đề xuất can thiệp.',
    colorClass: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  3: {
    level: 3,
    name: 'MỨC 3 — CẦN TRAO ĐỔI',
    description: 'Cần giáo viên kiểm tra trực tiếp và cân nhắc phối hợp với các bên phù hợp.',
    colorClass: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
};

export type SignalFrequency = 'ĐƠN_LẺ' | 'LẶP_LẠI' | 'XU_HƯỚNG_MỚI' | 'KÉO_DÀI';

export type SignalType = 
  | 'SUY_GIẢM_THAM_GIA'
  | 'TRÌ_HOÃN_NHIỆM_VỤ'
  | 'BIẾN_THIÊN_BẤT_THƯỜNG'
  | 'CẦN_THÊM_DỮ_LIỆU';

export interface SignalEvidenceItem {
  indicatorName: string;
  baselineValue: string | number;
  currentValue: string | number;
  delta: string;
  significance: 'BÌNH_THƯỜNG' | 'ĐÁNG_LƯU_Ý' | 'RÕ_RỆT';
}

export interface AIExplanation {
  whatIsChanging: string;
  sinceWhen: string;
  supportingData: string[];
  occurrenceCount: number;
  missingData: string[];
  potentialContextFactors: string[];
  recommendedObservations: string[];
  transparencyRationale: string;
}

export interface RiskSignal {
  id: string;
  studentId: string;
  detectedDate: string;
  type: SignalType;
  level: WarningLevel;
  frequency: SignalFrequency;
  confidenceScore: number; // 0 - 100
  title: string;
  evidence: {
    primaryIndicators: SignalEvidenceItem[];
    observedWeeks: number[];
    dataSufficiency: 'ĐẦY_ĐỦ' | 'THIẾU_MỘT_PHẦN' | 'CHƯA_ĐỦ';
  };
  explanation: AIExplanation;
  status: 'CHỜ_XÁC_NHẬN' | 'ĐÃ_XÁC_NHẬN' | 'ĐANG_CAN_THIỆP' | 'ĐÃ_CẢI_THIỆN' | 'BÁO_ĐỘNG_GIẢ';
  teacherConfirmation?: {
    confirmedAt: string;
    teacherNotes: string;
    actionTaken: 'TẠO_CAN_THIỆP' | 'TIẾP_TỤC_QUAN_SÁT' | 'BỎ_QUA_DO_CÓ_LÝ_DO_CHÍNH_ĐÁNG';
  };
}

export interface StudentBaseline {
  avgScore: number;
  onTimeRate: number; // percentage 0-100
  participationScore: number; // 1 to 5
  avgDelayHours: number;
  focusMinutesAvg: number;
  recordedPeriod: string; // e.g. "Tuần 1 - 4"
}

export interface StudentLearningProfile {
  personalGoals: string[];
  strengths: string[];
  currentDifficulties: string[];
  taskCompletionHabits: string;
  participationStyle: string;
  triedStrategies: string[];
  effectiveStrategies: string[];
  ineffectiveStrategies: string[];
  lastUpdated: string;
}

export interface Student {
  id: string;
  code: string; // "HS01", "HS02" - for privacy mode
  fullName: string;
  birthDate: string;
  classId: string;
  gender: 'Nam' | 'Nữ';
  currentStatus: StudentStatus;
  warningLevel: WarningLevel;
  activeSignalsCount: number;
  activeInterventionsCount: number;
  baseline: StudentBaseline;
  profile: StudentLearningProfile;
  lastDataUpdate: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  subject: string;
  title: string;
  assignedDate: string;
  dueDate: string;
  estimatedMinutes: number;
  type: 'BÀI_TẬP_VỀ_NHÀ' | 'DỰ_ÁN_NHỎ' | 'PHIẾU_ÔN_TẬP' | 'BÀI_ĐỌC_TRƯỚC';
  maxScore: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string | null;
  status: 'ĐÚNG_HẠN' | 'MUỘN' | 'CHƯA_NỘP' | 'GIA_HẠN';
  delayHours: number;
  extensionCount: number;
  reminderCount: number;
  score?: number;
  studentNote?: string;
}

export interface WeeklyLearningRecord {
  id: string;
  studentId: string;
  weekNumber: number;
  academicWeek: string; // e.g. "Tuần 6 (15/10 - 20/10)"
  testScore: number;
  processScore: number;
  participationLevel: number; // 1 to 5
  tasksAssigned: number;
  tasksCompletedOnTime: number;
  tasksCompletedLate: number;
  tasksOverdue: number;
  reminderCount: number;
  focusMinutesLogged: number;
}

export interface TeacherObservation {
  id: string;
  studentId: string;
  date: string;
  lessonName: string;
  context: 'TRONG_LỚP' | 'BÀI_TẬP_VỀ_NHÀ' | 'HOẠT_ĐỘNG_NHÓM' | 'THỰC_HÀNH';
  neutralDescription: string;
  observedBehaviors: string[];
  followUpRecommended: boolean;
}

export type InterventionTargetArea = 
  | 'CHIA_NHỎ_NHIỆM_VỤ'
  | 'TƯƠNG_TÁC_NGẮN'
  | 'NHẮC_NHỞ_CHỦ_ĐỘNG'
  | 'TỰ_QUẢN_TIẾN_ĐỘ'
  | 'TRAO_ĐỔI_ĐỘNG_VIÊN';

export interface MetricSnapshot {
  onTimeRate: number;
  participationScore: number;
  overdueCount: number;
  avgScore: number;
  focusMinutesWeekly: number;
  capturedDate: string;
}

export interface InterventionPlan {
  id: string;
  studentId: string;
  title: string;
  goal: string;
  targetArea: InterventionTargetArea;
  strategyDescription: string;
  microTasks: string[];
  startDate: string;
  endDate: string;
  durationWeeks: number;
  teacherInCharge: string;
  targetIndicator: string;
  successCriteria: string;
  status: 'ĐỀ_XUẤT_AI' | 'ĐANG_THỰC_HIỆN' | 'ĐÃ_HOÀN_THÀNH' | 'ĐIỀU_CHỈNH' | 'TỪ_CHỐI';
  beforeMetrics: MetricSnapshot;
  afterMetrics?: MetricSnapshot;
  teacherNotes?: string;
  evaluationResult?: 'HIỆU_QUẢ' | 'HIỆU_QUẢ_MỘT_PHẦN' | 'CHƯA_HIỆU_QUẢ' | 'KHÔNG_PHÙ_HỢP';
  studentFeedback?: {
    easeOfExecution: 'DỄ' | 'VỪA_SỨC' | 'KHÓ';
    helpfulness: 'RẤT_HỮU_ÍCH' | 'TƯƠNG_ĐỐI' | 'CHƯA_THẤY_RÕ';
    comment: string;
    submittedDate: string;
  };
  adaptationNotes?: string;
}

export interface StudentSelfCheck {
  id: string;
  studentId: string;
  date: string;
  completedItems: string[];
  challengesEncountered: string;
  startedOnTime: boolean;
  interruptionCauses: string[];
  requestedSupport: string;
  readinessRating: number; // 1 to 5
}

export interface FocusSession {
  id: string;
  studentId: string;
  taskName: string;
  targetMinutes: number;
  completedMinutes: number;
  startedAt: string;
  endedAt?: string;
  status: 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  completionRate: number; // 0 to 100
  reflectionNotes?: {
    helpedBy: string;
    delayedBy: string;
    nextStep: string;
  };
}

export interface Classroom {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  homeroomTeacher: string;
  studentCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  school: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'GIÁO_VIÊN' | 'HỌC_SINH' | 'HỆ_THỐNG';
  action: 
    | 'XEM_DỮ_LIỆU'
    | 'CHỈNH_SỬA_DỮ_LIỆU'
    | 'TẠO_TÍN_HIỆU'
    | 'XÁC_NHẬN_CẢNH_BÁO'
    | 'TẠO_KẾ_HOẠCH'
    | 'CHẤP_NHẬN_ĐỀ_XUẤT_AI'
    | 'TỪ_CHỐI_ĐỀ_XUẤT_AI'
    | 'ĐIỀU_CHỈNH_HỖ_TRỢ'
    | 'BẬT_PRIVACY_MODE'
    | 'TẮT_PRIVACY_MODE'
    | 'SAO_LƯU_JSON'
    | 'KHÔI_PHỤC_JSON';
  details: string;
}

export interface BackupPayload {
  appName: string;
  appVersion: string;
  schemaVersion: string;
  schoolYear: string;
  teacherId: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
  students: Student[];
  learningData: WeeklyLearningRecord[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  observations: TeacherObservation[];
  signals: RiskSignal[];
  interventions: InterventionPlan[];
  selfChecks: StudentSelfCheck[];
  focusSessions: FocusSession[];
  auditLogs: AuditLog[];
}

export interface DataQualityIssue {
  id: string;
  studentId: string;
  studentCode: string;
  type: 'THIẾU_DỮ_LIỆU' | 'BẤT_THƯỜNG' | 'DỮ_LIỆU_CŨ' | 'CHƯA_ĐỦ_TUẦN';
  description: string;
  impact: string;
  actionRequired: string;
}

export interface CenterConfig {
  badge: string;
  title: string;
  description: string;
  q1Label: string;
  q1Value: string;
  q2Label: string;
  q2Value: string;
  q3Label: string;
  q3Value: string;
  q4Label: string;
  q4Value: string;
  q5Label: string;
  q5Value: string;
  q6Label: string;
  q6Value: string;
}

export interface TimelineTrendItem {
  id: string;
  phase: string;
  title: string;
  description: string;
}

// 3 MỨC ĐỘ NHẬN THỨC BẮT BUỘC: BIẾT, HIỂU, VẬN DỤNG
export type CognitiveLevel = 'KNOW' | 'UNDERSTAND' | 'APPLY';

export const COGNITIVE_LEVEL_META: Record<CognitiveLevel, { name: string; shortName: string; color: string; badgeClass: string; description: string }> = {
  KNOW: {
    name: 'BIẾT (Nhận biết)',
    shortName: 'BIẾT',
    color: '#3b82f6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    description: 'Nhận diện khái niệm, công thức, hiện tượng, định lý cơ bản SGK.',
  },
  UNDERSTAND: {
    name: 'HIỂU (Thông hiểu)',
    shortName: 'HIỂU',
    color: '#8b5cf6',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description: 'Giải thích bản chất, phân biệt, so sánh, minh họa phương trình và cơ chế.',
  },
  APPLY: {
    name: 'VẬN DỤNG',
    shortName: 'VẬN DỤNG',
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Tính toán định lượng, giải quyết tình huống thực tiễn, thí nghiệm và bài toán tổng hợp.',
  },
};

// Learning Event System for logging learning activities
export interface LearningEvent {
  id: string;
  studentId: string;
  studentCode: string;
  eventType: 
    | 'VIEW_DOCUMENT'
    | 'SUBMIT_ASSIGNMENT'
    | 'LATE_SUBMIT'
    | 'START_EXAM'
    | 'FINISH_EXAM'
    | 'VIEW_FEEDBACK'
    | 'JOIN_DISCUSSION'
    | 'DOWNLOAD_MATERIAL'
    | 'START_FOCUS'
    | 'COMPLETE_FOCUS'
    | 'SELF_CHECK';
  timestamp: string;
  title: string;
  details: string;
  metadata?: Record<string, any>;
}

// File Attachment Metadata
export interface FileAttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  url?: string;
  indexedDbKey?: string;
  previewAvailable?: boolean;
}

// Learning Task for "Góc học tập - Nhiệm vụ"
export interface LearningTask {
  id: string;
  classId: string;
  subject: string; // Mặc định: 'Hóa học'
  topic: string;
  title: string;
  description: string;
  requirements: string;
  dueDate: string;
  assignedDate: string;
  attachments: FileAttachmentMeta[];
  cognitiveLevel: CognitiveLevel; // Bắt buộc
  supportLevelTarget?: WarningLevel; // Hỗ trợ giao nhiệm vụ cá nhân hóa theo mức hỗ trợ (Mức 0, 1, 2, 3)
  status: 'DANG_THUC_HIEN' | 'SAP_DEN_HAN' | 'QUA_HAN' | 'DA_HOAN_THANH';
  isAcceptingSubmissions: boolean; // Khóa / mở nhận bài
  createdAt: string;
  isDemo: boolean;
}

// Material for "Góc học tập - Kho tài liệu"
export type MaterialCategory = 
  | 'HOC_TAP'
  | 'BAI_TAP'
  | 'DE_CUONG'
  | 'ON_TAP'
  | 'THAM_KHAO'
  | 'VIDEO'
  | 'AM_THANH'
  | 'DU_LIEU'
  | 'KHAC';

export type MaterialPermission = 
  | 'CHI_XEM'
  | 'CHINH_SUA'
  | 'CONG_TAC_NHOM'
  | 'TOAN_LOP';

export interface LearningMaterial {
  id: string;
  title: string;
  category: MaterialCategory;
  subject: string;
  topic: string;
  description: string;
  permission: MaterialPermission;
  fileMeta: FileAttachmentMeta;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
  isDemo: boolean;
}

// Product & Submission for "Góc học tập - Nộp bài & Sản phẩm"
export type SubmissionStatus = 
  | 'CHUA_NOP'
  | 'NHAP'
  | 'DA_NOP'
  | 'DA_NHAN_XET'
  | 'DA_HOAN_THANH'
  | 'CAN_NOP_LAI';

export interface StudentProductSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  title: string;
  description: string;
  studentNotes: string;
  files: FileAttachmentMeta[];
  status: SubmissionStatus;
  submittedAt: string;
  resubmissionCount: number;
  cognitiveLevel: CognitiveLevel;
  score?: number;
  teacherFeedback?: {
    comment: string;
    score?: number;
    feedbackAt: string;
    teacherName: string;
  };
  isDemo: boolean;
}

// Discussion for "Góc học tập - Thảo luận"
export interface DiscussionComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'GIÁO_VIÊN' | 'HỌC_SINH';
  content: string;
  createdAt: string;
}

export interface DiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'GIÁO_VIÊN' | 'HỌC_SINH';
  title: string;
  content: string;
  topic: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  likes: number;
  likeCount?: number;
  comments: DiscussionComment[];
  isPinned?: boolean;
}

// Trash item model for Safe Delete / Restore
export interface TrashItem {
  id: string;
  originalId: string;
  itemType: 'TASK' | 'MATERIAL' | 'SUBMISSION' | 'DISCUSSION_POST' | 'DISCUSSION_COMMENT' | 'STUDENT' | 'OBSERVATION' | 'INTERVENTION';
  itemTypeName: string;
  title: string;
  deletedAt: string;
  deletedBy: string;
  data: any;
}
