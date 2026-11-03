import { CognitiveLevel, WarningLevel } from './index';

export type ExamSectionType =
  | 'MULTIPLE_CHOICE' // Phần I - Trắc nghiệm (5.0đ)
  | 'TRUE_FALSE'       // Phần II - Đúng/Sai (2.0đ, mỗi câu 4 ý a-b-c-d)
  | 'SHORT_ANSWER'    // Phần III - Trả lời ngắn (1.5đ)
  | 'ESSAY';          // Phần IV - Tự luận (1.5đ rubric)

export type ExamStatus =
  | 'NHAP'        // Bản nháp
  | 'CHO_DUYET'   // Chờ duyệt
  | 'DA_DUYET'    // Giáo viên đã duyệt
  | 'PHAT_HANH';   // Đã phát hành cho học sinh làm

export interface TrueFalseSubItem {
  id: string;
  label: 'a' | 'b' | 'c' | 'd';
  statement: string;
  isCorrect: boolean; // true = Đúng, false = Sai
  cognitive_level?: CognitiveLevel;
  explanation?: string;
}

export interface EssayRubricItem {
  id: string;
  criteria: string;
  expectedContent: string;
  points: number;
}

export interface ExamQuestion {
  id: string;
  subject?: string;
  grade?: number;
  section: ExamSectionType;
  questionNumber: number;
  content: string;
  cognitive_level: CognitiveLevel; // BẮT BUỘC: KNOW | UNDERSTAND | APPLY
  points: number;
  
  // Phần I: 4 lựa chọn
  options?: string[]; // [A, B, C, D]
  correctAnswer?: string; // 'A' | 'B' | 'C' | 'D'
  
  // Phần II: 4 ý a, b, c, d
  trueFalseItems?: TrueFalseSubItem[];
  
  // Phần III: Trả lời ngắn
  shortAnswerKey?: string; // e.g. "0.05", "CH3COOH"
  
  // Phần IV: Tự luận rubric
  essayRubric?: EssayRubricItem[];
  sampleEssayAnswer?: string;
  
  explanation: string;
  topic: string;
  chapter: string;
  curriculumRequirement?: string; // Yêu cầu cần đạt SGK Kết nối tri thức
}

export interface ExamMatrixItem {
  topic: string;
  chapter: string;
  knowCount: number;
  understandCount: number;
  applyCount: number;
  knowPoints: number;
  understandPoints: number;
  applyPoints: number;
  totalPoints: number;
  percentage: number;
}

export interface ExamSpecificationItem {
  id: string;
  chapter: string;
  topic: string;
  competencyRequirement: string; // Yêu cầu cần đạt chuẩn SGK
  cognitive_level: CognitiveLevel;
  section: ExamSectionType;
  questionNumber: number;
  points: number;
  questionPreview?: string;
}

export interface ExamVerificationResult {
  status: 'HOP_LE' | 'CAN_XEM_LAI' | 'CO_LOI';
  summary: string;
  issues: {
    type: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    questionNumber?: number;
  }[];
  checkedAt: string;
  checkedByAI: boolean;
}

export interface ExamPaper {
  id: string;
  code: string; // e.g. "HOA11_GK1_01"
  title: string;
  subject: string; // Mặc định 'Hóa học'
  grade: number; // 11
  curriculum: 'Kết nối tri thức';
  chapter: string;
  topic: string;
  durationMinutes: number; // 45, 60, 90...
  totalQuestions: number;
  totalPoints: number; // 10.0
  
  ratio: {
    know: number;        // e.g. 40%
    understand: number;  // e.g. 40%
    apply: number;       // e.g. 20%
  };
  
  structure: {
    part1Count: number; // Trắc nghiệm 4 lựa chọn (5.0đ)
    part2Count: number; // Đúng/Sai 4 ý (2.0đ)
    part3Count: number; // Trả lời ngắn (1.5đ)
    part4Count: number; // Tự luận (1.5đ)
  };
  
  matrix: ExamMatrixItem[];
  specifications: ExamSpecificationItem[];
  questions: ExamQuestion[];
  
  status: ExamStatus;
  aiVerification?: ExamVerificationResult;
  
  assignedClasses: string[]; // ['11A1']
  assignedStudentIds?: string[]; // Empty means all students in class
  shareableLink?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface QuestionBankItem extends ExamQuestion {
  subject: string;
  grade: number;
  usageCount: number;
}

// Student Submission & Grading
export interface StudentExamAnswer {
  questionId: string;
  section: ExamSectionType;
  questionNumber: number;
  
  // Answers by section
  selectedOption?: string; // Part 1 (A/B/C/D)
  trueFalseAnswers?: Record<string, boolean>; // Part 2 (a: true, b: false...)
  shortAnswerText?: string; // Part 3
  essayText?: string; // Part 4
  
  // Grading result
  isCorrect?: boolean;
  earnedPoints: number;
  maxPoints: number;
  feedback?: string;
  aiSuggestedEssayScore?: number;
  teacherConfirmedEssayScore?: number;
}

export interface StudentExamResult {
  id: string;
  examId: string;
  examCode: string;
  examTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  
  scorePart1: number; // Max 5.0
  scorePart2: number; // Max 2.0
  scorePart3: number; // Max 1.5
  scorePart4: number; // Max 1.5
  totalScore: number; // Max 10.0
  
  cognitiveScores: {
    know: { score: number; max: number; percentage: number };
    understand: { score: number; max: number; percentage: number };
    apply: { score: number; max: number; percentage: number };
  };
  
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  durationSeconds: number;
  
  answers: Record<string, StudentExamAnswer>;
  
  aiPedagogicalComment: {
    overallSummary: string;
    strengths: string[];
    needsImprovement: string[];
    knowAnalysis: string;
    understandAnalysis: string;
    applyAnalysis: string;
    recommendedActions: string[];
    supportLevel: 'Duy trì' | 'Khuyến khích' | 'Cần theo dõi' | 'Cần hỗ trợ';
    confidence: 'CAO' | 'TRUNG_BINH' | 'THAP';
    whyExplanation: string;
  };
  
  essayGraded: boolean;
  submittedAt: string;
  isDemo?: boolean;
}

// AI Chatbot
export interface AIChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  timestamp: string;
  contextAttached?: {
    examId?: string;
    examTitle?: string;
    questionNumber?: number;
    questionContent?: string;
    studentAnswer?: any;
    correctAnswer?: any;
    cognitiveLevel?: CognitiveLevel;
    studentCode?: string;
  };
  confidence?: 'CAO' | 'TRUNG_BINH' | 'THAP';
  whyExplanation?: string;
}

export interface AIChatSession {
  id: string;
  title: string;
  role: 'TEACHER' | 'STUDENT';
  studentId?: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Educational Research Experiment (Optional Pre/Post/Delayed testing for Teacher)
export interface ResearchExperimentRecord {
  id: string;
  title: string;
  subject: string;
  testPhase: 'PRE_TEST' | 'POST_TEST' | 'DELAYED_TEST';
  groupType: 'THỰC_NGHIỆM' | 'ĐỐI_CHỨNG'; // TN01, ĐC01...
  studentId: string;
  studentCode: string;
  overallScore: number;
  knowScore: number;
  understandScore: number;
  applyScore: number;
  interventionLog: string;
  timestamp: string;
}
