/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  BackupPayload,
  DataQualityIssue,
  CenterConfig,
  TimelineTrendItem,
  LearningTask,
  LearningMaterial,
  StudentProductSubmission,
  DiscussionPost,
  DiscussionComment,
  LearningEvent,
  TrashItem,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_WEEKLY_LEARNING_RECORDS,
  INITIAL_OBSERVATIONS,
  INITIAL_RISK_SIGNALS,
  INITIAL_INTERVENTIONS,
  INITIAL_SELF_CHECKS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_LEARNING_TASKS,
  INITIAL_LEARNING_MATERIALS,
  INITIAL_PRODUCT_SUBMISSIONS,
  INITIAL_DISCUSSION_POSTS,
  INITIAL_LEARNING_EVENTS,
  INITIAL_TRASH_ITEMS,
  CURRENT_TEACHER,
  CURRENT_CLASS,
} from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'adaptive_ai_students_v4',
  ASSIGNMENTS: 'adaptive_ai_assignments_v4',
  SUBMISSIONS: 'adaptive_ai_submissions_v4',
  RECORDS: 'adaptive_ai_records_v4',
  OBSERVATIONS: 'adaptive_ai_observations_v4',
  SIGNALS: 'adaptive_ai_signals_v4',
  INTERVENTIONS: 'adaptive_ai_interventions_v4',
  SELF_CHECKS: 'adaptive_ai_self_checks_v4',
  FOCUS_SESSIONS: 'adaptive_ai_focus_sessions_v4',
  AUDIT_LOGS: 'adaptive_ai_audit_logs_v4',
  PRIVACY_MODE: 'adaptive_ai_privacy_mode_v4',
  CENTER_CONFIG: 'adaptive_ai_center_config_v4',
  TIMELINE_CONFIG: 'adaptive_ai_timeline_config_v4',
  LEARNING_TASKS: 'adaptive_ai_learning_tasks_v4',
  LEARNING_MATERIALS: 'adaptive_ai_learning_materials_v4',
  PRODUCT_SUBMISSIONS: 'adaptive_ai_product_submissions_v4',
  DISCUSSIONS: 'adaptive_ai_discussions_v4',
  LEARNING_EVENTS: 'adaptive_ai_learning_events_v4',
  TRASH_ITEMS: 'adaptive_ai_trash_items_v4',
};

export const DEFAULT_CENTER_CONFIG: CenterConfig = {
  badge: 'Giáo viên phụ trách & Chủ nhiệm Lớp',
  title: 'Trung tâm Theo dõi Tiến trình & Tín hiệu Học tập Thích ứng - Lớp',
  description: 'Hệ thống giám sát đa chỉ báo học tập và nề nếp của lớp so sánh trực tiếp với Baseline cá nhân của từng học sinh, phát hiện sớm nguy cơ suy giảm chú ý và trì hoãn nhiệm vụ, đề xuất các hình thức vi phân bài tập mà không chẩn đoán y khoa hay gán nhãn định kiến.',
  q1Label: '1. Ai đang thay đổi?',
  q1Value: '',
  q2Label: '2. Xuất hiện từ khi nào?',
  q2Value: 'Tuần 3 & 4',
  q3Label: '3. Dữ liệu tạo tín hiệu?',
  q3Value: 'Hạn nộp & Tương tác',
  q4Label: '4. Mức quan sát hiện tại?',
  q4Value: 'Mức 1 & Mức 2',
  q5Label: '5. Đề xuất hỗ trợ gì?',
  q5Value: 'Vi phân 15 phút',
  q6Label: '6. Sau hỗ trợ ra sao?',
  q6Value: '1 em đã cải thiện',
};

export const DEFAULT_TIMELINE_ITEMS: TimelineTrendItem[] = [
  {
    id: 'T1',
    phase: 'Tuần 1 - 2',
    title: 'Khởi đầu',
    description: 'Học sinh trong lớp hoàn thành nhiệm vụ học tập ổn định. Thiết lập baseline cá nhân.',
  },
  {
    id: 'T2',
    phase: 'Tuần 3',
    title: 'Tín hiệu sớm',
    description: 'HS04 và HS06 bắt đầu có dấu hiệu nộp báo cáo muộn hoặc ít giơ tay phát biểu.',
  },
  {
    id: 'T3',
    phase: 'Tuần 4',
    title: 'Phát hiện & Hỗ trợ',
    description: 'Xu hướng kéo dài kích hoạt cảnh báo Mức 2. Giáo viên triển khai kế hoạch vi phân 15 phút.',
  },
  {
    id: 'T4',
    phase: 'Kết quả',
    title: 'Turnaround & Cải thiện',
    description: 'HS07 phục hồi hoàn toàn sau can thiệp, chuyển trạng thái "Đã cải thiện".',
  },
];

