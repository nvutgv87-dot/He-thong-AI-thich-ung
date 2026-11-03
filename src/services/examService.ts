import {
  ExamPaper,
  QuestionBankItem,
  StudentExamResult,
  AIChatSession,
  ResearchExperimentRecord,
  ExamVerificationResult,
  ExamQuestion,
  ExamMatrixItem,
  ExamSpecificationItem,
} from '../types/examTypes';
import { CognitiveLevel } from '../types/index';
import { INITIAL_QUESTION_BANK } from '../data/chemistryQuestionBank';
import { MULTI_SUBJECT_QUESTION_BANK } from '../data/subjectCurriculumBank';
import { CURRICULUM_AUTHENTIC_QUESTIONS } from '../data/curriculumQuestionsData';
import { storageService } from './storageService';
import { calculateStructurePoints, calculateTrueFalseScore } from '../utils/scoreUtils';

const ALL_SEED_QUESTIONS = [
  ...INITIAL_QUESTION_BANK,
  ...MULTI_SUBJECT_QUESTION_BANK,
  ...CURRICULUM_AUTHENTIC_QUESTIONS,
];

const STORAGE_KEYS = {
  EXAMS: 'adaptive_ai_exams_v1',
  QUESTION_BANK: 'adaptive_ai_question_bank_v1',
  EXAM_RESULTS: 'adaptive_ai_exam_results_v1',
  CHAT_SESSIONS: 'adaptive_ai_chat_sessions_v1',
  RESEARCH_RECORDS: 'adaptive_ai_research_records_v1',
};

// Initial Demo Exam: Đề Kiểm Tra Định Kỳ Giữa Học Kỳ - Hóa Học 11
export const INITIAL_DEMO_EXAMS: ExamPaper[] = [
  {
    id: 'EXAM_HOA11_GK1_01',
    code: 'HOA11_GK1_01',
    title: 'Đề kiểm tra định kỳ Hóa học 11 - Chương 5 & 6 (Bộ SGK Kết nối tri thức)',
    subject: 'Hóa học',
    grade: 11,
    curriculum: 'Kết nối tri thức',
    chapter: 'Chương 5 & 6: Dẫn xuất Halogen - Alcohol - Phenol & Carbonyl',
    topic: 'Alcohol, Phenol, Hợp chất Carbonyl & Carboxylic Acid',
    durationMinutes: 45,
    totalQuestions: 21,
    totalPoints: 10.0,
    ratio: {
      know: 40,
      understand: 40,
      apply: 20,
    },
    structure: {
      part1Count: 12,
      part2Count: 2,
      part3Count: 6,
      part4Count: 1,
    },
    status: 'PHAT_HANH',
    aiVerification: {
      status: 'HOP_LE',
      summary: 'Đề thi khớp 100% Ma trận và Đặc tả, thang điểm 10,0đ phân bổ chính xác theo 4 phần.',
      issues: [
        {
          type: 'INFO',
          message: 'Tỷ lệ nhận thức đạt chuẩn: 40% BIẾT (4,0đ), 40% HIỂU (4,0đ), 20% VẬN DỤNG (2,0đ).',
        },
      ],
      checkedAt: new Date().toISOString(),
      checkedByAI: true,
    },
    assignedClasses: ['11A1'],
    shareableLink: `${window.location.origin}?exam=HOA11_GK1_01`,
    createdBy: 'Thầy Nguyễn Vũ (GV Hóa học 11A1)',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    isDemo: true,
    matrix: [
      {
        topic: 'Dẫn xuất Halogen - Alcohol - Phenol',
        chapter: 'Chương 5',
        knowCount: 7,
        understandCount: 3,
        applyCount: 1,
        knowPoints: 3.0,
        understandPoints: 1.0,
        applyPoints: 1.0,
        totalPoints: 5.0,
        percentage: 50,
      },
      {
        topic: 'Hợp chất Carbonyl & Carboxylic Acid',
        chapter: 'Chương 6',
        knowCount: 4,
        understandCount: 5,
        applyCount: 1,
        knowPoints: 1.0,
        understandPoints: 3.0,
        applyPoints: 1.0,
        totalPoints: 5.0,
        percentage: 50,
      },
    ],
    specifications: INITIAL_QUESTION_BANK.map((q) => ({
      id: `spec_${q.questionNumber}`,
      chapter: q.chapter || 'Chương 5 & 6: Dẫn xuất Halogen - Alcohol - Phenol & Carbonyl',
      topic: q.topic || 'Hóa học hữu cơ 11',
      competencyRequirement:
        q.curriculumRequirement ||
        `Đánh giá mức độ ${q.cognitive_level} bài học ${q.topic}`,
      cognitive_level: q.cognitive_level,
      section: q.section,
      questionNumber: q.questionNumber,
      points: q.points,
      questionPreview: q.content.slice(0, 60),
    })),
    questions: INITIAL_QUESTION_BANK,
  },
];

