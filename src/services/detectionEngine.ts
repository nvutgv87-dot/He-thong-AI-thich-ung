/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Student,
  WeeklyLearningRecord,
  RiskSignal,
  SignalEvidenceItem,
  WarningLevel,
  SignalFrequency,
  SignalType,
} from '../types';

export interface DetectionResult {
  hasSignal: boolean;
  signal?: Omit<RiskSignal, 'id' | 'detectedDate' | 'status'>;
  reason: string;
  dataSufficiency: 'ĐẦY_ĐỦ' | 'THIẾU_MỘT_PHẦN' | 'CHƯA_ĐỦ';
}

/**
 * Algorithmic Early Warning Signal Detection
 * Core rule: Compare with the student's own individual history (Personal Baseline),
 * NEVER compare students with each other to label good/bad.
 * Single outlier events (e.g. 1 late assignment) are filtered out as non-systemic.
 */
export function analyzeStudentSignals(
  student: Student,
  records: WeeklyLearningRecord[]
): DetectionResult {
  const stuRecords = records
    .filter((r) => r.studentId === student.id)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  // Requirement 26 & 37 (Scenario 5): If less than 3 weeks, data is insufficient -> DO NOT WARN!
  if (stuRecords.length < 3) {
    return {
      hasSignal: false,
      reason: 'Chưa đủ dữ liệu tối thiểu (cần ít nhất 3 tuần để lập baseline và phân tích xu hướng).',
      dataSufficiency: 'CHƯA_ĐỦ',
    };
  }

  const baseline = student.baseline;
  // If baseline is not established, fallback
  if (!baseline || baseline.onTimeRate === 0) {
    return {
      hasSignal: false,
      reason: 'Học sinh chưa có dữ liệu baseline được chuẩn hóa.',
      dataSufficiency: 'CHƯA_ĐỦ',
    };
  }

  // Look at the recent 2-3 weeks
  const recentWeeks = stuRecords.slice(-3);
  const latestWeek = recentWeeks[recentWeeks.length - 1];

  // Calculate recent on-time rate
  const totalAssignedRecent = recentWeeks.reduce((acc, r) => acc + r.tasksAssigned, 0);
  const totalOnTimeRecent = recentWeeks.reduce((acc, r) => acc + r.tasksCompletedOnTime, 0);
  const totalLateRecent = recentWeeks.reduce((acc, r) => acc + r.tasksCompletedLate, 0);
  const totalOverdueRecent = recentWeeks.reduce((acc, r) => acc + r.tasksOverdue, 0);
  const avgParticipationRecent = recentWeeks.reduce((acc, r) => acc + r.participationLevel, 0) / recentWeeks.length;
  
  const recentOnTimeRate = totalAssignedRecent > 0 
    ? Math.round((totalOnTimeRecent / totalAssignedRecent) * 100) 
    : 100;

  const onTimeDelta = recentOnTimeRate - baseline.onTimeRate;
  const participationDelta = +(avgParticipationRecent - baseline.participationScore).toFixed(1);

  // Scenario 2: Single isolated event check
  // If only the latest week has a late task, but earlier weeks were fine and total late <= 1:
  if (latestWeek.tasksCompletedLate === 1 && totalLateRecent === 1 && totalOverdueRecent === 0 && Math.abs(onTimeDelta) < 15) {
    return {
      hasSignal: false,
      reason: 'Ghi nhận một lần nộp bài muộn đơn lẻ, không hình thành xu hướng. Hệ thống không kích hoạt cảnh báo.',
      dataSufficiency: 'ĐẦY_ĐỦ',
    };
  }

  // Check for Delay Indicator (Trì hoãn nhiệm vụ)
  const isDecliningOnTime = onTimeDelta <= -25;
  const hasMultipleDelays = (totalLateRecent + totalOverdueRecent) >= 3;
  const hasConsecutiveLate = recentWeeks.every((w) => (w.tasksCompletedLate + w.tasksOverdue) > 0);

  // Check for Attention/Participation Indicator (Suy giảm tham gia)
  const isDecliningParticipation = participationDelta <= -1.2;

  // Evaluate Level and Signal Type
  let detectedType: SignalType | null = null;
  let level: WarningLevel = 0;
  let frequency: SignalFrequency = 'ĐƠN_LẺ';
  let confidence = 65;
  const evidenceItems: SignalEvidenceItem[] = [];

  if (isDecliningOnTime && hasConsecutiveLate) {
    detectedType = 'TRÌ_HOÃN_NHIỆM_VỤ';
    level = recentWeeks.length >= 3 && onTimeDelta <= -40 ? 2 : 1;
    frequency = recentWeeks.length >= 3 ? 'XU_HƯỚNG_MỚI' : 'LẶP_LẠI';
    confidence = Math.min(95, 70 + Math.abs(onTimeDelta) / 2);

    evidenceItems.push({
      indicatorName: 'Tỷ lệ nộp bài đúng hạn',
      baselineValue: `${baseline.onTimeRate}%`,
      currentValue: `${recentOnTimeRate}%`,
      delta: `${onTimeDelta}%`,
      significance: Math.abs(onTimeDelta) > 35 ? 'RÕ_RỆT' : 'ĐÁNG_LƯU_Ý',
    });

    evidenceItems.push({
      indicatorName: 'Số nhiệm vụ nộp muộn / quá hạn (3 tuần)',
      baselineValue: '0 - 1 bài',
      currentValue: `${totalLateRecent + totalOverdueRecent} bài`,
      delta: `+${totalLateRecent + totalOverdueRecent} bài`,
      significance: 'RÕ_RỆT',
    });
  } else if (isDecliningParticipation) {
    detectedType = 'SUY_GIẢM_THAM_GIA';
    level = participationDelta <= -1.8 ? 2 : 1;
    frequency = 'XU_HƯỚNG_MỚI';
    confidence = 78;

    evidenceItems.push({
      indicatorName: 'Mức độ tham gia và tương tác tiết học',
      baselineValue: `${baseline.participationScore}/5`,
      currentValue: `${avgParticipationRecent.toFixed(1)}/5`,
      delta: `${participationDelta} điểm`,
      significance: 'ĐÁNG_LƯU_Ý',
    });
  }

  if (!detectedType || level === 0) {
    return {
      hasSignal: false,
      reason: 'Dữ liệu học tập duy trì ổn định so với baseline cá nhân.',
      dataSufficiency: 'ĐẦY_ĐỦ',
    };
  }

  const observedWeekNumbers = recentWeeks.map((w) => w.weekNumber);

  return {
    hasSignal: true,
    signal: {
      studentId: student.id,
      type: detectedType,
      level,
      frequency,
      confidenceScore: Math.round(confidence),
      title: detectedType === 'TRÌ_HOÃN_NHIỆM_VỤ'
        ? `Xu hướng hoàn thành nhiệm vụ muộn xuất hiện trong ${observedWeekNumbers.length} tuần gần đây`
        : `Xu hướng giảm mức độ tương tác học tập trong ${observedWeekNumbers.length} tuần gần đây`,
      evidence: {
        primaryIndicators: evidenceItems,
        observedWeeks: observedWeekNumbers,
        dataSufficiency: 'ĐẦY_ĐỦ',
      },
      explanation: {
        whatIsChanging: detectedType === 'TRÌ_HOÃN_NHIỆM_VỤ'
          ? `Tỷ lệ hoàn thành nhiệm vụ đúng hạn có xu hướng giảm từ ${baseline.onTimeRate}% xuống còn ${recentOnTimeRate}% qua các tuần quan sát.`
          : `Mức độ tham gia thảo luận và tương tác trong tiết học có biểu hiện chững lại so với mức trung bình ban đầu.`,
        sinceWhen: `Bắt đầu xuất hiện rõ từ tuần thứ ${observedWeekNumbers[0]}.`,
        supportingData: [
          `Tỷ lệ đúng hạn 3 tuần gần nhất: ${recentOnTimeRate}%`,
          `Số nhiệm vụ trễ/quá hạn: ${totalLateRecent + totalOverdueRecent} bài`,
          `Mức độ tham gia trung bình: ${avgParticipationRecent.toFixed(1)}/5`,
        ],
        occurrenceCount: observedWeekNumbers.length,
        missingData: ['Cần kết hợp với thông tin tự đánh giá của học sinh'],
        potentialContextFactors: [
          'Khối lượng bài tập tích lũy từ nhiều môn',
          'Khó khăn trong khâu bắt đầu các nhiệm vụ độc lập',
        ],
        recommendedObservations: [
          'Quan sát thời gian học sinh bắt đầu làm bài khi được giao nhiệm vụ cá nhân.',
          'Trao đổi ngắn giờ ra chơi để nắm rõ bối cảnh cụ thể.',
        ],
        transparencyRationale: `Hệ thống so sánh chỉ số của học sinh với baseline (${baseline.recordedPeriod}) qua chuỗi thời gian liên tục, không dùng một lần ngẫu nhiên để đánh giá.`,
      },
    },
    reason: `Phát hiện tín hiệu ${detectedType} ở Mức ${level}.`,
    dataSufficiency: 'ĐẦY_ĐỦ',
  };
}