class StorageService {
  constructor() {
    this.ensureConsistency();
  }

  ensureConsistency() {
    try {
      const versionKey = 'adaptive_ai_schema_version_11a1';
      const currentVersion = 'v4_learning_corner_31stu';
      const storedVersion = typeof localStorage !== 'undefined' ? localStorage.getItem(versionKey) : null;

      if (storedVersion !== currentVersion) {
        this.resetToDemo();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(versionKey, currentVersion);
        }
        return;
      }

      // Check students consistency
      const students = this.getStudents();
      let hasChanges = false;
      students.forEach((s) => {
        if (s.classId !== 'LOP_11A1') {
          s.classId = 'LOP_11A1';
          hasChanges = true;
        }
      });
      if (hasChanges) {
        this.saveStudents(students);
      }
    } catch (e) {
      console.warn('Storage consistency check error:', e);
    }
  }
  // Getters
  getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      this.saveStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  saveStudents(students: Student[]) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  getAssignments(): Assignment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!raw) {
      this.saveAssignments(INITIAL_ASSIGNMENTS);
      return INITIAL_ASSIGNMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  }

  saveAssignments(assignments: Assignment[]) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  }

  getSubmissions(): AssignmentSubmission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      this.saveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  }

  saveSubmissions(submissions: AssignmentSubmission[]) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }

  getLearningRecords(): WeeklyLearningRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      this.saveLearningRecords(INITIAL_WEEKLY_LEARNING_RECORDS);
      return INITIAL_WEEKLY_LEARNING_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WEEKLY_LEARNING_RECORDS;
    }
  }

  saveLearningRecords(records: WeeklyLearningRecord[]) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  getObservations(): TeacherObservation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OBSERVATIONS);
    if (!raw) {
      this.saveObservations(INITIAL_OBSERVATIONS);
      return INITIAL_OBSERVATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_OBSERVATIONS;
    }
  }

  saveObservations(obs: TeacherObservation[]) {
    localStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(obs));
  }

  getSignals(): RiskSignal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SIGNALS);
    if (!raw) {
      this.saveSignals(INITIAL_RISK_SIGNALS);
      return INITIAL_RISK_SIGNALS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RISK_SIGNALS;
    }
  }

  saveSignals(signals: RiskSignal[]) {
    localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(signals));
  }

  getInterventions(): InterventionPlan[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
    if (!raw) {
      this.saveInterventions(INITIAL_INTERVENTIONS);
      return INITIAL_INTERVENTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_INTERVENTIONS;
    }
  }

  saveInterventions(plans: InterventionPlan[]) {
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(plans));
  }

  getSelfChecks(): StudentSelfCheck[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SELF_CHECKS);
    if (!raw) {
      this.saveSelfChecks(INITIAL_SELF_CHECKS);
      return INITIAL_SELF_CHECKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SELF_CHECKS;
    }
  }

  saveSelfChecks(checks: StudentSelfCheck[]) {
    localStorage.setItem(STORAGE_KEYS.SELF_CHECKS, JSON.stringify(checks));
  }

  getFocusSessions(): FocusSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    if (!raw) {
      this.saveFocusSessions(INITIAL_FOCUS_SESSIONS);
      return INITIAL_FOCUS_SESSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_FOCUS_SESSIONS;
    }
  }

  saveFocusSessions(sessions: FocusSession[]) {
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
  }

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      this.saveAuditLogs(INITIAL_AUDIT_LOGS);
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  saveAuditLogs(logs: AuditLog[]) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  logAction(action: AuditLog['action'], details: string, actorRole: AuditLog['actorRole'] = 'GIÁO_VIÊN', actorName = CURRENT_TEACHER.name) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      actorName,
      actorRole,
      action,
      details,
    };
    logs.unshift(newLog);
    this.saveAuditLogs(logs);
  }

  getPrivacyMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.PRIVACY_MODE) === 'true';
  }

  setPrivacyMode(val: boolean) {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, val ? 'true' : 'false');
    this.logAction(val ? 'BẬT_PRIVACY_MODE' : 'TẮT_PRIVACY_MODE', `Người dùng đã ${val ? 'bật' : 'tắt'} chế độ bảo mật danh tính.`);
  }

  getCenterConfig(): CenterConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.CENTER_CONFIG);
    if (!raw) return DEFAULT_CENTER_CONFIG;
    try {
      return { ...DEFAULT_CENTER_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CENTER_CONFIG;
    }
  }

  saveCenterConfig(config: CenterConfig) {
    localStorage.setItem(STORAGE_KEYS.CENTER_CONFIG, JSON.stringify(config));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', 'Cập nhật cấu hình tiêu đề và nội dung Trung tâm Theo dõi Tiến trình.');
  }

  getTimelineConfig(): TimelineTrendItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMELINE_CONFIG);
    if (!raw) return DEFAULT_TIMELINE_ITEMS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TIMELINE_ITEMS;
    } catch {
      return DEFAULT_TIMELINE_ITEMS;
    }
  }

  saveTimelineConfig(items: TimelineTrendItem[]) {
    localStorage.setItem(STORAGE_KEYS.TIMELINE_CONFIG, JSON.stringify(items));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', 'Cập nhật diễn biến chuỗi thời gian xu hướng học tập.');
  }

  // Quality check for Data Quality Center
  auditDataQuality(): DataQualityIssue[] {
    const students = this.getStudents();
    const records = this.getLearningRecords();
    const selfChecks = this.getSelfChecks();
    const issues: DataQualityIssue[] = [];

    students.forEach((stu) => {
      const stuRecords = records.filter((r) => r.studentId === stu.id);
      
      // Case: Insufficient weeks
      if (stuRecords.length < 3) {
        issues.push({
          id: `ISSUE_${stu.id}_WEEKS`,
          studentId: stu.id,
          studentCode: stu.code,
          type: 'CHƯA_ĐỦ_TUẦN',
          description: `Học sinh mới chỉ có dữ liệu ${stuRecords.length} tuần (cần tối thiểu 3 tuần để lập baseline).`,
          impact: 'Hệ thống tự động khóa cảnh báo để chống suy diễn sai lệch.',
          actionRequired: 'Tiếp tục tích lũy dữ liệu định kỳ thêm 2 tuần.',
        });
      }

      // Check self-check participation
      const hasSelfCheck = selfChecks.some((sc) => sc.studentId === stu.id);
      if (!hasSelfCheck && stuRecords.length >= 3) {
        issues.push({
          id: `ISSUE_${stu.id}_SELFCHECK`,
          studentId: stu.id,
          studentCode: stu.code,
          type: 'THIẾU_DỮ_LIỆU',
          description: 'Chưa có dữ liệu tự phản tư (Student Self-Check) từ góc nhìn của học sinh.',
          impact: 'AI thiếu thông tin bối cảnh cá nhân khi đưa ra giả thuyết hỗ trợ.',
          actionRequired: 'Khuyến khích học sinh thực hiện phiếu "Em tự kiểm tra tiến độ".',
        });
      }
    });

    return issues;
  }

  // Export full JSON Backup conforming to Requirement 28
  exportBackupJson(): string {
    const payload: BackupPayload = {
      appName: 'ADAPTIVE STUDENT SUPPORT AI',
      appVersion: '1.0.0',
      schemaVersion: '1.2.0',
      schoolYear: CURRENT_CLASS.academicYear,
      teacherId: CURRENT_TEACHER.id,
      classId: CURRENT_CLASS.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      students: this.getStudents(),
      learningData: this.getLearningRecords(),
      assignments: this.getAssignments(),
      submissions: this.getSubmissions(),
      observations: this.getObservations(),
      signals: this.getSignals(),
      interventions: this.getInterventions(),
      selfChecks: this.getSelfChecks(),
      focusSessions: this.getFocusSessions(),
      auditLogs: this.getAuditLogs(),
    };

    this.logAction('SAO_LƯU_JSON', 'Xuất bản sao lưu dữ liệu toàn hệ thống sang định dạng JSON.');
    return JSON.stringify(payload, null, 2);
  }

  // Restore from JSON Backup
  restoreBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const data: BackupPayload = JSON.parse(jsonString);
      if (!data.appName || !data.schemaVersion || !data.students) {
        return { success: false, error: 'Tệp JSON không đúng cấu trúc quy chuẩn của hệ thống.' };
      }

      this.saveStudents(data.students);
      if (data.learningData) this.saveLearningRecords(data.learningData);
      if (data.assignments) this.saveAssignments(data.assignments);
      if (data.submissions) this.saveSubmissions(data.submissions);
      if (data.observations) this.saveObservations(data.observations);
      if (data.signals) this.saveSignals(data.signals);
      if (data.interventions) this.saveInterventions(data.interventions);
      if (data.selfChecks) this.saveSelfChecks(data.selfChecks);
      if (data.focusSessions) this.saveFocusSessions(data.focusSessions);

      this.logAction('KHÔI_PHỤC_JSON', `Khôi phục dữ liệu từ bản sao lưu phiên bản schema ${data.schemaVersion}.`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi xử lý tệp sao lưu.' };
    }
  }

  // Student CRUD
  addStudent(student: Student) {
    const list = this.getStudents();
    list.push(student);
    this.saveStudents(list);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Thêm mới học sinh ${student.fullName} (${student.code})`);
  }

  addStudents(newStudents: Student[]) {
    if (!newStudents || newStudents.length === 0) return;
    const list = this.getStudents();
    list.push(...newStudents);
    this.saveStudents(list);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Thêm mới ${newStudents.length} học sinh vào lớp từ tệp dữ liệu (Word/PDF/Excel)`);
  }

  updateStudent(student: Student) {
    const list = this.getStudents();
    const idx = list.findIndex((s) => s.id === student.id);
    if (idx !== -1) {
      list[idx] = student;
      this.saveStudents(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật thông tin học sinh ${student.fullName} (${student.code})`);
    }
  }

  deleteStudent(studentId: string) {
    const list = this.getStudents();
    const stu = list.find((s) => s.id === studentId);
    const updated = list.filter((s) => s.id !== studentId);
    this.saveStudents(updated);

    // Also cascade remove associated submissions, signals, observations, interventions
    this.saveLearningRecords(this.getLearningRecords().filter((r) => r.studentId !== studentId));
    this.saveSubmissions(this.getSubmissions().filter((s) => s.studentId !== studentId));
    this.saveObservations(this.getObservations().filter((o) => o.studentId !== studentId));
    this.saveSignals(this.getSignals().filter((s) => s.studentId !== studentId));
    this.saveInterventions(this.getInterventions().filter((i) => i.studentId !== studentId));

    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa học sinh ${stu?.fullName || studentId} khỏi hệ thống`);
  }

  // Learning Records CRUD
  addLearningRecord(record: WeeklyLearningRecord) {
    const list = this.getLearningRecords();
    list.push(record);
    this.saveLearningRecords(list);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Thêm bản ghi học tập tuần ${record.weekNumber} cho học sinh ${record.studentId}`);
  }

  updateLearningRecord(record: WeeklyLearningRecord) {
    const list = this.getLearningRecords();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx !== -1) {
      list[idx] = record;
      this.saveLearningRecords(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật bản ghi học tập tuần ${record.weekNumber} (ID: ${record.id})`);
    }
  }

  deleteLearningRecord(recordId: string) {
    const list = this.getLearningRecords();
    const updated = list.filter((r) => r.id !== recordId);
    this.saveLearningRecords(updated);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa bản ghi học tập ID: ${recordId}`);
  }

  // Assignments CRUD
  addAssignment(assignment: Assignment) {
    const list = this.getAssignments();
    list.unshift(assignment);
    this.saveAssignments(list);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Giao bài tập mới: "${assignment.title}"`);
  }

  updateAssignment(assignment: Assignment) {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === assignment.id);
    if (idx !== -1) {
      list[idx] = assignment;
      this.saveAssignments(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật thông tin bài tập: "${assignment.title}"`);
    }
  }

  deleteAssignment(assignmentId: string) {
    const list = this.getAssignments();
    const target = list.find((a) => a.id === assignmentId);
    const updated = list.filter((a) => a.id !== assignmentId);
    this.saveAssignments(updated);
    this.saveSubmissions(this.getSubmissions().filter((s) => s.assignmentId !== assignmentId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa bài tập: "${target?.title || assignmentId}"`);
  }

  // Submissions CRUD
  updateSubmission(submission: AssignmentSubmission) {
    const list = this.getSubmissions();
    const idx = list.findIndex((s) => s.id === submission.id);
    if (idx !== -1) {
      list[idx] = submission;
      this.saveSubmissions(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật tình trạng bài nộp ID ${submission.id}`);
    } else {
      list.push(submission);
      this.saveSubmissions(list);
    }
  }

  deleteSubmission(submissionId: string) {
    const list = this.getSubmissions();
    this.saveSubmissions(list.filter((s) => s.id !== submissionId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa bài nộp ID ${submissionId}`);
  }

  // Observations CRUD
  addObservation(observation: TeacherObservation) {
    const list = this.getObservations();
    list.unshift(observation);
    this.saveObservations(list);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Thêm nhật ký quan sát cho học sinh ${observation.studentId}`);
  }

  updateObservation(observation: TeacherObservation) {
    const list = this.getObservations();
    const idx = list.findIndex((o) => o.id === observation.id);
    if (idx !== -1) {
      list[idx] = observation;
      this.saveObservations(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật nhật ký quan sát ID ${observation.id}`);
    }
  }

  deleteObservation(observationId: string) {
    const list = this.getObservations();
    this.saveObservations(list.filter((o) => o.id !== observationId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa nhật ký quan sát ID ${observationId}`);
  }

  // Interventions CRUD
  updateIntervention(plan: InterventionPlan) {
    const list = this.getInterventions();
    const idx = list.findIndex((i) => i.id === plan.id);
    if (idx !== -1) {
      list[idx] = plan;
      this.saveInterventions(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật kế hoạch can thiệp "${plan.title}"`);
    }
  }

  deleteIntervention(planId: string) {
    const list = this.getInterventions();
    const target = list.find((i) => i.id === planId);
    this.saveInterventions(list.filter((i) => i.id !== planId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa kế hoạch can thiệp: "${target?.title || planId}"`);
  }

  // Signals CRUD
  addSignal(signal: RiskSignal) {
    const list = this.getSignals();
    const updated = [signal, ...list];
    this.saveSignals(updated);
    this.logAction('TẠO_TÍN_HIỆU', `Tạo mới tín hiệu học tập thích ứng "${signal.title}" cho học sinh ${signal.studentId}`);
  }

  deleteSignal(signalId: string) {
    const list = this.getSignals();
    this.saveSignals(list.filter((s) => s.id !== signalId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã xóa tín hiệu cảnh báo ID ${signalId}`);
  }

  updateSignal(signal: RiskSignal) {
    const list = this.getSignals();
    const idx = list.findIndex((s) => s.id === signal.id);
    if (idx !== -1) {
      list[idx] = signal;
      this.saveSignals(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật tín hiệu học tập thích ứng "${signal.title}"`);
    } else {
      this.addSignal(signal);
    }
  }

  clearAllLearningRecords() {
    this.saveLearningRecords([]);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', 'Đã xóa sạch toàn bộ bản ghi học tập trong hệ thống.');
  }

  // ==========================================
  // GÓC HỌC TẬP - NHIỆM VỤ (TASKS)
  // ==========================================
  getLearningTasks(): LearningTask[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING_TASKS);
    if (!raw) {
      this.saveLearningTasks(INITIAL_LEARNING_TASKS);
      return INITIAL_LEARNING_TASKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LEARNING_TASKS;
    }
  }

  saveLearningTasks(tasks: LearningTask[]) {
    localStorage.setItem(STORAGE_KEYS.LEARNING_TASKS, JSON.stringify(tasks));
  }

  addLearningTask(task: LearningTask) {
    const list = this.getLearningTasks();
    const updated = [task, ...list];
    this.saveLearningTasks(updated);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Tạo nhiệm vụ học tập mới "${task.title}" môn ${task.subject}`);
  }

  updateLearningTask(task: LearningTask) {
    const list = this.getLearningTasks();
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      list[idx] = task;
      this.saveLearningTasks(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật nhiệm vụ học tập "${task.title}"`);
    } else {
      this.addLearningTask(task);
    }
  }

  saveLearningTask(task: LearningTask) {
    this.updateLearningTask(task);
  }

  deleteLearningTask(taskId: string, deletedBy: string = 'Giáo viên'): void {
    const list = this.getLearningTasks();
    const target = list.find((t) => t.id === taskId);
    if (target) {
      this.saveLearningTasks(list.filter((t) => t.id !== taskId));
      this.moveToTrash({
        originalId: target.id,
        itemType: 'TASK',
        itemTypeName: 'Nhiệm vụ học tập',
        title: target.title,
        deletedBy,
        data: target,
      });
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã chuyển nhiệm vụ "${target.title}" vào Thùng rác`);
    }
  }

  // ==========================================
  // GÓC HỌC TẬP - KHO TÀI LIỆU (MATERIALS)
  // ==========================================
  getLearningMaterials(): LearningMaterial[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING_MATERIALS);
    if (!raw) {
      this.saveLearningMaterials(INITIAL_LEARNING_MATERIALS);
      return INITIAL_LEARNING_MATERIALS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LEARNING_MATERIALS;
    }
  }

  saveLearningMaterials(materials: LearningMaterial[]) {
    localStorage.setItem(STORAGE_KEYS.LEARNING_MATERIALS, JSON.stringify(materials));
  }

  addLearningMaterial(material: LearningMaterial) {
    const list = this.getLearningMaterials();
    const updated = [material, ...list];
    this.saveLearningMaterials(updated);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Tải lên tài liệu học tập mới "${material.title}"`);
  }

  updateLearningMaterial(material: LearningMaterial) {
    const list = this.getLearningMaterials();
    const idx = list.findIndex((m) => m.id === material.id);
    if (idx !== -1) {
      list[idx] = material;
      this.saveLearningMaterials(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật thông tin tài liệu "${material.title}"`);
    } else {
      this.addLearningMaterial(material);
    }
  }

  saveLearningMaterial(material: LearningMaterial) {
    this.updateLearningMaterial(material);
  }

  deleteLearningMaterial(materialId: string, deletedBy: string = 'Giáo viên'): void {
    const list = this.getLearningMaterials();
    const target = list.find((m) => m.id === materialId);
    if (target) {
      this.saveLearningMaterials(list.filter((m) => m.id !== materialId));
      this.moveToTrash({
        originalId: target.id,
        itemType: 'MATERIAL',
        itemTypeName: 'Tài liệu học tập',
        title: target.title,
        deletedBy,
        data: target,
      });
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Đã chuyển tài liệu "${target.title}" vào Thùng rác`);
    }
  }

  incrementMaterialDownloadCount(materialId: string) {
    const list = this.getLearningMaterials();
    const idx = list.findIndex((m) => m.id === materialId);
    if (idx !== -1) {
      list[idx].downloadCount = (list[idx].downloadCount || 0) + 1;
      this.saveLearningMaterials(list);
    }
  }

  // ==========================================
  // GÓC HỌC TẬP - NỘP BÀI & SẢN PHẨM (SUBMISSIONS)
  // ==========================================
  getProductSubmissions(): StudentProductSubmission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCT_SUBMISSIONS);
    if (!raw) {
      this.saveProductSubmissions(INITIAL_PRODUCT_SUBMISSIONS);
      return INITIAL_PRODUCT_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRODUCT_SUBMISSIONS;
    }
  }

  saveProductSubmissions(submissions: StudentProductSubmission[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCT_SUBMISSIONS, JSON.stringify(submissions));
  }

  addProductSubmission(sub: StudentProductSubmission) {
    const list = this.getProductSubmissions();
    const updated = [sub, ...list];
    this.saveProductSubmissions(updated);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Học sinh ${sub.studentName} nộp sản phẩm cho nhiệm vụ "${sub.taskTitle}"`, 'HỌC_SINH', sub.studentName);
    this.logLearningEvent({
      studentId: sub.studentId,
      studentCode: sub.studentCode,
      eventType: 'SUBMIT_ASSIGNMENT',
      title: 'Nộp sản phẩm học tập',
      details: `Nộp bài cho "${sub.taskTitle}" - Trạng thái: ${sub.status}.`,
      metadata: { taskId: sub.taskId, submissionId: sub.id },
    });
  }

  updateProductSubmission(sub: StudentProductSubmission) {
    const list = this.getProductSubmissions();
    const idx = list.findIndex((s) => s.id === sub.id);
    if (idx !== -1) {
      list[idx] = sub;
      this.saveProductSubmissions(list);
      this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật sản phẩm nộp "${sub.title}" của học sinh ${sub.studentName}`);
    } else {
      this.addProductSubmission(sub);
    }
  }

  saveProductSubmission(sub: StudentProductSubmission) {
    this.updateProductSubmission(sub);
  }

  deleteProductSubmission(subId: string, deletedBy: string = 'Học sinh'): void {
    const list = this.getProductSubmissions();
    const target = list.find((s) => s.id === subId);
    if (target) {
      this.saveProductSubmissions(list.filter((s) => s.id !== subId));
      this.moveToTrash({
        originalId: target.id,
        itemType: 'SUBMISSION',
        itemTypeName: 'Bài nộp sản phẩm',
        title: target.title || `Bài nộp của ${target.studentName}`,
        deletedBy,
        data: target,
      });
    }
  }

  // ==========================================
  // GÓC HỌC TẬP - THẢO LUẬN (DISCUSSIONS)
  // ==========================================
  getDiscussions(): DiscussionPost[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DISCUSSIONS);
    if (!raw) {
      this.saveDiscussions(INITIAL_DISCUSSION_POSTS);
      return INITIAL_DISCUSSION_POSTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DISCUSSION_POSTS;
    }
  }

  saveDiscussions(posts: DiscussionPost[]) {
    localStorage.setItem(STORAGE_KEYS.DISCUSSIONS, JSON.stringify(posts));
  }

  addDiscussionPost(post: DiscussionPost) {
    const list = this.getDiscussions();
    const updated = [post, ...list];
    this.saveDiscussions(updated);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `${post.authorName} tạo chủ đề thảo luận mới "${post.title}"`);
    if (post.authorRole === 'HỌC_SINH') {
      this.logLearningEvent({
        studentId: post.authorId,
        studentCode: post.authorId.replace('STU_', 'HS'),
        eventType: 'JOIN_DISCUSSION',
        title: 'Tạo chủ đề thảo luận',
        details: `Đăng bài thảo luận: "${post.title}".`,
        metadata: { postId: post.id },
      });
    }
  }

  updateDiscussionPost(post: DiscussionPost) {
    const list = this.getDiscussions();
    const idx = list.findIndex((p) => p.id === post.id);
    if (idx !== -1) {
      list[idx] = post;
      this.saveDiscussions(list);
    }
  }

  deleteDiscussionPost(postId: string, deletedBy: string = 'Người dùng'): void {
    const list = this.getDiscussions();
    const target = list.find((p) => p.id === postId);
    if (target) {
      this.saveDiscussions(list.filter((p) => p.id !== postId));
      this.moveToTrash({
        originalId: target.id,
        itemType: 'DISCUSSION_POST',
        itemTypeName: 'Bài viết thảo luận',
        title: target.title,
        deletedBy,
        data: target,
      });
    }
  }

  addDiscussionComment(postId: string, comment: DiscussionComment) {
    const list = this.getDiscussions();
    const post = list.find((p) => p.id === postId);
    if (post) {
      post.comments = [...(post.comments || []), comment];
      this.saveDiscussions(list);
      if (comment.authorRole === 'HỌC_SINH') {
        this.logLearningEvent({
          studentId: comment.authorId,
          studentCode: comment.authorId.replace('STU_', 'HS'),
          eventType: 'JOIN_DISCUSSION',
          title: 'Bình luận thảo luận',
          details: `Gửi phản hồi trong chủ đề "${post.title}".`,
          metadata: { postId, commentId: comment.id },
        });
      }
    }
  }

  deleteDiscussionComment(postId: string, commentId: string, deletedBy: string = 'Người dùng'): void {
    const list = this.getDiscussions();
    const post = list.find((p) => p.id === postId);
    if (post) {
      const commentTarget = post.comments.find((c) => c.id === commentId);
      if (commentTarget) {
        post.comments = post.comments.filter((c) => c.id !== commentId);
        this.saveDiscussions(list);
        this.moveToTrash({
          originalId: commentTarget.id,
          itemType: 'DISCUSSION_COMMENT',
          itemTypeName: 'Bình luận thảo luận',
          title: `Bình luận của ${commentTarget.authorName}`,
          deletedBy,
          data: { postId, comment: commentTarget },
        });
      }
    }
  }

  // ==========================================
  // LEARNING EVENTS (Sự kiện học tập thật)
  // ==========================================
  getLearningEvents(): LearningEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING_EVENTS);
    if (!raw) {
      this.saveLearningEvents(INITIAL_LEARNING_EVENTS);
      return INITIAL_LEARNING_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LEARNING_EVENTS;
    }
  }

  saveLearningEvents(events: LearningEvent[]) {
    localStorage.setItem(STORAGE_KEYS.LEARNING_EVENTS, JSON.stringify(events));
  }

  logLearningEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>): LearningEvent {
    const created: LearningEvent = {
      ...event,
      id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    const list = this.getLearningEvents();
    const updated = [created, ...list];
    this.saveLearningEvents(updated);
    return created;
  }

  // ==========================================
  // THÙNG RÁC HỆ THỐNG (TRASH BIN)
  // ==========================================
  getTrashItems(): TrashItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRASH_ITEMS);
    if (!raw) {
      this.saveTrashItems(INITIAL_TRASH_ITEMS);
      return INITIAL_TRASH_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRASH_ITEMS;
    }
  }

  saveTrashItems(items: TrashItem[]) {
    localStorage.setItem(STORAGE_KEYS.TRASH_ITEMS, JSON.stringify(items));
  }

  moveToTrash(item: Omit<TrashItem, 'id' | 'deletedAt'>): TrashItem {
    const trashItem: TrashItem = {
      ...item,
      id: `TRASH_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      deletedAt: new Date().toISOString(),
    };
    const list = this.getTrashItems();
    const updated = [trashItem, ...list];
    this.saveTrashItems(updated);
    return trashItem;
  }

  restoreFromTrash(trashId: string): boolean {
    const list = this.getTrashItems();
    const target = list.find((t) => t.id === trashId);
    if (!target) return false;

    // Restore based on item type
    switch (target.itemType) {
      case 'TASK':
        this.addLearningTask(target.data);
        break;
      case 'MATERIAL':
        this.addLearningMaterial(target.data);
        break;
      case 'SUBMISSION':
        this.addProductSubmission(target.data);
        break;
      case 'DISCUSSION_POST':
        this.addDiscussionPost(target.data);
        break;
      case 'DISCUSSION_COMMENT':
        if (target.data?.postId && target.data?.comment) {
          this.addDiscussionComment(target.data.postId, target.data.comment);
        }
        break;
      case 'STUDENT':
        this.addStudent(target.data);
        break;
      case 'OBSERVATION':
        this.addObservation(target.data);
        break;
      case 'INTERVENTION':
        this.saveInterventions([target.data, ...this.getInterventions()]);
        break;
    }

    this.saveTrashItems(list.filter((t) => t.id !== trashId));
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Khôi phục thành công "${target.title}" từ Thùng rác`);
    return true;
  }

  deleteFromTrashPermanently(trashId: string): boolean {
    const list = this.getTrashItems();
    this.saveTrashItems(list.filter((t) => t.id !== trashId));
    return true;
  }

  emptyTrash(): void {
    this.saveTrashItems([]);
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', 'Đã dọn sạch thùng rác hệ thống.');
  }

  // Reset to default sample dataset
  resetToDemo(): void {
    this.saveStudents(INITIAL_STUDENTS);
    this.saveAssignments(INITIAL_ASSIGNMENTS);
    this.saveSubmissions(INITIAL_SUBMISSIONS);
    this.saveLearningRecords(INITIAL_WEEKLY_LEARNING_RECORDS);
    this.saveObservations(INITIAL_OBSERVATIONS);
    this.saveSignals(INITIAL_RISK_SIGNALS);
    this.saveInterventions(INITIAL_INTERVENTIONS);
    this.saveSelfChecks(INITIAL_SELF_CHECKS);
    this.saveFocusSessions(INITIAL_FOCUS_SESSIONS);
    this.saveAuditLogs(INITIAL_AUDIT_LOGS);
    this.saveCenterConfig(DEFAULT_CENTER_CONFIG);
    this.saveTimelineConfig(DEFAULT_TIMELINE_ITEMS);
    this.saveLearningTasks(INITIAL_LEARNING_TASKS);
    this.saveLearningMaterials(INITIAL_LEARNING_MATERIALS);
    this.saveProductSubmissions(INITIAL_PRODUCT_SUBMISSIONS);
    this.saveDiscussions(INITIAL_DISCUSSION_POSTS);
    this.saveLearningEvents(INITIAL_LEARNING_EVENTS);
    this.saveTrashItems(INITIAL_TRASH_ITEMS);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('adaptive_ai_schema_version_11a1', 'v4_learning_corner_31stu');
    }
    this.logAction('CHỈNH_SỬA_DỮ_LIỆU', 'Đặt lại bộ dữ liệu mẫu thực nghiệm chuẩn môn Hóa học lớp 11A1 (31 học sinh & Góc học tập).');
  }
}

export const storageService = new StorageService();