class ExamService {
  // ==========================================
  // EXAMS CRUD
  // ==========================================
  buildMatrixFromQuestions(
    questions: ExamQuestion[],
    defaultChapter: string,
    defaultTopic: string,
    targetTotalPoints: number = 10.0
  ): ExamMatrixItem[] {
    if (!questions || questions.length === 0) {
      return [
        {
          topic: defaultTopic || 'Nội dung kiểm tra',
          chapter: defaultChapter || 'Chương trình',
          knowCount: 4,
          understandCount: 4,
          applyCount: 2,
          knowPoints: 4.0,
          understandPoints: 4.0,
          applyPoints: 2.0,
          totalPoints: 10.0,
          percentage: 100,
        },
      ];
    }

    const groups = new Map<string, { chapter: string; topic: string; questions: ExamQuestion[] }>();

    for (const q of questions) {
      const ch = q.chapter || defaultChapter || 'Chương trình học';
      const top = q.topic || defaultTopic || 'Chủ đề kiến thức';
      const key = `${ch}:::${top}`;
      if (!groups.has(key)) {
        groups.set(key, { chapter: ch, topic: top, questions: [] });
      }
      groups.get(key)!.questions.push(q);
    }

    const totalQuestions = questions.length;
    const items: ExamMatrixItem[] = [];

    groups.forEach(({ chapter, topic, questions: gQuestions }) => {
      const knowCount = gQuestions.filter((q) => q.cognitive_level === 'KNOW').length;
      const understandCount = gQuestions.filter((q) => q.cognitive_level === 'UNDERSTAND').length;
      const applyCount = gQuestions.filter((q) => q.cognitive_level === 'APPLY').length;

      const knowPoints = Math.round(gQuestions.filter((q) => q.cognitive_level === 'KNOW').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;
      const understandPoints = Math.round(gQuestions.filter((q) => q.cognitive_level === 'UNDERSTAND').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;
      const applyPoints = Math.round(gQuestions.filter((q) => q.cognitive_level === 'APPLY').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;

      const rowPoints = Math.round((knowPoints + understandPoints + applyPoints) * 100) / 100;
      const percentage = targetTotalPoints > 0 ? Math.round((rowPoints / targetTotalPoints) * 100) : Math.round((gQuestions.length / totalQuestions) * 100);

      items.push({
        topic,
        chapter,
        knowCount,
        understandCount,
        applyCount,
        knowPoints,
        understandPoints,
        applyPoints,
        totalPoints: rowPoints,
        percentage,
      });
    });

    return items;
  }

  syncExamIntegrity(exam: ExamPaper): ExamPaper {
    if (!exam || !exam.questions || exam.questions.length === 0) return exam;

    // 1. Deduplicate questions & renumber consecutively 1..N
    const seenContents = new Set<string>();
    const uniqueQuestions: ExamQuestion[] = [];
    for (const q of exam.questions) {
      const norm = q.content.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!seenContents.has(norm)) {
        seenContents.add(norm);
        uniqueQuestions.push(q);
      }
    }
    const questions = uniqueQuestions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));

    // 2. Count sections and total questions
    const part1Count = questions.filter((q) => q.section === 'MULTIPLE_CHOICE').length;
    const part2Count = questions.filter((q) => q.section === 'TRUE_FALSE').length;
    const part3Count = questions.filter((q) => q.section === 'SHORT_ANSWER').length;
    const part4Count = questions.filter((q) => q.section === 'ESSAY').length;
    const totalQuestions = questions.length;

    // 3. Calculate points and cognitive levels
    const totalPoints = Math.round(questions.reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;
    const knowPoints = Math.round(questions.filter((q) => q.cognitive_level === 'KNOW').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;
    const understandPoints = Math.round(questions.filter((q) => q.cognitive_level === 'UNDERSTAND').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;
    const applyPoints = Math.round(questions.filter((q) => q.cognitive_level === 'APPLY').reduce((s, q) => s + (Number(q.points) || 0), 0) * 100) / 100;

    let ratio = exam.ratio || { know: 40, understand: 40, apply: 20 };
    if (totalPoints > 0) {
      const kPct = Math.round((knowPoints / totalPoints) * 100);
      const uPct = Math.round((understandPoints / totalPoints) * 100);
      const aPct = 100 - kPct - uPct;
      ratio = { know: kPct, understand: uPct, apply: aPct };
    }

    // 4. Synchronize Specifications 1-to-1 with questions
    const existingSpecs = exam.specifications || [];
    const syncedSpecs: ExamSpecificationItem[] = questions.map((q) => {
      const match = existingSpecs.find((s) => s.questionNumber === q.questionNumber);
      return {
        id: match?.id || `spec_${q.questionNumber}`,
        chapter: q.chapter || match?.chapter || exam.chapter,
        topic: q.topic || match?.topic || exam.topic,
        competencyRequirement:
          q.curriculumRequirement ||
          match?.competencyRequirement ||
          `Đánh giá năng lực môn ${exam.subject} câu ${q.questionNumber} mức độ ${q.cognitive_level}`,
        cognitive_level: q.cognitive_level,
        section: q.section,
        questionNumber: q.questionNumber,
        points: q.points,
        questionPreview: q.content.slice(0, 80),
      };
    });

    // 5. Matrix validation & synchronization
    let matrix = exam.matrix;
    if (!matrix || matrix.length === 0) {
      matrix = this.buildMatrixFromQuestions(questions, exam.chapter, exam.topic, totalPoints);
    } else {
      matrix = matrix.map((row) => {
        const rowPts = Math.round(((Number(row.knowPoints) || 0) + (Number(row.understandPoints) || 0) + (Number(row.applyPoints) || 0)) * 100) / 100;
        const rowPct = totalPoints > 0 ? Math.round((rowPts / totalPoints) * 100) : row.percentage;
        return {
          ...row,
          totalPoints: rowPts,
          percentage: rowPct,
        };
      });
    }

    const syncedExam: ExamPaper = {
      ...exam,
      totalQuestions,
      totalPoints,
      ratio,
      structure: {
        part1Count,
        part2Count,
        part3Count,
        part4Count,
      },
      questions,
      specifications: syncedSpecs,
      matrix,
      updatedAt: exam.updatedAt || new Date().toISOString(),
    };

    syncedExam.aiVerification = this.verifyExamPaper(syncedExam);
    return syncedExam;
  }

  deduplicateExam(exam: ExamPaper): ExamPaper {
    return this.syncExamIntegrity(exam);
  }

  getExams(): ExamPaper[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!raw) {
      const initial = INITIAL_DEMO_EXAMS.map((e) => this.syncExamIntegrity(e));
      this.saveExams(initial);
      return initial;
    }
    try {
      const list: ExamPaper[] = JSON.parse(raw);
      return list.map((e) => this.syncExamIntegrity(e));
    } catch {
      return INITIAL_DEMO_EXAMS.map((e) => this.syncExamIntegrity(e));
    }
  }

  saveExams(exams: ExamPaper[]): void {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  }

  saveExam(exam: ExamPaper): void {
    const cleanExam = this.syncExamIntegrity(exam);
    const list = this.getExams();
    const idx = list.findIndex((e) => e.id === cleanExam.id);
    if (idx !== -1) {
      list[idx] = { ...cleanExam, updatedAt: new Date().toISOString() };
      this.saveExams(list);
      storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Cập nhật đề kiểm tra "${cleanExam.title}" (${cleanExam.code})`);
    } else {
      list.unshift({ ...cleanExam, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      this.saveExams(list);
      storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Tạo đề kiểm tra mới "${cleanExam.title}" (${cleanExam.code})`);
    }
  }

  deleteExam(examId: string, actor: string = 'Giáo viên'): void {
    const list = this.getExams();
    const target = list.find((e) => e.id === examId);
    if (target) {
      this.saveExams(list.filter((e) => e.id !== examId));
      storageService.moveToTrash({
        originalId: target.id,
        itemType: 'TASK',
        itemTypeName: 'Đề kiểm tra',
        title: target.title,
        deletedBy: actor,
        data: target,
      });
      storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Chuyển đề kiểm tra "${target.title}" vào Thùng rác`);
    }
  }

  duplicateExam(examId: string): ExamPaper | null {
    const target = this.getExams().find((e) => e.id === examId);
    if (!target) return null;
    const duplicated: ExamPaper = {
      ...target,
      id: `EXAM_${Date.now()}`,
      code: `${target.code}_BAN_SAO`,
      title: `${target.title} (Bản sao)`,
      status: 'NHAP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveExam(duplicated);
    return duplicated;
  }

  approveExam(examId: string, teacherName: string = 'Giáo viên bộ môn'): void {
    const list = this.getExams();
    const target = list.find((e) => e.id === examId);
    if (target) {
      target.status = 'DA_DUYET';
      target.updatedAt = new Date().toISOString();
      this.saveExams(list);
      storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Giáo viên duyệt đề kiểm tra "${target.title}"`, 'GIÁO_VIÊN', teacherName);
    }
  }

