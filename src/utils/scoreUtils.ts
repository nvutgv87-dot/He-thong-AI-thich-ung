/**
 * Score Formatting and Math Utilities
 * Enforces uniform 10.0 scale, comma/dot parsing, and clean decimal representations.
 */

export function formatScore(score: number, showSign: boolean = false): string {
  if (isNaN(score) || score === null || score === undefined) return '0đ';
  const rounded = Math.round(score * 1000) / 1000;
  
  // Clean decimal representation: e.g. 1.75 instead of 1.750
  const formattedNum = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(3).replace(/\.?0+$/, '');

  if (rounded === 0) return '0đ';
  if (rounded > 0) {
    return showSign ? `+${formattedNum}đ` : `${formattedNum}đ`;
  }
  return `-${Math.abs(rounded).toString().replace(/\.?0+$/, '')}đ`;
}

export function parseScore(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  // Replace Vietnamese comma with dot, strip non-numeric except dot and minus
  const normalized = input.toString().trim().replace(',', '.').replace(/[^0-9.-]/g, '');
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

export interface ExamStructureConfig {
  part1Count: number; // Trắc nghiệm nhiều lựa chọn (5.0đ)
  part2Count: number; // Đúng / Sai (2.0đ, mỗi câu 4 ý)
  part3Count: number; // Trả lời ngắn (1.5đ)
  part4Count: number; // Tự luận (số ý/câu, 1.5đ)
}

export interface PresetStructure {
  id: string;
  name: string;
  description: string;
  config: ExamStructureConfig;
}

export const EXAM_PRESETS: PresetStructure[] = [
  {
    id: 'preset_standard',
    name: 'Mẫu Chuẩn 28 câu (Bộ GD&ĐT)',
    description: '20 câu TN (0,25đ) + 2 câu Đ/S (2,0đ) + 6 câu Ngắn (0,25đ) + 3 ý Tự luận (0,5đ) = 10,0đ',
    config: {
      part1Count: 20,
      part2Count: 2,
      part3Count: 6,
      part4Count: 3,
    },
  },
  {
    id: 'preset_15',
    name: 'Mẫu Đề 15 TN',
    description: '15 câu TN (0,333đ) + 2 câu Đ/S (2,0đ) + 3 câu Ngắn (0,5đ) + 3 ý Tự luận (0,5đ) = 10,0đ',
    config: {
      part1Count: 15,
      part2Count: 2,
      part3Count: 3,
      part4Count: 3,
    },
  },
  {
    id: 'preset_10',
    name: 'Mẫu Đề 10 TN (Kiểm tra định kỳ nhanh)',
    description: '10 câu TN (0,5đ) + 2 câu Đ/S (2,0đ) + 3 câu Ngắn (0,5đ) + 3 ý Tự luận (0,5đ) = 10,0đ',
    config: {
      part1Count: 10,
      part2Count: 2,
      part3Count: 3,
      part4Count: 3,
    },
  },
  {
    id: 'preset_25',
    name: 'Mẫu Đề 25 TN',
    description: '25 câu TN (0,2đ) + 2 câu Đ/S (2,0đ) + 5 câu Ngắn (0,3đ) + 2 ý Tự luận (0,75đ) = 10,0đ',
    config: {
      part1Count: 25,
      part2Count: 2,
      part3Count: 5,
      part4Count: 2,
    },
  },
];

export const QUICK_STRUCTURE_PRESETS = EXAM_PRESETS;

export function calculateStructurePoints(config: ExamStructureConfig) {
  const part1PerItem = config.part1Count > 0 ? 5.0 / config.part1Count : 0;
  const part2PerItem = config.part2Count > 0 ? 2.0 / config.part2Count : 0;
  const part3PerItem = config.part3Count > 0 ? 1.5 / config.part3Count : 0;
  const part4PerItem = config.part4Count > 0 ? 1.5 / config.part4Count : 0;

  return {
    part1PerItem,
    part2PerItem,
    part3PerItem,
    part4PerItem,
    totalPoints: 10.0,
    formulas: {
      part1: `Điểm/câu = 5,0 / ${config.part1Count} = ${formatScore(part1PerItem)}`,
      part2: `${config.part2Count} câu, mỗi câu tối đa 1,0đ: đúng 1 ý = 0,10đ; 2 ý = 0,25đ; 3 ý = 0,50đ; 4 ý = 1,00đ (Tổng: 2,0đ)`,
      part3: `Điểm/câu = 1,5 / ${config.part3Count} = ${formatScore(part3PerItem)}`,
      part4: `Điểm/ý = 1,5 / ${config.part4Count} = ${formatScore(part4PerItem)} (Chấm theo Rubric SGK Kết nối tri thức)`,
    },
  };
}

/**
 * Tính điểm Đúng/Sai cho 1 câu 4 ý:
 * - Đúng 1 ý = 0.10đ
 * - Đúng 2 ý = 0.25đ
 * - Đúng 3 ý = 0.50đ
 * - Đúng 4 ý = 1.00đ
 */
export function calculateTrueFalseScore(correctCount: number): number {
  switch (correctCount) {
    case 1:
      return 0.1;
    case 2:
      return 0.25;
    case 3:
      return 0.5;
    case 4:
      return 1.0;
    default:
      return 0.0;
  }
}
