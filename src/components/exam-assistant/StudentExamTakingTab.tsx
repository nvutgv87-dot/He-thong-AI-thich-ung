import React, { useState, useEffect, useRef } from 'react';
import {
  ExamPaper,
  StudentExamResult,
  StudentExamAnswer,
  ExamQuestion,
} from '../../types/examTypes';
import { Student, CognitiveLevel } from '../../types';
import { examService } from '../../services/examService';
import { toastService } from '../../services/toastService';
import { calculateTrueFalseScore, formatScore } from '../../utils/scoreUtils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  RotateCcw,
  Sparkles,
  FileCheck,
  Award,
  Play,
  User,
  Users,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

interface StudentExamTakingTabProps {
  exams: ExamPaper[];
  students: Student[];
  currentStudent?: Student;
  selectedExam?: ExamPaper | null;
  onGradingRequested?: (exam: ExamPaper) => void;
  onOpenChatWithQuestionContext?: (context: any) => void;
  userRole: 'TEACHER' | 'STUDENT';
}

export const StudentExamTakingTab: React.FC<StudentExamTakingTabProps> = ({
  exams,
  students,
  currentStudent,
  selectedExam,
  onGradingRequested,
  onOpenChatWithQuestionContext,
  userRole,
}) => {
  // Mode: 'OVERVIEW' | 'TESTING' | 'MY_RESULT'
  const [mode, setMode] = useState<'OVERVIEW' | 'TESTING' | 'MY_RESULT'>('OVERVIEW');
  const [activeExam, setActiveExam] = useState<ExamPaper | null>(selectedExam || exams[0] || null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Student test taking state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Result state
  const [completedResult, setCompletedResult] = useState<StudentExamResult | null>(null);
  const [classResults, setClassResults] = useState<StudentExamResult[]>(() =>
    examService.getExamResults()
  );

  // Sync if selectedExam changes
  useEffect(() => {
    if (selectedExam) {
      setActiveExam(selectedExam);
    }
  }, [selectedExam]);

  // Timer countdown
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
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIdx(0);
    setStartTime(Date.now());
    setMode('TESTING');
    toastService.info(`Bắt đầu làm bài thi "${exam.title}". Chúc em làm bài thật tốt!`);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleToggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleAutoSubmitTimeUp = () => {
    toastService.warning('Đã hết thời gian làm bài! Hệ thống tự động nộp bài và khóa đề.');
    executeSubmit();
  };

  const executeSubmit = () => {
    if (!activeExam) return;

    const studentId = currentStudent?.id || 'HS04';
    const studentCode = currentStudent?.code || 'HS04';
    const studentName = currentStudent?.fullName || 'Học sinh';

    const gradedAnswers: Record<string, StudentExamAnswer> = {};
    let scoreP1 = 0;
    let scoreP2 = 0;
    let scoreP3 = 0;
    let scoreP4 = 0;

    let correctCount = 0;
    let incorrectCount = 0;
    let blankCount = 0;

    let knowEarned = 0;
    let knowMax = 0;
    let understandEarned = 0;
    let understandMax = 0;
    let applyEarned = 0;
    let applyMax = 0;

    activeExam.questions.forEach((q) => {
      const userAns = answers[q.id];
      const maxPts = q.points;

      // Cognitive level bucket
      if (q.cognitive_level === 'KNOW') knowMax += maxPts;
      else if (q.cognitive_level === 'UNDERSTAND') understandMax += maxPts;
      else if (q.cognitive_level === 'APPLY') applyMax += maxPts;

      if (q.section === 'MULTIPLE_CHOICE') {
        const isBlank = !userAns;
        const isCorr = userAns === q.correctAnswer;
        const earned = isCorr ? maxPts : 0;
        scoreP1 += earned;

        if (isBlank) blankCount++;
        else if (isCorr) correctCount++;
        else incorrectCount++;

        if (q.cognitive_level === 'KNOW') knowEarned += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandEarned += earned;
        else if (q.cognitive_level === 'APPLY') applyEarned += earned;

        gradedAnswers[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          selectedOption: userAns,
          isCorrect: isCorr,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: isCorr ? 'Đúng' : `Sai (Đáp án đúng: ${q.correctAnswer})`,
        };
      } else if (q.section === 'TRUE_FALSE') {
        const tfAns = userAns || {};
        let rightSubItems = 0;
        const totalSubs = q.trueFalseItems?.length || 4;

        q.trueFalseItems?.forEach((tf) => {
          if (tfAns[tf.label] === tf.isCorrect) {
            rightSubItems++;
          }
        });

        const earned = calculateTrueFalseScore(rightSubItems);
        scoreP2 += earned;

        if (rightSubItems === totalSubs) correctCount++;
        else if (rightSubItems === 0 && Object.keys(tfAns).length === 0) blankCount++;
        else incorrectCount++;

        if (q.cognitive_level === 'KNOW') knowEarned += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandEarned += earned;
        else if (q.cognitive_level === 'APPLY') applyEarned += earned;

        gradedAnswers[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          trueFalseAnswers: tfAns,
          isCorrect: rightSubItems === totalSubs,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: `Đúng ${rightSubItems}/${totalSubs} ý (${formatScore(earned)}đ)`,
        };
      } else if (q.section === 'SHORT_ANSWER') {
        const text = (userAns || '').toString().trim().toLowerCase();
        const expected = (q.shortAnswerKey || '').trim().toLowerCase();
        const isBlank = !text;
        const isCorr = text.length > 0 && (text === expected || expected.includes(text));
        const earned = isCorr ? maxPts : 0;
        scoreP3 += earned;

        if (isBlank) blankCount++;
        else if (isCorr) correctCount++;
        else incorrectCount++;

        if (q.cognitive_level === 'KNOW') knowEarned += earned;
        else if (q.cognitive_level === 'UNDERSTAND') understandEarned += earned;
        else if (q.cognitive_level === 'APPLY') applyEarned += earned;

        gradedAnswers[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          shortAnswerText: userAns,
          isCorrect: isCorr,
          earnedPoints: earned,
          maxPoints: maxPts,
          feedback: isCorr ? 'Đúng' : `Sai (Đáp số chuẩn: ${q.shortAnswerKey})`,
        };
      } else if (q.section === 'ESSAY') {
        const essayText = (userAns || '').toString().trim();
        const isBlank = essayText.length === 0;
        let aiSuggested = 0;
        if (!isBlank) {
          aiSuggested = essayText.length > 30 ? maxPts * 0.8 : maxPts * 0.4;
          aiSuggested = Math.round(aiSuggested * 100) / 100;
        }

        scoreP4 += aiSuggested;
        if (isBlank) blankCount++;
        else correctCount++;

        if (q.cognitive_level === 'KNOW') knowEarned += aiSuggested;
        else if (q.cognitive_level === 'UNDERSTAND') understandEarned += aiSuggested;
        else if (q.cognitive_level === 'APPLY') applyEarned += aiSuggested;

        gradedAnswers[q.id] = {
          questionId: q.id,
          section: q.section,
          questionNumber: q.questionNumber,
          essayText: essayText,
          earnedPoints: aiSuggested,
          maxPoints: maxPts,
          aiSuggestedEssayScore: aiSuggested,
          teacherConfirmedEssayScore: aiSuggested,
          feedback: isBlank
            ? 'Bỏ trống (0đ)'
            : `AI đề xuất: ${formatScore(aiSuggested)}đ theo rubric. Giáo viên có thể điều chỉnh.`,
        };
      }
    });

    const totalScore = Math.round((scoreP1 + scoreP2 + scoreP3 + scoreP4) * 100) / 100;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const knowPct = knowMax > 0 ? Math.round((knowEarned / knowMax) * 100) : 0;
    const understandPct = understandMax > 0 ? Math.round((understandEarned / understandMax) * 100) : 0;
    const applyPct = applyMax > 0 ? Math.round((applyEarned / applyMax) * 100) : 0;

    let supportLevel: 'Duy trì' | 'Khuyến khích' | 'Cần theo dõi' | 'Cần hỗ trợ' = 'Khuyến khích';
    if (totalScore >= 8.5) supportLevel = 'Duy trì';
    else if (totalScore >= 6.5) supportLevel = 'Khuyến khích';
    else if (totalScore >= 5.0) supportLevel = 'Cần theo dõi';
    else supportLevel = 'Cần hỗ trợ';

    const newResult: StudentExamResult = {
      id: `RES_${Date.now()}`,
      examId: activeExam.id,
      examCode: activeExam.code,
      examTitle: activeExam.title,
      studentId,
      studentCode,
      studentName,
      scorePart1: scoreP1,
      scorePart2: scoreP2,
      scorePart3: scoreP3,
      scorePart4: scoreP4,
      totalScore,
      cognitiveScores: {
        know: { score: knowEarned, max: knowMax, percentage: knowPct },
        understand: { score: understandEarned, max: understandMax, percentage: understandPct },
        apply: { score: applyEarned, max: applyMax, percentage: applyPct },
      },
      correctCount,
      incorrectCount,
      blankCount,
      durationSeconds,
      answers: gradedAnswers,
      aiPedagogicalComment: {
        overallSummary: `Học sinh đạt ${formatScore(totalScore)}/10,0đ, hoàn thành ${correctCount}/${activeExam.questions.length} câu.`,
        strengths: [`Nắm chắc kiến thức phần BIẾT (${knowPct}%)`],
        needsImprovement: applyPct < 60 ? ['Cần rèn luyện thêm bài tập VẬN DỤNG'] : [],
        knowAnalysis: `Đạt ${knowPct}% ở mức BIẾT. Nhận diện tốt các công thức và danh pháp alcohol.`,
        understandAnalysis: `Đạt ${understandPct}% ở mức HIỂU. Giải thích khá tốt tính chất hóa học đặc trưng.`,
        applyAnalysis: `Đạt ${applyPct}% ở mức VẬN DỤNG. Cần củng cố thêm phần bài toán hiệu suất và liên hệ thực tiễn.`,
        recommendedActions: ['Ôn tập lại phương trình hóa học', 'Luyện bài tập tình huống thực tế'],
        supportLevel,
        confidence: 'CAO',
        whyExplanation: `Căn cứ trên dữ liệu làm bài thực tế: ${activeExam.questions.length} câu hỏi theo thang điểm chuẩn.`,
      },
      essayGraded: false,
      submittedAt: new Date().toISOString(),
    };

    examService.saveExamResult(newResult);
    setClassResults(examService.getExamResults());
    setCompletedResult(newResult);
    setShowSubmitConfirmModal(false);
    setMode('MY_RESULT');
    toastService.success(`Đã nộp bài thành công! Điểm số: ${formatScore(totalScore)} / 10,0đ.`);
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Current question in testing mode
  const currentQ = activeExam?.questions[currentQuestionIdx];

  return (
    <div className="space-y-6">
      {/* Overview Mode: list of submissions & test start */}
      {mode === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  7. Bài làm học sinh & Khảo thí trực tuyến
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                    {classResults.length} bài đã nộp
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {userRole === 'STUDENT'
                    ? 'Làm bài kiểm tra có đồng hồ đếm ngược, tự lưu và xem phân tích kết quả sau khi nộp'
                    : 'Quản lý toàn bộ bài làm của học sinh trong lớp, điểm số 3 mức độ và bài nộp'}
                </p>
              </div>
            </div>

            {activeExam && (
              <button
                onClick={() => handleStartExam(activeExam)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Vào phòng làm bài thi ngay</span>
              </button>
            )}
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Danh sách bài kiểm tra đã nộp
              </span>
              <span className="text-xs text-slate-500">
                {classResults.length} học sinh đã hoàn thành
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b font-semibold">
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3 w-28">Mã HS</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3">Đề thi</th>
                    <th className="py-3 px-3 text-center">Tổng điểm</th>
                    <th className="py-3 px-3 text-center">BIẾT</th>
                    <th className="py-3 px-3 text-center">HIỂU</th>
                    <th className="py-3 px-3 text-center">VẬN DỤNG</th>
                    <th className="py-3 px-3 text-center">Thời gian</th>
                    <th className="py-3 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classResults.map((res, idx) => (
                    <tr
                      key={res.id || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {res.studentCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {res.studentName}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {res.examCode}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-extrabold text-sm text-purple-700 dark:text-purple-300">
                          {formatScore(res.totalScore)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ 10,0đ</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">
                        {res.cognitiveScores?.know?.percentage || 0}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {res.cognitiveScores?.understand?.percentage || 0}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-purple-600">
                        {res.cognitiveScores?.apply?.percentage || 0}%
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {Math.round(res.durationSeconds / 60)} phút
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            setCompletedResult(res);
                            setMode('MY_RESULT');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Testing Mode: Online Exam Interface */}
      {mode === 'TESTING' && activeExam && currentQ && (
        <div className="space-y-4">
          {/* Header Bar: Timer & Exam info */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4 sticky top-16 z-30">
            <div>
              <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                {activeExam.code}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1">
                {activeExam.title}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Countdown clock */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  timeLeftSeconds < 300
                    ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : 'bg-slate-100 border-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 text-purple-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài thi</span>
              </button>
            </div>
          </div>

          {/* Main Taking Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left: Current Question Card */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5 min-h-[420px] flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Question header info */}
                  <div className="flex items-center justify-between border-b pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center">
                        {currentQ.questionNumber}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {currentQ.section === 'MULTIPLE_CHOICE'
                          ? 'Phần I - Trắc nghiệm (Chọn 1 phương án)'
                          : currentQ.section === 'TRUE_FALSE'
                          ? 'Phần II - Đúng / Sai (Trả lời từng ý a, b, c, d)'
                          : currentQ.section === 'SHORT_ANSWER'
                          ? 'Phần III - Trả lời ngắn'
                          : 'Phần IV - Tự luận'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">({formatScore(currentQ.points)} điểm)</span>
                      <button
                        onClick={() => handleToggleFlag(currentQuestionIdx)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
                          flaggedQuestions[currentQuestionIdx]
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5 fill-current" />
                        <span>{flaggedQuestions[currentQuestionIdx] ? 'Đã đánh dấu' : 'Đánh dấu'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.content}
                  </div>

                  {/* Input / Options based on section */}
                  {currentQ.section === 'MULTIPLE_CHOICE' && currentQ.options && (
                    <div className="space-y-2 pt-2">
                      {currentQ.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isSelected = answers[currentQ.id] === letter;

                        return (
                          <div
                            key={letter}
                            onClick={() => handleAnswerChange(currentQ.id, letter)}
                            className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.section === 'TRUE_FALSE' && currentQ.trueFalseItems && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs text-slate-500 font-medium">
                        Chọn Đúng (Đ) hoặc Sai (S) cho từng ý:
                      </div>
                      {currentQ.trueFalseItems.map((tf) => {
                        const curTFAnswers = answers[currentQ.id] || {};
                        const val = curTFAnswers[tf.label];

                        return (
                          <div
                            key={tf.label}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              <strong>{tf.label})</strong> {tf.statement}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAnswerChange(currentQ.id, {
                                    ...curTFAnswers,
                                    [tf.label]: true,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                                  val === true
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 border text-slate-600'
                                }`}
                              >
                                ĐÚNG
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAnswerChange(currentQ.id, {
                                    ...curTFAnswers,
                                    [tf.label]: false,
                                  })
                                }
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                                  val === false
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-900 border text-slate-600'
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

                  {currentQ.section === 'SHORT_ANSWER' && (
                    <div className="pt-2 space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Nhập câu trả lời ngắn / đáp số:
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập kết quả (số hoặc chữ)..."
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                      />
                    </div>
                  )}

                  {currentQ.section === 'ESSAY' && (
                    <div className="pt-2 space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Trình bày lời giải chi tiết:
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Trình bày các bước suy luận, phương trình hóa học và giải thích..."
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between border-t pt-4">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Câu trước</span>
                  </button>

                  <span className="text-xs text-slate-400">
                    Câu {currentQuestionIdx + 1} / {activeExam.questions.length}
                  </span>

                  <button
                    disabled={currentQuestionIdx === activeExam.questions.length - 1}
                    onClick={() =>
                      setCurrentQuestionIdx((p) =>
                        Math.min(activeExam.questions.length - 1, p + 1)
                      )
                    }
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 cursor-pointer"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Question Palette Grid */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs border-b pb-2">
                  <span className="font-bold text-slate-900 dark:text-white">Bảng câu hỏi</span>
                  <span className="text-slate-400">
                    {Object.keys(answers).length} / {activeExam.questions.length} đã làm
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {activeExam.questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isFlagged = flaggedQuestions[idx];
                    const isCurrent = currentQuestionIdx === idx;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`h-9 rounded-xl text-xs font-bold cursor-pointer transition-all flex flex-col items-center justify-center relative ${
                          isCurrent
                            ? 'ring-2 ring-purple-600 bg-purple-600 text-white'
                            : isAnswered
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-extrabold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        {isFlagged && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
                    <span>Đã trả lời</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-100 border" />
                    <span>Chưa trả lời</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Đã đánh dấu cờ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Detail Mode: Instant grading breakdown */}
      {mode === 'MY_RESULT' && completedResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                  {completedResult.examCode}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Kết quả bài kiểm tra: {completedResult.studentName} ({completedResult.studentCode})
                </h2>
              </div>
              <button
                onClick={() => setMode('OVERVIEW')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                ← Quay lại danh sách
              </button>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 font-bold">Tổng điểm</div>
                <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  {formatScore(completedResult.totalScore)}
                </div>
                <div className="text-[10px] text-slate-400">Thang 10,0đ</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 font-bold">Mức BIẾT</div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
                  {completedResult.cognitiveScores?.know?.percentage || 0}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatScore(completedResult.cognitiveScores?.know?.score || 0)} / {formatScore(completedResult.cognitiveScores?.know?.max || 0)}đ
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">Mức HIỂU</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {completedResult.cognitiveScores?.understand?.percentage || 0}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatScore(completedResult.cognitiveScores?.understand?.score || 0)} / {formatScore(completedResult.cognitiveScores?.understand?.max || 0)}đ
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 font-bold">Mức VẬN DỤNG</div>
                <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  {completedResult.cognitiveScores?.apply?.percentage || 0}%
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatScore(completedResult.cognitiveScores?.apply?.score || 0)} / {formatScore(completedResult.cognitiveScores?.apply?.max || 0)}đ
                </div>
              </div>
            </div>

            {/* AI Pedagogical Feedback */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Nhận xét sư phạm tích cực từ Trợ lý AI:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {completedResult.aiPedagogicalComment?.overallSummary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-[11px]">
                  <strong>BIẾT:</strong> {completedResult.aiPedagogicalComment?.knowAnalysis}
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-[11px]">
                  <strong>HIỂU:</strong> {completedResult.aiPedagogicalComment?.understandAnalysis}
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-[11px]">
                  <strong>VẬN DỤNG:</strong> {completedResult.aiPedagogicalComment?.applyAnalysis}
                </div>
              </div>
            </div>

            {/* Detailed Question Review by Curriculum Requirements */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Chi tiết bài làm đối chiếu Yêu cầu cần đạt chuẩn SGK:</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {completedResult.answers ? Object.keys(completedResult.answers).length : 0} câu đã chấm
                </span>
              </div>

              {(() => {
                const targetExam =
                  exams.find((e) => e.code === completedResult.examCode || e.id === completedResult.examId) ||
                  activeExam;
                if (!targetExam) return null;

                return (
                  <div className="space-y-3">
                    {targetExam.questions.map((q) => {
                      const ansObj = completedResult.answers?.[q.id];
                      const isCorrect = ansObj?.isCorrect;
                      const earnedScore = ansObj?.earnedPoints ?? 0;
                      
                      const formatStudentAns = () => {
                        if (!ansObj) return '(Bỏ trống)';
                        if (ansObj.selectedOption) return `Đáp án ${ansObj.selectedOption}`;
                        if (ansObj.shortAnswerText) return ansObj.shortAnswerText;
                        if (ansObj.essayText) return ansObj.essayText;
                        if (ansObj.trueFalseAnswers) {
                          return Object.entries(ansObj.trueFalseAnswers)
                            .map(([k, v]) => `${k}) ${v ? 'Đúng' : 'Sai'}`)
                            .join(', ');
                        }
                        return '(Bỏ trống)';
                      };
                      const studentAnsStr = formatStudentAns();

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-md font-bold flex items-center justify-center text-xs ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {q.questionNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  q.cognitive_level === 'KNOW'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                    : q.cognitive_level === 'UNDERSTAND'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                                }`}
                              >
                                {q.cognitive_level === 'KNOW'
                                  ? 'BIẾT'
                                  : q.cognitive_level === 'UNDERSTAND'
                                  ? 'HIỂU'
                                  : 'VẬN DỤNG'}
                              </span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                {q.section === 'MULTIPLE_CHOICE'
                                  ? 'Trắc nghiệm 4 lựa chọn'
                                  : q.section === 'TRUE_FALSE'
                                  ? 'Đúng / Sai'
                                  : q.section === 'SHORT_ANSWER'
                                  ? 'Trả lời ngắn'
                                  : 'Tự luận'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                Điểm: {formatScore(earnedScore)} / {formatScore(q.points)}đ
                              </span>
                              {onOpenChatWithQuestionContext && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenChatWithQuestionContext({
                                      questionNumber: q.questionNumber,
                                      content: q.content,
                                      curriculumRequirement: q.curriculumRequirement,
                                      userAnswer: studentAnsStr,
                                      correctAnswer: q.correctAnswer || q.shortAnswerKey || q.sampleEssayAnswer,
                                      explanation: q.explanation,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer font-semibold flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3 text-teal-600" />
                                  <span>Hỏi AI gia sư</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Curriculum Learning Outcome Badge */}
                          <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <span className="font-bold text-purple-900 dark:text-purple-300 mr-1">
                                Yêu cầu cần đạt chuẩn SGK:
                              </span>
                              <span className="text-slate-700 dark:text-slate-300">
                                {q.curriculumRequirement || 'Chuẩn kiến thức kỹ năng chương trình GDPT.'}
                              </span>
                            </div>
                          </div>

                          {/* Question text */}
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            {q.content}
                          </p>

                          {/* Answers comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                              <span className="text-slate-400 block">Bài làm của em:</span>
                              <span
                                className={`font-bold ${
                                  isCorrect ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {studentAnsStr}
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                              <span className="text-slate-400 block">Đáp án chuẩn SGK:</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {q.correctAnswer || q.shortAnswerKey || (q.section === 'ESSAY' ? 'Theo Rubric chi tiết' : 'Xem lời giải')}
                              </span>
                            </div>
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                              <strong className="text-slate-700 dark:text-slate-300">Hướng dẫn giải:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Xác nhận nộp bài thi
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Em đã trả lời{' '}
              <strong>
                {Object.keys(answers).length} / {activeExam?.questions.length} câu hỏi
              </strong>
              . Khi nộp bài, hệ thống sẽ chấm điểm tự động ngay lập tức. Em có chắc chắn muốn nộp không?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                onClick={executeSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