  publishExam(examId: string): void {
    const list = this.getExams();
    const target = list.find((e) => e.id === examId);
    if (target) {
      target.status = 'PHAT_HANH';
      target.updatedAt = new Date().toISOString();
      this.saveExams(list);
      storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Phát hành chính thức đề kiểm tra "${target.title}" cho lớp 11A1`);
    }
  }

  // ==========================================
  // QUESTION BANK
  // ==========================================
  getQuestionBank(): QuestionBankItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
    if (!raw) {
      this.saveQuestionBank(ALL_SEED_QUESTIONS);
      return ALL_SEED_QUESTIONS;
    }
    try {
      const items: QuestionBankItem[] = JSON.parse(raw);
      const existingIds = new Set(items.map((q) => q.id));
      const missing = ALL_SEED_QUESTIONS.filter((q) => !existingIds.has(q.id));
      if (missing.length > 0) {
        const merged = [...items, ...missing];
        this.saveQuestionBank(merged);
        return merged;
      }
      return items;
    } catch {
      return ALL_SEED_QUESTIONS;
    }
  }

  saveQuestionBank(items: QuestionBankItem[]): void {
    localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(items));
  }

  saveQuestionToBank(question: QuestionBankItem): void {
    const list = this.getQuestionBank();
    const idx = list.findIndex((q) => q.id === question.id);
    if (idx !== -1) {
      list[idx] = question;
    } else {
      list.unshift(question);
    }
    this.saveQuestionBank(list);
  }

  saveQuestionBankItem(question: QuestionBankItem): void {
    this.saveQuestionToBank(question);
  }

  deleteQuestionFromBank(id: string): void {
    const list = this.getQuestionBank();
    this.saveQuestionBank(list.filter((q) => q.id !== id));
  }

  deleteQuestionBankItem(id: string): void {
    this.deleteQuestionFromBank(id);
  }

  // ==========================================
  // STUDENT EXAM RESULTS & SUBMISSIONS
  // ==========================================
  getExamResults(examId?: string): StudentExamResult[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_RESULTS);
    let list: StudentExamResult[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    return examId ? list.filter((r) => r.examId === examId) : list;
  }

  saveExamResult(result: StudentExamResult): void {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_RESULTS);
    let list: StudentExamResult[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    const idx = list.findIndex((r) => r.id === result.id);
    if (idx !== -1) {
      list[idx] = result;
    } else {
      list.unshift(result);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_RESULTS, JSON.stringify(list));

    // Log real learning event
    storageService.logLearningEvent({
      studentId: result.studentId,
      studentCode: result.studentCode,
      eventType: 'FINISH_EXAM',
      title: `Hoàn thành bài kiểm tra: ${result.examTitle}`,
      details: `Điểm số: ${result.totalScore}/10đ (I: ${result.scorePart1}đ, II: ${result.scorePart2}đ, III: ${result.scorePart3}đ, IV: ${result.scorePart4}đ). Thời gian làm bài: ${Math.round(result.durationSeconds / 60)} phút.`,
      metadata: {
        examId: result.examId,
        score: result.totalScore,
        cognitiveScores: result.cognitiveScores,
      },
    });
  }

  // ==========================================
  // AI CHAT SESSIONS
  // ==========================================
  getChatSessions(role?: 'TEACHER' | 'STUDENT', studentId?: string): AIChatSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    let list: AIChatSession[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    if (role === 'STUDENT' && studentId) {
      return list.filter((s) => s.role === 'STUDENT' && s.studentId === studentId);
    }
    if (role === 'TEACHER') {
      return list.filter((s) => s.role === 'TEACHER');
    }
    return list;
  }

  saveChatSession(session: AIChatSession): void {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    let list: AIChatSession[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(list));
  }

  deleteChatSession(sessionId: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    let list: AIChatSession[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(list.filter((s) => s.id !== sessionId)));
  }

  // ==========================================
  // RESEARCH EXPERIMENTS (PRE / POST / DELAYED)
  // ==========================================
  getResearchRecords(): ResearchExperimentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESEARCH_RECORDS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveResearchRecord(record: ResearchExperimentRecord): void {
    const list = this.getResearchRecords();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.RESEARCH_RECORDS, JSON.stringify(list));
    storageService.logAction('CHỈNH_SỬA_DỮ_LIỆU', `Ghi nhận dữ liệu nghiên cứu sư phạm [${record.testPhase}] cho nhóm ${record.groupType}`);
  }

  // ==========================================
  // LOCAL OFFLINE EXAM GENERATOR (FALLBACK & SEED)
  // ==========================================
  generateExamOffline(params: {
    subject: string;
    grade: number;
    chapter: string;
    topic: string;
    knowledgeContent?: string;
    learningObjectives?: string;
    teacherCustomPrompt?: string;
    durationMinutes: number;
    ratio: { know: number; understand: number; apply: number };
    structure: { part1Count: number; part2Count: number; part3Count: number; part4Count: number };
  }): ExamPaper {
    const bank = this.getQuestionBank();
    const { part1Count, part2Count, part3Count, part4Count } = params.structure;
    const calc = calculateStructurePoints(params.structure);

    const targetSubject = (params.subject || 'Hóa học').trim().toLowerCase();

    // Filter relevant questions by subject first
    const subjectQuestions = bank.filter(
      (q) => q.subject && q.subject.trim().toLowerCase() === targetSubject
    );

    // Prioritize questions strictly matching the requested topic or chapter
    const targetChapter = (params.chapter || '').trim().toLowerCase();
    const targetTopic = (params.topic || '').trim().toLowerCase();

    const isMatchingTopic = (q: QuestionBankItem) => {
      const qTop = (q.topic || '').toLowerCase();
      const qChap = (q.chapter || '').toLowerCase();
      if (!targetTopic && !targetChapter) return true;
      return (
        (targetTopic && (qTop.includes(targetTopic) || targetTopic.includes(qTop))) ||
        (targetChapter && (qChap.includes(targetChapter) || targetChapter.includes(qChap)))
      );
    };

    const topicQuestions = subjectQuestions.filter(isMatchingTopic);

    // Prefer questions from the specific topic; if not enough, use subject-wide questions
    const poolSource = topicQuestions.length > 0 ? topicQuestions : subjectQuestions;

    const part1Pool = poolSource.filter((q) => q.section === 'MULTIPLE_CHOICE');
    const part2Pool = poolSource.filter((q) => q.section === 'TRUE_FALSE');
    const part3Pool = poolSource.filter((q) => q.section === 'SHORT_ANSWER');
    const part4Pool = poolSource.filter((q) => q.section === 'ESSAY');

    // General fallback pool if subject question pool is limited
    const generalP1 = bank.filter((q) => q.section === 'MULTIPLE_CHOICE');
    const generalP2 = bank.filter((q) => q.section === 'TRUE_FALSE');
    const generalP3 = bank.filter((q) => q.section === 'SHORT_ANSWER');
    const generalP4 = bank.filter((q) => q.section === 'ESSAY');

    const totalQuestions = part1Count + part2Count + part3Count + part4Count;

    // Calculate desired cognitive level counts based on ratio
    const knowTarget = Math.round((totalQuestions * params.ratio.know) / 100);
    const understandTarget = Math.round((totalQuestions * params.ratio.understand) / 100);
    const applyTarget = Math.max(0, totalQuestions - knowTarget - understandTarget);

    const cognitiveDistribution: CognitiveLevel[] = [
      ...Array(knowTarget).fill('KNOW' as CognitiveLevel),
      ...Array(understandTarget).fill('UNDERSTAND' as CognitiveLevel),
      ...Array(applyTarget).fill('APPLY' as CognitiveLevel),
    ];

    const selectedQuestions: ExamQuestion[] = [];
    let qNum = 1;

    // Helper to generate a subject-specific question if pool doesn't have enough
    const synthesizeSubjectQuestion = (
      sec: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY',
      index: number,
      level: CognitiveLevel,
      points: number
    ): ExamQuestion => {
      const subj = params.subject;
      const ch = params.chapter || `Chương trình ${subj} ${params.grade}`;
      const top = params.topic || `Kiến thức trọng tâm ${subj}`;
      const yccd = params.learningObjectives || `Đánh giá mức độ ${level === 'KNOW' ? 'Biết' : level === 'UNDERSTAND' ? 'Hiểu' : 'Vận dụng'} về ${top} theo chương trình GDPT môn ${subj}`;

      if (sec === 'MULTIPLE_CHOICE') {
        const letters = ['A', 'B', 'C', 'D'] as const;
        const correctLetter = letters[index % 4];
        
        const optionTemplates = [
          `A. ${params.knowledgeContent ? params.knowledgeContent.split('.')[0] : top} là kiến thức nền tảng tuân theo các nguyên lý khoa học của môn ${subj}.`,
          `B. Các quá trình và hiện tượng liên quan đến ${top} diễn ra hoàn toàn ngẫu nhiên và không tuân theo quy luật khoa học nào.`,
          `C. Khái niệm và phương pháp của ${top} chỉ áp dụng trên mô hình lý thuyết mà không có ứng dụng thực tiễn trong đời sống.`,
          `D. Mọi thuộc tính của ${top} luôn cố định và hoàn toàn không chịu tác động của điều kiện môi trường xung quanh.`,
        ];

        return {
          id: `SYN_${Date.now()}_P1_${index}`,
          subject: subj,
          grade: params.grade,
          chapter: ch,
          topic: top,
          section: 'MULTIPLE_CHOICE',
          questionNumber: qNum++,
          content: `Theo chuẩn yêu cầu cần đạt của bài học "${top}" (${subj} lớp ${params.grade}), nhận định nào sau đây là ĐÚNG về bản chất khoa học?`,
          cognitive_level: level,
          points,
          options: optionTemplates,
          correctAnswer: correctLetter,
          explanation: `Phương án ${correctLetter} là đáp án chính xác: Bám sát yêu cầu cần đạt bài học "${top}" theo SGK Kết nối tri thức.`,
          curriculumRequirement: yccd,
        };
      }

      if (sec === 'TRUE_FALSE') {
        return {
          id: `SYN_${Date.now()}_P2_${index}`,
          subject: subj,
          grade: params.grade,
          chapter: ch,
          topic: top,
          section: 'TRUE_FALSE',
          questionNumber: qNum++,
          content: `Cho các phát biểu sau về nội dung trọng tâm bài học "${top}" (${subj} lớp ${params.grade}):`,
          cognitive_level: level,
          points,
          trueFalseItems: [
            { id: `tf_syn_${index}_a`, label: 'a', statement: `Nắm vững khái niệm, bản chất của ${top} là yêu cầu cần đạt cơ bản trong chương trình.`, isCorrect: true, cognitive_level: 'KNOW' },
            { id: `tf_syn_${index}_b`, label: 'b', statement: `Mọi hiện tượng liên quan đến ${top} đều diễn ra độc lập và không phụ thuộc vào điều kiện ngoại cảnh.`, isCorrect: false, cognitive_level: 'UNDERSTAND' },
            { id: `tf_syn_${index}_c`, label: 'c', statement: `Vận dụng quy tắc và công thức của ${top} giúp giải thích hiện tượng thực tế và giải quyết bài toán định lượng.`, isCorrect: true, cognitive_level: 'APPLY' },
            { id: `tf_syn_${index}_d`, label: 'd', statement: `Kết quả và quy luật của ${top} mâu thuẫn hoàn toàn với các định luật bảo toàn của khoa học tự nhiên.`, isCorrect: false, cognitive_level: 'UNDERSTAND' },
          ],
          explanation: `Ý a, c đúng theo chuẩn kiến thức SGK Kết nối tri thức; ý b, d sai vì các quá trình luôn tuân theo quy luật tự nhiên và chịu ảnh hưởng của các điều kiện xác định.`,
          curriculumRequirement: yccd,
        };
      }

      if (sec === 'SHORT_ANSWER') {
        return {
          id: `SYN_${Date.now()}_P3_${index}`,
          subject: subj,
          grade: params.grade,
          chapter: ch,
          topic: top,
          section: 'SHORT_ANSWER',
          questionNumber: qNum++,
          content: `Dựa trên bài học "${top}" (${subj}), hãy ghi lại thuật ngữ khoa học cốt lõi hoặc đại lượng định lượng đặc trưng tương ứng với yêu cầu câu hỏi ${index + 1}.`,
          cognitive_level: level,
          points,
          shortAnswerKey: top.split(' ')[0] || 'kết quả chuẩn',
          explanation: `Đáp án chính xác thể hiện đúng thuật ngữ / đại lượng trọng tâm của bài học ${top}.`,
          curriculumRequirement: yccd,
        };
      }

      // ESSAY
      return {
        id: `SYN_${Date.now()}_P4_${index}`,
        subject: subj,
        grade: params.grade,
        chapter: ch,
        topic: top,
        section: 'ESSAY',
        questionNumber: qNum++,
        content: `Dựa vào yêu cầu cần đạt của bài học "${top}" (${ch} - môn ${subj} lớp ${params.grade}):\n1. Trình bày cơ sở lý thuyết, định nghĩa hoặc quy luật khoa học cốt lõi.\n2. Phân tích một ứng dụng thực tiễn hoặc giải thích hiện tượng đời sống gắn liền với "${top}".`,
        cognitive_level: level,
        points,
        sampleEssayAnswer: `1. Nêu đúng định nghĩa, nguyên lý hoặc công thức liên quan đến ${top} (0,75đ).\n2. Phân tích logic, liên hệ thực tế đời sống và đề xuất biện pháp vận dụng phù hợp (0,75đ).`,
        essayRubric: [
          { id: `rubric_syn_${index}_1`, criteria: `Nêu đúng cơ sở lý thuyết khoa học của ${top}`, expectedContent: 'Định nghĩa, nguyên lý hoặc công thức chuẩn', points: 0.75 },
          { id: `rubric_syn_${index}_2`, criteria: `Phân tích hiện tượng và liên hệ thực tế chính xác`, expectedContent: 'Lập luận logic và ứng dụng thực tiễn', points: 0.75 },
        ],
        explanation: `Hướng dẫn chấm chi tiết bám sát chuẩn kiến thức kỹ năng môn ${subj} lớp ${params.grade}.`,
        curriculumRequirement: yccd,
      };
    };

    const usedContents = new Set<string>();
    const usedSourceIds = new Set<string>();

    const pickUniqueQuestion = (
      pool: QuestionBankItem[],
      fallbackPool: QuestionBankItem[],
      sec: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY',
      index: number,
      level: CognitiveLevel,
      points: number
    ): ExamQuestion => {
      // 1. Try primary topic-specific pool first
      let chosen = pool.find(
        (q) => !usedSourceIds.has(q.id) && !usedContents.has(q.content.trim().toLowerCase())
      );

      // 2. If exhausted, try subject-wide pool of the same subject
      if (!chosen) {
        chosen = fallbackPool.find(
          (q) => !usedSourceIds.has(q.id) && !usedContents.has(q.content.trim().toLowerCase())
        );
      }

      if (chosen) {
        usedSourceIds.add(chosen.id);
        usedContents.add(chosen.content.trim().toLowerCase());
        return {
          ...chosen,
          id: `Q_${sec}_${index + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          questionNumber: qNum++,
          cognitive_level: level,
          points,
          topic: chosen.topic || params.topic,
          chapter: chosen.chapter || params.chapter,
          curriculumRequirement:
            chosen.curriculumRequirement ||
            params.learningObjectives ||
            `Đánh giá mức độ ${level} bài học ${chosen.topic || params.topic}`,
        };
      }

      // 3. Synthesize a distinct question that explores different aspects
      const syn = synthesizeSubjectQuestion(sec, index, level, points);
      usedContents.add(syn.content.trim().toLowerCase());
      return syn;
    };

