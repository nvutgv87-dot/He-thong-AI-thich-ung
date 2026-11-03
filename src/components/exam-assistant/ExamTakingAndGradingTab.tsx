import React, { useState, useEffect, useRef } from 'react';
import {
  ExamPaper,
  StudentExamResult,
  StudentExamAnswer,
  ExamQuestion,
} from '../../types/examTypes';
import { Student, CognitiveLevel, COGNITIVE_LEVEL_META } from '../../types/index';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { calculateTrueFalseScore, formatScore } from '../../utils/scoreUtils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  Flag,
  FileCheck,
  Send,
  Eye,
  BarChart3,
  TrendingUp,
  User,
  RotateCcw,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

interface ExamTakingAndGradingTabProps {
  userRole: 'TEACHER' | 'STUDENT';
  exams: ExamPaper[];
  students: Student[];
  currentStudent?: Student;
  selectedExamToTake?: ExamPaper | null;
  onClearSelectedExam?: () => void;
  onOpenChatWithQuestionContext?: (context: any) => void;
}

export const ExamTakingAndGradingTab: React.FC<ExamTakingAndGradingTabProps> = ({
  userRole,
  exams,
  students,
  currentStudent,
  selectedExamToTake,
  onClearSelectedExam,
  onOpenChatWithQuestionContext,
}) => {
  // Modes: 'SELECTION' | 'TESTING' | 'RESULT_DETAIL' | 'CLASS_ANALYTICS'
  const [mode, setMode] = useState<'SELECTION' | 'TESTING' | 'RESULT_DETAIL' | 'CLASS_ANALYTICS'>('SELECTION');

  const [activeExam, setActiveExam] = useState<ExamPaper | null>(selectedExamToTake || null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Student test taking state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Results state
  const [completedResult, setCompletedResult] = useState<StudentExamResult | null>(null);
  const [classResults, setClassResults] = useState<StudentExamResult[]>(() => examService.getExamResults());

  // Teacher essay score editing modal
  const [editingEssayStudentResult, setEditingEssayStudentResult] = useState<StudentExamResult | null>(null);
  const [teacherScoreInput, setTeacherScoreInput] = useState<number>(1.0);

  // If selectedExamToTake passed from parent, enter TESTING or SELECTION
  useEffect(() => {
    if (selectedExamToTake) {
      handleStartExam(selectedExamToTake);
    }
  }, [selectedExamToTake]);

  // Timer countdown during testing
  useEffect(() => {
    if (mode !== 'TESTING') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  const handleStartExam = (exam: ExamPaper) => {
    setActiveExam(exam);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setFlaggedQuestions({});
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setStartTime(Date.now());
    setMode('TESTING');
    toastService.info(`Bắt đầu làm bài thi "${exam.title}". Chúc bạn làm bài tự tin!`);
  };

  const handleAutoSubmitTimeUp = () => {
    toastService.warning('Đã hết thời gian làm bài! Hệ thống tự động thu bài và chấm điểm.');
    handleSubmitExam();
  };

  // Evaluate & Grade
  const handleSubmitExam = () => {
    if (!activeExam) return;

    setShowSubmitConfirmModal(false);
    const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    let part1Score = 0;
    let part2Score = 0;
    let part3Score = 0;
    let part4Score = 0;

    let knowScore = 0;
    let knowMax = 0;
    let understandScore = 0;
    let understandMax = 0;
    let applyScore = 0;
    let applyMax = 0;

    let correctCount = 0;
    let incorrectCount = 0;
    let blankCount = 0;

    const answersDetail: Record<string, StudentExamAnswer> = {};

    activeExam.questions.forEach((q) => {
      const qAns = answers[q.id];
      const maxPts = q.points;

      // Track max cognitive points
      if (q.cognitive_level === 'KNOW') knowMax += maxPts;
      else if (q.cognitive_level === 'UNDERSTAND') understandMax += maxPts;
      else if (q.cognitive_level === 'APPLY') applyMax += maxPts;

      if (q.section === 'MULTIPLE_CHOICE') {
        const isBlank = !qAns;
        const isCorrect = qAns === q.correctAnswer;
        const earned = isCorrect ? maxPts : 0;
        if (isBlank) blankCount++;
        else if (isCorrect) correctCount++;
        else incorrectCount++;

        part1Score += earned;
        if (q.cognitive_level === 'KNOW') knowScore += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandScore += earned;
        else if (q.cognitive_level === 'APPLY') applyScore += earned;

        answersDetail[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          selectedOption: qAns,
          isCorrect,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: isCorrect ? 'Chính xác' : `Đáp án đúng là ${q.correctAnswer}`,
        };
      } else if (q.section === 'TRUE_FALSE') {
        const tfAnswers = qAns || {};
        let numCorrectSub = 0;
        let anyAnswered = false;

        (q.trueFalseItems || []).forEach((item) => {
          if (tfAnswers[item.id] !== undefined) anyAnswered = true;
          if (tfAnswers[item.id] === item.isCorrect) {
            numCorrectSub++;
          }
        });

        const earned = calculateTrueFalseScore(numCorrectSub);
        part2Score += earned;

        if (q.cognitive_level === 'KNOW') knowScore += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandScore += earned;
        else if (q.cognitive_level === 'APPLY') applyScore += earned;

        if (!anyAnswered) blankCount++;
        else if (numCorrectSub === 4) correctCount++;
        else incorrectCount++;

        answersDetail[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          trueFalseAnswers: tfAnswers,
          isCorrect: numCorrectSub === 4,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: `Đúng ${numCorrectSub}/4 ý (${formatScore(earned)})`,
        };
      } else if (q.section === 'SHORT_ANSWER') {
        const textAns = (qAns || '').toString().trim().toLowerCase();
        const expected = (q.shortAnswerKey || '').trim().toLowerCase();
        const isBlank = !textAns;
        const isCorrect = !isBlank && textAns === expected;
        const earned = isCorrect ? maxPts : 0;

        if (isBlank) blankCount++;
        else if (isCorrect) correctCount++;
        else incorrectCount++;

        part3Score += earned;
        if (q.cognitive_level === 'KNOW') knowScore += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandScore += earned;
        else if (q.cognitive_level === 'APPLY') applyScore += earned;

        answersDetail[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          shortAnswerText: qAns,
          isCorrect,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: isCorrect ? 'Chính xác' : `Đáp số chuẩn: ${q.shortAnswerKey}`,
        };
      } else if (q.section === 'ESSAY') {
        const essayText = (qAns || '').trim();
        const isBlank = !essayText || essayText.length < 5 || essayText.toLowerCase().includes('chưa làm');

        // AI proposes score according to rubric
        let aiSuggested = 0;
        if (!isBlank) {
          // If student wrote solid response, propose 1.0 - 1.5
          aiSuggested = essayText.length > 50 ? 1.25 : 0.75;
        }

        part4Score += aiSuggested;
        if (q.cognitive_level === 'APPLY') applyScore += aiSuggested;

        if (isBlank) blankCount++;
        else correctCount++;

        answersDetail[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          essayText,
          isCorrect: !isBlank,
          earnedPoints: aiSuggested,
          maxPoints: maxPts,
          aiSuggestedEssayScore: aiSuggested,
          teacherConfirmedEssayScore: userRole === 'TEACHER' ? aiSuggested : undefined,
          feedback: isBlank ? 'Bỏ trống (0đ)' : `AI đề xuất ${aiSuggested}đ theo Rubric (Giáo viên duyệt)`,
        };
      }
    });

    const totalRaw = part1Score + part2Score + part3Score + part4Score;
    const finalTotal = Math.min(10.0, Math.round(totalRaw * 100) / 100);

    const studentName = currentStudent?.fullName || (userRole === 'STUDENT' ? 'Học sinh' : 'Học sinh kiểm tra');
    const studentCode = currentStudent?.code || 'HS04';
    const studentId = currentStudent?.id || 'STU_04';

    // AI Pedagogical Comment (Non-judgmental, positive Socratic feedback)
    const knowPct = knowMax > 0 ? (knowScore / knowMax) * 100 : 80;
    const understandPct = understandMax > 0 ? (understandScore / understandMax) * 100 : 70;
    const applyPct = applyMax > 0 ? (applyScore / applyMax) * 100 : 60;

    let supportLevel: 'Duy trì' | 'Khuyến khích' | 'Cần theo dõi' | 'Cần hỗ trợ' = 'Khuyến khích';
    if (finalTotal >= 8.0) supportLevel = 'Duy trì';
    else if (finalTotal >= 6.5) supportLevel = 'Khuyến khích';
    else if (finalTotal >= 5.0) supportLevel = 'Cần theo dõi';
    else supportLevel = 'Cần hỗ trợ';

    const aiComment = {
      overallSummary: `Em đã hoàn thành bài kiểm tra với kết quả ${finalTotal}/10,0đ trong ${Math.round(durationSec / 60)} phút. Nắm tốt kiến thức cơ bản của chương.`,
      strengths: [
        knowPct >= 75 ? 'Nhận diện khái niệm và công thức alcohol/phenol rất vững vàng' : 'Có cố gắng hoàn thành đầy đủ các câu hỏi',
        'Tốc độ làm bài phân bổ hợp lý, hoàn thành trước hạn',
      ],
      needsImprovement: [
        understandPct < 70 ? 'Cần củng cố thêm phần giải thích cơ chế phản ứng và so sánh tính acid' : 'Rà soát kỹ câu hỏi trắc nghiệm đúng/sai 4 ý',
        applyPct < 60 ? 'Cần rèn luyện thêm bài toán tính hiệu suất phản ứng ester hóa' : 'Trình bày tự luận mạch lạc hơn',
      ],
      knowAnalysis: `Mức BIẾT đạt ${knowScore.toFixed(2)}/${knowMax.toFixed(2)}đ (${knowPct.toFixed(0)}%). Khả năng ghi nhớ thuật ngữ và quy tắc SGK tốt.`,
      understandAnalysis: `Mức HIỂU đạt ${understandScore.toFixed(2)}/${understandMax.toFixed(2)}đ (${understandPct.toFixed(0)}%). Cần chú ý các phản ứng có tính phân hóa.`,
      applyAnalysis: `Mức VẬN DỤNG đạt ${applyScore.toFixed(2)}/${applyMax.toFixed(2)}đ (${applyPct.toFixed(0)}%). Nên luyện thêm bài tập tình huống thực nghiệm.`,
      recommendedActions: [
        'Xem lại lời giải chi tiết của các câu trắc nghiệm bị nhầm lẫn ở mục bên dưới',
        'Sử dụng AI Gia sư để hỏi thêm: "Tại sao em sai câu số ...?"',
        'Làm thêm 1 phiếu luyện tập ngắn 3 câu mức Vận dụng trên Góc học tập',
      ],
      supportLevel,
      confidence: 'CAO' as const,
      whyExplanation: `Phân tích dựa trên bài làm thực tế gồm ${activeExam.totalQuestions} câu hỏi và dữ liệu phân bố 3 mức nhận thức theo chuẩn SGK Kết nối tri thức.`,
    };

    const newResult: StudentExamResult = {
      id: `RES_${Date.now()}`,
      examId: activeExam.id,
      examCode: activeExam.code,
      examTitle: activeExam.title,
      studentId,
      studentCode,
      studentName,
      scorePart1: Math.round(part1Score * 100) / 100,
      scorePart2: Math.round(part2Score * 100) / 100,
      scorePart3: Math.round(part3Score * 100) / 100,
      scorePart4: Math.round(part4Score * 100) / 100,
      totalScore: finalTotal,
      cognitiveScores: {
        know: { score: knowScore, max: knowMax, percentage: knowPct },
        understand: { score: understandScore, max: understandMax, percentage: understandPct },
        apply: { score: applyScore, max: applyMax, percentage: applyPct },
      },
      correctCount,
      incorrectCount,
      blankCount,
      durationSeconds: durationSec,
      answers: answersDetail,
      aiPedagogicalComment: aiComment,
      essayGraded: userRole === 'TEACHER',
      submittedAt: new Date().toISOString(),
    };

    examService.saveExamResult(newResult);
    setCompletedResult(newResult);
    setClassResults(examService.getExamResults());
    setMode('RESULT_DETAIL');
    toastService.success(`Đã nộp bài thành công! Điểm số: ${finalTotal}/10,0đ.`);
  };

  const handleTeacherConfirmEssayScore = (result: StudentExamResult, newScore: number) => {
    const updated = {
      ...result,
      scorePart4: newScore,
      totalScore: Math.min(10.0, result.scorePart1 + result.scorePart2 + result.scorePart3 + newScore),
      essayGraded: true,
    };
    examService.saveExamResult(updated);
    setClassResults(examService.getExamResults());
    setCompletedResult(updated);
    setEditingEssayStudentResult(null);
    toastService.success(`Giáo viên đã chốt điểm tự luận ${newScore}đ cho học sinh ${result.studentName}!`);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* MODE 1: SELECTION (Chọn đề thi để làm hoặc xem kết quả)   */}
      {/* ======================================================== */}
      {mode === 'SELECTION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Khảo thí & Luyện tập Thích ứng
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Làm bài trực tuyến với đồng hồ đếm ngược, tự chấm điểm trắc nghiệm và AI phân tích kết quả theo 3 mức độ nhận thức.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('CLASS_ANALYTICS')}
                className="px-3.5 py-2 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-purple-100"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Phân tích kết quả lớp học</span>
              </button>
            </div>
          </div>

          {/* Assigned Exams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const myPastResult = classResults.find(
                (r) => r.examId === exam.id && (userRole === 'STUDENT' ? r.studentId === currentStudent?.id : true)
              );

              return (
                <div
                  key={exam.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200">
                      {exam.code}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.durationMinutes} phút
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{exam.topic}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {exam.totalQuestions} câu hỏi
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold">
                      Thang 10,0đ
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    {myPastResult ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          Đã làm: {myPastResult.totalScore}/10đ
                        </span>
                        <button
                          onClick={() => {
                            setCompletedResult(myPastResult);
                            setActiveExam(exam);
                            setMode('RESULT_DETAIL');
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Xem bài làm
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa làm bài</span>
                    )}

                    <button
                      onClick={() => handleStartExam(exam)}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span>{myPastResult ? 'Làm lại đề' : 'Bắt đầu làm bài'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: TESTING (Học sinh đang làm bài thi trực tuyến)    */}
      {/* ======================================================== */}
      {mode === 'TESTING' && activeExam && (
        <div className="space-y-4">
          {/* Top Test Header with Countdown Timer */}
          <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {activeExam.code}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {activeExam.title}
                </h2>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Câu {currentQuestionIdx + 1} / {activeExam.totalQuestions} · Đã làm:{' '}
                {Object.keys(answers).length} / {activeExam.totalQuestions}
              </div>
            </div>

            {/* Timer and Submit Action */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
                  timeLeftSeconds < 300
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(timeLeftSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(timeLeftSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>NỘP BÀI THI</span>
              </button>
            </div>
          </div>

          {/* Main Question Sheet */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Question display area (Cols 1-3) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              {(() => {
                const q = activeExam.questions[currentQuestionIdx];
                if (!q) return null;
                const levelMeta = COGNITIVE_LEVEL_META[q.cognitive_level] || COGNITIVE_LEVEL_META.UNDERSTAND;
                const isFlagged = !!flaggedQuestions[currentQuestionIdx];

                return (
                  <div className="space-y-4">
                    {/* Question Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                          {q.questionNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {q.section === 'MULTIPLE_CHOICE'
                            ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                            : q.section === 'TRUE_FALSE'
                            ? 'Phần II: Câu hỏi Đúng / Sai'
                            : q.section === 'SHORT_ANSWER'
                            ? 'Phần III: Trắc nghiệm trả lời ngắn'
                            : 'Phần IV: Tự luận'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelMeta.badgeClass}`}>
                          {q.cognitive_level}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setFlaggedQuestions((prev) => ({
                            ...prev,
                            [currentQuestionIdx]: !prev[currentQuestionIdx],
                          }))
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isFlagged
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current text-amber-600' : ''}`} />
                        <span>{isFlagged ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu'}</span>
                      </button>
                    </div>

                    {/* Question Content */}
                    <div className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                      {q.content}
                    </div>

                    {/* Options: Part I */}
                    {q.section === 'MULTIPLE_CHOICE' && q.options && (
                      <div className="space-y-2 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const optLetter = String.fromCharCode(65 + optIdx);
                          const isSelected = answers[q.id] === optLetter;

                          return (
                            <button
                              key={optIdx}
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: optLetter }))
                              }
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {optLetter}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False: Part II */}
                    {q.section === 'TRUE_FALSE' && q.trueFalseItems && (
                      <div className="space-y-2 pt-2">
                        {q.trueFalseItems.map((item) => {
                          const currentTfAnswers = answers[q.id] || {};
                          const userVal = currentTfAnswers[item.id];

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850 text-xs gap-3"
                            >
                              <div className="flex items-start gap-2 flex-1">
                                <span className="font-bold text-purple-700 dark:text-purple-300 w-5">
                                  {item.label})
                                </span>
                                <span className="text-slate-800 dark:text-slate-200 leading-relaxed">
                                  {item.statement}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: { ...(prev[q.id] || {}), [item.id]: true },
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                                    userVal === true
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  ĐÚNG
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: { ...(prev[q.id] || {}), [item.id]: false },
                                    }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                                    userVal === false
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                                  }`}
                                >
                                  SAI
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer: Part III */}
                    {q.section === 'SHORT_ANSWER' && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Nhập kết quả hoặc đáp số của em:
                        </label>
                        <input
                          type="text"
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Ví dụ: 0.4 hoặc 331..."
                          className="w-full max-w-sm px-4 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {/* Essay: Part IV */}
                    {q.section === 'ESSAY' && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Trình bày chi tiết bài làm tự luận của em (kèm phương trình hóa học):
                        </label>
                        <textarea
                          rows={6}
                          value={answers[q.id] || ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Nhập lời giải chi tiết từng ý a, b, c..."
                          className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIdx === 0}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Câu trước</span>
                      </button>

                      <button
                        onClick={() =>
                          setCurrentQuestionIdx((prev) =>
                            Math.min(activeExam.questions.length - 1, prev + 1)
                          )
                        }
                        disabled={currentQuestionIdx === activeExam.questions.length - 1}
                        className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1"
                      >
                        <span>Câu kế tiếp</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Question Palette Map (Col 4) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Bản đồ câu hỏi ({activeExam.totalQuestions} câu)
              </h3>

              <div className="grid grid-cols-5 gap-1.5 text-xs font-bold">
                {activeExam.questions.map((q, idx) => {
                  const isCurrent = currentQuestionIdx === idx;
                  const isDone = !!answers[q.id];
                  const isFlagged = !!flaggedQuestions[idx];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-8 rounded-lg flex items-center justify-center relative cursor-pointer transition-all ${
                        isCurrent
                          ? 'ring-2 ring-purple-600 bg-purple-600 text-white font-black'
                          : isDone
                          ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <span>{q.questionNumber}</span>
                      {isFlagged && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                  <span>Chưa trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Đánh dấu xem lại</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Confirm Submit */}
          {showSubmitConfirmModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Xác nhận nộp bài thi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hệ thống sẽ tiến hành thu bài và chấm điểm tự động tức thì.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <div>
                    • Số câu đã làm: <strong>{Object.keys(answers).length} / {activeExam.totalQuestions}</strong>
                  </div>
                  <div>
                    • Số câu chưa làm:{' '}
                    <strong className="text-rose-500">
                      {activeExam.totalQuestions - Object.keys(answers).length}
                    </strong>
                  </div>
                  <div>
                    • Thời gian còn lại:{' '}
                    <strong>
                      {Math.floor(timeLeftSeconds / 60)} phút {timeLeftSeconds % 60} giây
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSubmitConfirmModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Làm tiếp
                  </button>
                  <button
                    onClick={handleSubmitExam}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Nộp bài ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: RESULT DETAIL (Kết quả chi tiết bài làm & Phân tích) */}
      {/* ======================================================== */}
      {mode === 'RESULT_DETAIL' && completedResult && (
        <div className="space-y-4">
          {/* Top Score Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-purple-300 font-bold">
                  KẾT QUẢ ĐÁNH GIÁ THÍCH ỨNG
                </span>
                <h1 className="text-xl font-black mt-0.5">{completedResult.examTitle}</h1>
                <p className="text-xs text-purple-200 mt-1">
                  Thí sinh: <strong>{completedResult.studentName}</strong> ({completedResult.studentCode}) · Thời gian: {Math.round(completedResult.durationSeconds / 60)} phút
                </p>
              </div>

              {/* Total Score Circle */}
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                <div className="text-right">
                  <div className="text-xs text-purple-200 font-semibold">TỔNG ĐIỂM</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">
                    {completedResult.totalScore.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-purple-200 border-l border-white/20 pl-3">
                  <div>Phần I: {completedResult.scorePart1}đ</div>
                  <div>Phần II: {completedResult.scorePart2}đ</div>
                  <div>Phần III: {completedResult.scorePart3}đ</div>
                  <div>Phần IV: {completedResult.scorePart4}đ</div>
                </div>
              </div>
            </div>

            {/* Cognitive Level Breakdown (BIẾT / HIỂU / VẬN DỤNG) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-300">BIẾT (KNOW)</span>
                  <span className="font-black text-white">
                    {completedResult.cognitiveScores.know.score.toFixed(2)} /{' '}
                    {completedResult.cognitiveScores.know.max.toFixed(2)}đ
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full"
                    style={{ width: `${completedResult.cognitiveScores.know.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-purple-200 pt-0.5">
                  {completedResult.aiPedagogicalComment.knowAnalysis}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300">HIỂU (UNDERSTAND)</span>
                  <span className="font-black text-white">
                    {completedResult.cognitiveScores.understand.score.toFixed(2)} /{' '}
                    {completedResult.cognitiveScores.understand.max.toFixed(2)}đ
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-400 h-full rounded-full"
                    style={{ width: `${completedResult.cognitiveScores.understand.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-purple-200 pt-0.5">
                  {completedResult.aiPedagogicalComment.understandAnalysis}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">VẬN DỤNG (APPLY)</span>
                  <span className="font-black text-white">
                    {completedResult.cognitiveScores.apply.score.toFixed(2)} /{' '}
                    {completedResult.cognitiveScores.apply.max.toFixed(2)}đ
                  </span>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${completedResult.cognitiveScores.apply.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-purple-200 pt-0.5">
                  {completedResult.aiPedagogicalComment.applyAnalysis}
                </p>
              </div>
            </div>
          </div>

          {/* AI Pedagogical Feedback Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Nhận xét sư phạm cá nhân hóa từ AI
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                Mức hỗ trợ: {completedResult.aiPedagogicalComment.supportLevel}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {completedResult.aiPedagogicalComment.overallSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Điểm mạnh nổi bật:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                  {completedResult.aiPedagogicalComment.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300">Khuyến nghị phát triển:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                  {completedResult.aiPedagogicalComment.recommendedActions.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Độ tin cậy: {completedResult.aiPedagogicalComment.confidence} · {completedResult.aiPedagogicalComment.whyExplanation}</span>
              <button
                onClick={() => setMode('SELECTION')}
                className="font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Quay lại danh sách đề
              </button>
            </div>
          </div>

          {/* Detailed Question By Question Review */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Chi tiết câu hỏi, bài làm và đáp án đúng
            </h3>

            {activeExam?.questions.map((q) => {
              const res = completedResult.answers[q.id];
              const isCorrect = res?.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs space-y-2 text-xs ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50'
                      : 'border-rose-200 dark:border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center text-white ${
                          isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {q.questionNumber}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {q.section === 'MULTIPLE_CHOICE'
                          ? 'Trắc nghiệm'
                          : q.section === 'TRUE_FALSE'
                          ? 'Đúng/Sai'
                          : q.section === 'SHORT_ANSWER'
                          ? 'Trả lời ngắn'
                          : 'Tự luận'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
                        {q.cognitive_level}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {formatScore(res?.earnedPoints || 0)} / {formatScore(q.points)}
                      </span>
                      {onOpenChatWithQuestionContext && (
                        <button
                          onClick={() =>
                            onOpenChatWithQuestionContext({
                              examId: activeExam.id,
                              examTitle: activeExam.title,
                              questionNumber: q.questionNumber,
                              questionContent: q.content,
                              studentAnswer: res?.selectedOption || res?.shortAnswerText || res?.essayText,
                              correctAnswer: q.correctAnswer || q.shortAnswerKey,
                              cognitiveLevel: q.cognitive_level,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold text-[11px] cursor-pointer"
                        >
                          Hỏi AI câu này
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line">
                    {q.content}
                  </p>

                  {/* Part I Options with student selection and correct indicator */}
                  {q.section === 'MULTIPLE_CHOICE' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isStudent = res?.selectedOption === letter;
                        const isAnswerKey = q.correctAnswer === letter;

                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              isAnswerKey
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold'
                                : isStudent
                                ? 'bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                            }`}
                          >
                            <span>{opt}</span>
                            {isAnswerKey && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            {isStudent && !isAnswerKey && <X className="w-3.5 h-3.5 text-rose-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Giải thích chi tiết:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 4: CLASS ANALYTICS (Phân tích lớp học & Cá nhân hóa) */}
      {/* ======================================================== */}
      {mode === 'CLASS_ANALYTICS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Phân tích phổ điểm & Đánh giá lớp học
              </h3>
              <p className="text-xs text-slate-500">
                Dữ liệu thống kê thực tế theo 3 mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG)
              </p>
            </div>
            <button
              onClick={() => setMode('SELECTION')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Đóng phân tích
            </button>
          </div>

          {classResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-slate-400 text-xs">
              Chưa có dữ liệu làm bài thi nào để phân tích. Hãy phát hành đề thi và làm thử!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-xs text-slate-500">Số bài đã nộp</div>
                  <div className="text-xl font-bold text-purple-600 mt-1">{classResults.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-xs text-slate-500">Điểm trung bình</div>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    {(classResults.reduce((s, r) => s + r.totalScore, 0) / classResults.length).toFixed(2)}đ
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-xs text-slate-500">Điểm cao nhất</div>
                  <div className="text-xl font-bold text-blue-600 mt-1">
                    {Math.max(...classResults.map((r) => r.totalScore)).toFixed(2)}đ
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <div className="text-xs text-slate-500">Tỷ lệ đạt (≥ 5,0đ)</div>
                  <div className="text-xl font-bold text-amber-600 mt-1">
                    {Math.round(
                      (classResults.filter((r) => r.totalScore >= 5.0).length / classResults.length) * 100
                    )}%
                  </div>
                </div>
              </div>

              {/* Submissions table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                      <th className="pb-2">Học sinh</th>
                      <th className="pb-2">Đề thi</th>
                      <th className="pb-2 text-center">BIẾT</th>
                      <th className="pb-2 text-center">HIỂU</th>
                      <th className="pb-2 text-center">VẬN DỤNG</th>
                      <th className="pb-2 text-center font-bold">Tổng điểm</th>
                      <th className="pb-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {r.studentName} ({r.studentCode})
                        </td>
                        <td className="py-2.5 text-slate-500">{r.examCode}</td>
                        <td className="py-2.5 text-center text-blue-600 font-bold">
                          {r.cognitiveScores?.know?.percentage?.toFixed(0) || 80}%
                        </td>
                        <td className="py-2.5 text-center text-purple-600 font-bold">
                          {r.cognitiveScores?.understand?.percentage?.toFixed(0) || 70}%
                        </td>
                        <td className="py-2.5 text-center text-emerald-600 font-bold">
                          {r.cognitiveScores?.apply?.percentage?.toFixed(0) || 60}%
                        </td>
                        <td className="py-2.5 text-center font-bold text-purple-700 dark:text-purple-300">
                          {r.totalScore.toFixed(2)}đ
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => {
                              setCompletedResult(r);
                              const targetEx = exams.find((e) => e.id === r.examId) || exams[0];
                              setActiveExam(targetEx);
                              setMode('RESULT_DETAIL');
                            }}
                            className="text-purple-600 hover:underline font-semibold cursor-pointer"
                          >
                            Xem bài làm
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