    let distIdx = 0;

    // Part I: MULTIPLE_CHOICE (không trùng lặp)
    for (let i = 0; i < part1Count; i++) {
      const assignedLevel = cognitiveDistribution[distIdx++] || 'KNOW';
      selectedQuestions.push(
        pickUniqueQuestion(
          part1Pool,
          subjectQuestions.filter((q) => q.section === 'MULTIPLE_CHOICE'),
          'MULTIPLE_CHOICE',
          i,
          assignedLevel,
          calc.part1PerItem
        )
      );
    }

    // Part II: TRUE_FALSE (không trùng lặp)
    for (let i = 0; i < part2Count; i++) {
      const assignedLevel = cognitiveDistribution[distIdx++] || 'UNDERSTAND';
      selectedQuestions.push(
        pickUniqueQuestion(
          part2Pool,
          subjectQuestions.filter((q) => q.section === 'TRUE_FALSE'),
          'TRUE_FALSE',
          i,
          assignedLevel,
          calc.part2PerItem
        )
      );
    }

    // Part III: SHORT_ANSWER (không trùng lặp)
    for (let i = 0; i < part3Count; i++) {
      const assignedLevel = cognitiveDistribution[distIdx++] || 'UNDERSTAND';
      selectedQuestions.push(
        pickUniqueQuestion(
          part3Pool,
          subjectQuestions.filter((q) => q.section === 'SHORT_ANSWER'),
          'SHORT_ANSWER',
          i,
          assignedLevel,
          calc.part3PerItem
        )
      );
    }

    // Part IV: ESSAY (không trùng lặp)
    for (let i = 0; i < part4Count; i++) {
      const assignedLevel = cognitiveDistribution[distIdx++] || 'APPLY';
      selectedQuestions.push(
        pickUniqueQuestion(
          part4Pool,
          subjectQuestions.filter((q) => q.section === 'ESSAY'),
          'ESSAY',
          i,
          assignedLevel,
          calc.part4PerItem
        )
      );
    }

    // Generate Matrix automatically adhering to 3 cognitive levels
    const knowQs = selectedQuestions.filter((q) => q.cognitive_level === 'KNOW');
    const understandQs = selectedQuestions.filter((q) => q.cognitive_level === 'UNDERSTAND');
    const applyQs = selectedQuestions.filter((q) => q.cognitive_level === 'APPLY');

    const knowPts = Math.round(knowQs.reduce((s, q) => s + q.points, 0) * 100) / 100;
    const understandPts = Math.round(understandQs.reduce((s, q) => s + q.points, 0) * 100) / 100;
    const applyPts = Math.round(applyQs.reduce((s, q) => s + q.points, 0) * 100) / 100;

    const matrix: ExamMatrixItem[] = [
      {
        topic: params.topic || `Chuyên đề ${params.subject}`,
        chapter: params.chapter || `Chương trình lớp ${params.grade}`,
        knowCount: knowQs.length,
        understandCount: understandQs.length,
        applyCount: applyQs.length,
        knowPoints: knowPts,
        understandPoints: understandPts,
        applyPoints: applyPts,
        totalPoints: 10.0,
        percentage: 100,
      },
    ];

    // Generate Specifications
    const specifications: ExamSpecificationItem[] = selectedQuestions.map((q) => ({
      id: `spec_${q.questionNumber}`,
      chapter: q.chapter || params.chapter,
      topic: q.topic || params.topic,
      competencyRequirement:
        q.curriculumRequirement ||
        `Đánh giá năng lực môn ${params.subject} câu ${q.questionNumber} mức độ ${q.cognitive_level}`,
      cognitive_level: q.cognitive_level,
      section: q.section,
      questionNumber: q.questionNumber,
      points: q.points,
      questionPreview: q.content.slice(0, 60),
    }));

    const subjectSlug = params.subject.replace(/\s+/g, '').toUpperCase();
    const newCode = `DE_${subjectSlug}${params.grade}_${Date.now().toString().slice(-4)}`;

    return {
      id: `EXAM_${Date.now()}`,
      code: newCode,
      title: `Đề kiểm tra ${params.subject} ${params.grade} - ${params.topic}`,
      subject: params.subject,
      grade: params.grade,
      curriculum: 'Kết nối tri thức',
      chapter: params.chapter,
      topic: params.topic,
      durationMinutes: params.durationMinutes,
      totalQuestions: selectedQuestions.length,
      totalPoints: 10.0,
      ratio: params.ratio,
      structure: params.structure,
      matrix,
      specifications,
      questions: selectedQuestions,
      status: 'NHAP',
      assignedClasses: ['11A1'],
      shareableLink: `${window.location.origin}?exam=${newCode}`,
      createdBy: 'Giáo viên bộ môn',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // SMART AI EXAM GENERATOR (WITH PROXY & OFFLINE FALLBACK)
  // ==========================================
  async generateExamWithAI(params: {
    subject: string;
    grade: number;
    curriculum?: string;
    chapter: string;
    topic: string;
    knowledgeContent: string;
    learningObjectives: string;
    teacherCustomPrompt?: string;
    durationMinutes: number;
    ratio: { know: number; understand: number; apply: number };
    structure: { part1Count: number; part2Count: number; part3Count: number; part4Count: number };
  }): Promise<{ exam: ExamPaper; isAIGenerated: boolean; note?: string }> {
    try {
      const response = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.examData && data.examData.questions?.length > 0) {
          const aiData = data.examData;
          const subjectSlug = params.subject.replace(/\s+/g, '').toUpperCase();
          const newCode = `DE_AI_${subjectSlug}${params.grade}_${Date.now().toString().slice(-4)}`;

          const newExam: ExamPaper = {
            id: `EXAM_AI_${Date.now()}`,
            code: newCode,
            title: aiData.title || `Đề kiểm tra ${params.subject} ${params.grade} - ${params.topic}`,
            subject: params.subject,
            grade: params.grade,
            curriculum: 'Kết nối tri thức',
            chapter: params.chapter,
            topic: params.topic,
            durationMinutes: params.durationMinutes,
            totalQuestions: aiData.questions.length,
            totalPoints: 10.0,
            ratio: params.ratio,
            structure: params.structure,
            matrix: aiData.matrix || [],
            specifications: aiData.specifications || [],
            questions: aiData.questions,
            status: 'NHAP',
            assignedClasses: ['11A1'],
            shareableLink: `${window.location.origin}?exam=${newCode}`,
            createdBy: 'Giáo viên bộ môn (AI hỗ trợ)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Attach initial AI verification
          newExam.aiVerification = this.verifyExamPaper(newExam);
          this.saveExam(newExam);
          return { exam: newExam, isAIGenerated: true };
        }
      }
    } catch (err) {
      console.warn('AI Exam API unavailable or failed, switching to local offline generator:', err);
    }

    // Fallback to internal curriculum question generator
    const offlineExam = this.generateExamOffline(params);
    offlineExam.aiVerification = this.verifyExamPaper(offlineExam);
    this.saveExam(offlineExam);
    return {
      exam: offlineExam,
      isAIGenerated: false,
      note: 'Hệ thống đã tự động chuyển sang ngân hàng câu hỏi nội bộ SGK Kết nối tri thức chuẩn hóa.',
    };
  }

  // ==========================================
  // AI KIỂM TRA ĐỀ (CONSISTENCY & ACCURACY VERIFIER)
  // ==========================================
  verifyExamPaper(exam: ExamPaper): ExamVerificationResult {
    const issues: { type: 'ERROR' | 'WARNING' | 'INFO'; message: string; questionNumber?: number }[] = [];
    
    // 1. Total Points Check
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    if (Math.abs(totalPoints - 10.0) > 0.05) {
      issues.push({
        type: 'ERROR',
        message: `Tổng điểm các câu hỏi (${totalPoints.toFixed(2)}đ) chưa khớp với thang 10,0 điểm. Vui lòng tự cân đối lại điểm từng phần.`,
      });
    }

    // 2. Cognitive Level Check (KNOW, UNDERSTAND, APPLY)
    exam.questions.forEach((q) => {
      if (!q.cognitive_level || !['KNOW', 'UNDERSTAND', 'APPLY'].includes(q.cognitive_level)) {
        issues.push({
          type: 'ERROR',
          message: `Câu hỏi ${q.questionNumber} thiếu trường mức độ nhận thức (chỉ nhận KNOW, UNDERSTAND hoặc APPLY).`,
          questionNumber: q.questionNumber,
        });
      }

      // Check section specifics
      if (q.section === 'MULTIPLE_CHOICE') {
        if (!q.options || q.options.length !== 4) {
          issues.push({
            type: 'ERROR',
            message: `Câu hỏi ${q.questionNumber} (Phần I) phải có đủ đúng 4 phương án lựa chọn A, B, C, D.`,
            questionNumber: q.questionNumber,
          });
        }
        if (!q.correctAnswer) {
          issues.push({
            type: 'ERROR',
            message: `Câu hỏi ${q.questionNumber} chưa chỉ định đáp án đúng (A, B, C hoặc D).`,
            questionNumber: q.questionNumber,
          });
        }
      }

      if (q.section === 'TRUE_FALSE') {
        if (!q.trueFalseItems || q.trueFalseItems.length !== 4) {
          issues.push({
            type: 'ERROR',
            message: `Câu hỏi ${q.questionNumber} (Phần II) bắt buộc phải có đủ 4 ý a, b, c, d.`,
            questionNumber: q.questionNumber,
          });
        }
      }

      if (q.section === 'SHORT_ANSWER' && !q.shortAnswerKey) {
        issues.push({
          type: 'WARNING',
          message: `Câu hỏi ${q.questionNumber} (Phần III) chưa điền từ khóa đáp án ngắn.`,
          questionNumber: q.questionNumber,
        });
      }

      if (q.section === 'ESSAY' && (!q.essayRubric || q.essayRubric.length === 0)) {
        issues.push({
          type: 'WARNING',
          message: `Câu hỏi ${q.questionNumber} (Phần IV) nên có rubric tiêu chí chấm chi tiết theo SGK Kết nối tri thức.`,
          questionNumber: q.questionNumber,
        });
      }

      // Check Curriculum / Competency Requirement (Yêu cầu cần đạt chuẩn SGK)
      if (!q.curriculumRequirement || q.curriculumRequirement.trim() === '') {
        issues.push({
          type: 'WARNING',
          message: `Câu hỏi ${q.questionNumber} chưa ghi rõ Yêu cầu cần đạt chuẩn SGK Kết nối tri thức.`,
          questionNumber: q.questionNumber,
        });
      }
    });

    // 3. Ratio Check
    const totalRatio = exam.ratio.know + exam.ratio.understand + exam.ratio.apply;
    if (totalRatio !== 100) {
      issues.push({
        type: 'ERROR',
        message: `Tỷ lệ mức độ nhận thức (${exam.ratio.know}% + ${exam.ratio.understand}% + ${exam.ratio.apply}% = ${totalRatio}%) không bằng 100%.`,
      });
    }

    // 4. Synchronization check: Specifications & Questions
    if (exam.specifications && exam.specifications.length > 0) {
      if (exam.specifications.length !== exam.questions.length) {
        issues.push({
          type: 'WARNING',
          message: `Số lượng mục trong Bản đặc tả (${exam.specifications.length}) chưa khớp với số lượng câu hỏi trong đề (${exam.questions.length}).`,
        });
      }

      exam.questions.forEach((q) => {
        const spec = exam.specifications.find((s) => s.questionNumber === q.questionNumber);
        if (!spec) {
          issues.push({
            type: 'WARNING',
            message: `Câu hỏi ${q.questionNumber} chưa được ánh xạ trong Bản đặc tả chuẩn đầu ra.`,
            questionNumber: q.questionNumber,
          });
        } else if (spec.cognitive_level !== q.cognitive_level) {
          issues.push({
            type: 'ERROR',
            message: `Mức độ nhận thức câu ${q.questionNumber} (${q.cognitive_level}) không khớp với Bản đặc tả (${spec.cognitive_level}).`,
            questionNumber: q.questionNumber,
          });
        }
      });
    }

    const hasError = issues.some((i) => i.type === 'ERROR');
    const hasWarning = issues.some((i) => i.type === 'WARNING');

    let status: 'HOP_LE' | 'CAN_XEM_LAI' | 'CO_LOI' = 'HOP_LE';
    let summary = 'Đề thi hoàn toàn Hợp lệ! Đủ dữ kiện, thang điểm 10,0đ, cấu trúc 4 phần chuẩn mực.';
    if (hasError) {
      status = 'CO_LOI';
      summary = `Phát hiện ${issues.filter((i) => i.type === 'ERROR').length} lỗi cần sửa trước khi giáo viên duyệt và phát hành.`;
    } else if (hasWarning) {
      status = 'CAN_XEM_LAI';
      summary = `Đề thi cơ bản hợp lệ nhưng có ${issues.filter((i) => i.type === 'WARNING').length} khuyến nghị sư phạm nên hoàn thiện.`;
    }

    return {
      status,
      summary,
      issues,
      checkedAt: new Date().toISOString(),
      checkedByAI: true,
    };
  }

  // ==========================================
  // EXPORT UTILITIES (WORD, TXT)
  // ==========================================
  exportExamToWord(exam: ExamPaper, includeAnswers: boolean = true): void {
    let content = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${exam.title}</title>
<style>
  body { font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 13pt; margin: 2cm; }
  h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
  .header-box { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  .part-title { font-weight: bold; font-size: 14pt; margin-top: 18px; margin-bottom: 8px; color: #1e3a8a; }
  .question { margin-bottom: 12px; }
  .options { margin-left: 20px; }
  .tf-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
  .tf-table th, .tf-table td { border: 1px solid #999; padding: 6px; font-size: 12pt; }
  .answer-key { background-color: #f1f5f9; padding: 8px; border-left: 4px solid #3b82f6; margin-top: 5px; font-size: 11pt; }
  .rubric-box { background-color: #f0fdf4; border: 1px dashed #16a34a; padding: 8px; margin-top: 5px; }
</style>
</head>
<body>
  <table class="header-box">
    <tr>
      <td style="width: 50%; text-align: center;">
        <strong>SỞ GD&ĐT · TRƯỜNG THPT</strong><br>
        <strong>TỔ CHUYÊN MÔN HÓA HỌC</strong>
      </td>
      <td style="width: 50%; text-align: center;">
        <strong>KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025 - 2026</strong><br>
        <strong>MÔN: ${exam.subject.toUpperCase()} - KHỐI ${exam.grade}</strong><br>
        <em>Thời gian làm bài: ${exam.durationMinutes} phút (không kể thời gian phát đề)</em>
      </td>
    </tr>
  </table>

  <h1>${exam.title}</h1>
  <p style="text-align: center; font-style: italic;">(Mã đề: ${exam.code} - Bộ sách Kết nối tri thức với cuộc sống)</p>
  <p><strong>Họ và tên thí sinh:</strong> ............................................................................ <strong>Lớp:</strong> ................ <strong>Số báo danh:</strong> ................</p>
  <hr>
`;

    // Part I
    const p1Questions = exam.questions.filter((q) => q.section === 'MULTIPLE_CHOICE');
    if (p1Questions.length > 0) {
      content += `<div class="part-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (5,0 điểm). Thí sinh trả lời từ câu 1 đến câu ${p1Questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</div>`;
      p1Questions.forEach((q) => {
        content += `<div class="question"><strong>Câu ${q.questionNumber} (${q.points}đ) [${q.cognitive_level}]:</strong> ${q.content}`;
        if (q.options) {
          content += `<div class="options">${q.options.map((opt) => `<div>${opt}</div>`).join('')}</div>`;
        }
        if (includeAnswers) {
          content += `<div class="answer-key"><strong>Đáp án đúng: ${q.correctAnswer}</strong>. <em>Hướng dẫn giải: ${q.explanation || ''}</em></div>`;
        }
        content += `</div>`;
      });
    }

    // Part II
    const p2Questions = exam.questions.filter((q) => q.section === 'TRUE_FALSE');
    if (p2Questions.length > 0) {
      content += `<div class="part-title">PHẦN II. Câu trắc nghiệm đúng sai (2,0 điểm). Thí sinh trả lời từng ý a, b, c, d ở mỗi câu.</div>`;
      p2Questions.forEach((q) => {
        content += `<div class="question"><strong>Câu ${q.questionNumber} (${q.points}đ) [${q.cognitive_level}]:</strong> ${q.content}`;
        if (q.trueFalseItems) {
          content += `<table class="tf-table"><tr><th style="width: 10%;">Ý</th><th style="width: 70%;">Phát biểu</th><th style="width: 10%;">Đúng</th><th style="width: 10%;">Sai</th></tr>`;
          q.trueFalseItems.forEach((tf) => {
            content += `<tr><td style="text-align: center; font-weight: bold;">${tf.label}</td><td>${tf.statement}</td><td style="text-align: center;">${includeAnswers && tf.isCorrect ? '✓' : ''}</td><td style="text-align: center;">${includeAnswers && !tf.isCorrect ? '✓' : ''}</td></tr>`;
          });
          content += `</table>`;
        }
        if (includeAnswers) {
          content += `<div class="answer-key"><em>Hướng dẫn chấm Phần II: Đúng 1 ý: 0,10đ; Đúng 2 ý: 0,25đ; Đúng 3 ý: 0,50đ; Đúng 4 ý: 1,00đ. Giải thích: ${q.explanation || ''}</em></div>`;
        }
        content += `</div>`;
      });
    }

    // Part III
    const p3Questions = exam.questions.filter((q) => q.section === 'SHORT_ANSWER');
    if (p3Questions.length > 0) {
      content += `<div class="part-title">PHẦN III. Câu trắc nghiệm yêu cầu trả lời ngắn (1,5 điểm). Thí sinh điền kết quả vào phiếu.</div>`;
      p3Questions.forEach((q) => {
        content += `<div class="question"><strong>Câu ${q.questionNumber} (${q.points}đ) [${q.cognitive_level}]:</strong> ${q.content}`;
        if (includeAnswers) {
          content += `<div class="answer-key"><strong>Đáp số: ${q.shortAnswerKey || ''}</strong>. <em>Hướng dẫn giải: ${q.explanation || ''}</em></div>`;
        }
        content += `</div>`;
      });
    }

    // Part IV
    const p4Questions = exam.questions.filter((q) => q.section === 'ESSAY');
    if (p4Questions.length > 0) {
      content += `<div class="part-title">PHẦN IV. Tự luận (1,5 điểm). Thí sinh trình bày chi tiết lời giải.</div>`;
      p4Questions.forEach((q) => {
        content += `<div class="question"><strong>Câu ${q.questionNumber} (${q.points}đ) [${q.cognitive_level}]:</strong><br>${q.content.replace(/\n/g, '<br>')}`;
        if (includeAnswers) {
          content += `<div class="rubric-box"><strong>HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT (RUBRIC):</strong><br>${(q.sampleEssayAnswer || '').replace(/\n/g, '<br>')}`;
          if (q.essayRubric) {
            content += `<ul style="margin-top: 5px;">${q.essayRubric.map((r) => `<li><strong>${r.points}đ:</strong> ${r.criteria}</li>`).join('')}</ul>`;
          }
          content += `</div>`;
        }
        content += `</div>`;
      });
    }

    content += `
  <p style="text-align: center; margin-top: 30px; font-weight: bold;">---------- HẾT ----------</p>
</body>
</html>`;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.code}_${includeAnswers ? 'GIAO_VIEN_FULL' : 'HOC_SINH'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportExamToTxt(exam: ExamPaper): void {
    let text = `=======================================================\n`;
    text += `TRƯỜNG THPT - BỘ MÔN ${exam.subject.toUpperCase()} 11\n`;
    text += `${exam.title.toUpperCase()}\n`;
    text += `Mã đề: ${exam.code} | Thời gian: ${exam.durationMinutes} phút\n`;
    text += `=======================================================\n\n`;

    exam.questions.forEach((q) => {
      text += `Câu ${q.questionNumber} [${q.cognitive_level}] (${q.points}đ): ${q.content}\n`;
      if (q.options) {
        q.options.forEach((opt) => (text += `   ${opt}\n`));
        text += `-> Đáp án đúng: ${q.correctAnswer}\n`;
      }
      if (q.trueFalseItems) {
        q.trueFalseItems.forEach((tf) => (text += `   ${tf.label}) ${tf.statement} -> ${tf.isCorrect ? 'ĐÚNG' : 'SAI'}\n`));
      }
      if (q.shortAnswerKey) {
        text += `-> Đáp số ngắn: ${q.shortAnswerKey}\n`;
      }
      if (q.sampleEssayAnswer) {
        text += `-> Đáp án tự luận: ${q.sampleEssayAnswer}\n`;
      }
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exam.code}_NoiDung.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const examService = new ExamService();
