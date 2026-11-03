/**
 * Student File Parser Utility
 * Supports importing student lists and profiles from:
 * - Microsoft Excel (.xlsx, .xls, .csv)
 * - Microsoft Word (.docx, .doc)
 * - PDF documents (.pdf)
 */

import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Student } from '../types';

export interface ParsedStudentRow {
  code: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  onTimeRate: number;
  avgScore: number;
  notes?: string;
}

export interface FileParseResult {
  success: boolean;
  fileType: 'EXCEL' | 'WORD' | 'PDF' | 'UNKNOWN';
  fileName: string;
  students: ParsedStudentRow[];
  rawTextPreview?: string;
  error?: string;
}

// Clean and normalize text
function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

// Check if string looks like a Vietnamese or general student name
function isValidStudentName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 50) return false;
  // Ignore header words
  const lower = name.toLowerCase();
  if (
    lower.includes('họ và tên') ||
    lower.includes('mã học sinh') ||
    lower.includes('danh sách') ||
    lower.includes('bảng điểm') ||
    lower.includes('thống kê') ||
    lower.includes('stt') ||
    lower.includes('giới tính')
  ) {
    return false;
  }
  return true;
}

// Extract students from parsed lines of text (common to Word & PDF)
export function extractStudentsFromTextLines(lines: string[]): ParsedStudentRow[] {
  const students: ParsedStudentRow[] = [];
  let indexCounter = 1;

  for (const rawLine of lines) {
    const line = cleanText(rawLine);
    if (!line || line.length < 3) continue;

    // Check if line contains student format
    // Examples:
    // "1. Nguyễn Văn A - HS01 - Nam - 85% - 8.5"
    // "HS01 | Nguyễn Văn A | Nam | 90% | 8.0"
    // "Nguyễn Văn A, Nam, 8.5, 90%"
    // Or tab / comma / dash / pipe delimited
    const delimiters = ['\t', '|', ';', ',', ' - ', ' – '];
    let matchedParts: string[] | null = null;

    for (const d of delimiters) {
      if (line.includes(d)) {
        const parts = line.split(d).map((p) => cleanText(p)).filter(Boolean);
        if (parts.length >= 2) {
          matchedParts = parts;
          break;
        }
      }
    }

    if (matchedParts && matchedParts.length >= 2) {
      let code = '';
      let fullName = '';
      let gender: 'Nam' | 'Nữ' = 'Nam';
      let onTimeRate = 85;
      let avgScore = 7.5;
      let notes = '';

      // Check each part
      for (const part of matchedParts) {
        // Strip leading numbering like "1. ", "01. "
        const cleanedPart = part.replace(/^\d+[\.\)\-\:\s]+/, '').trim();

        // Check if code e.g. HS01, STU_01
        if (/^(HS\d+|STU[_\-]?\d+|[A-Z]{2,4}\d{2,4})$/i.test(cleanedPart)) {
          code = cleanedPart.toUpperCase();
        } else if (/^(nam|nữ|nu|male|female)$/i.test(cleanedPart)) {
          gender = /^(nữ|nu|female)$/i.test(cleanedPart) ? 'Nữ' : 'Nam';
        } else if (/^\d+(\.\d+)?%$/.test(cleanedPart)) {
          const num = parseFloat(cleanedPart);
          if (!isNaN(num)) onTimeRate = Math.min(100, Math.max(0, num));
        } else if (/^\d+(\.\d+)?$/.test(cleanedPart)) {
          const num = parseFloat(cleanedPart);
          if (!isNaN(num)) {
            if (num <= 10) {
              avgScore = num;
            } else if (num <= 100) {
              onTimeRate = num;
            }
          }
        } else if (isValidStudentName(cleanedPart) && !fullName) {
          fullName = cleanedPart;
        } else if (cleanedPart.length > 5) {
          notes = cleanedPart;
        }
      }

      if (fullName) {
        students.push({
          code: code || `HS${String(indexCounter).padStart(2, '0')}`,
          fullName,
          gender,
          onTimeRate,
          avgScore,
          notes: notes || 'Nhập từ tệp tài liệu',
        });
        indexCounter++;
        continue;
      }
    }

    // Fallback: If line has format: "1. Nguyễn Khánh Linh (HS01)"
    const singleLineMatch = line.match(/^\d+[\.\)\s]+([A-ZÀ-Ỹa-zà-ỹ\s]+)(?:\s*[\(\[]([A-Z0-9_]+)[\)\]])?/);
    if (singleLineMatch && isValidStudentName(singleLineMatch[1])) {
      const name = cleanText(singleLineMatch[1]);
      const foundCode = singleLineMatch[2];
      students.push({
        code: foundCode || `HS${String(indexCounter).padStart(2, '0')}`,
        fullName: name,
        gender: name.toLowerCase().includes('thị') || name.toLowerCase().includes('linh') || name.toLowerCase().includes('ngọc') ? 'Nữ' : 'Nam',
        onTimeRate: 85,
        avgScore: 7.5,
        notes: 'Nhập từ tệp văn bản',
      });
      indexCounter++;
    }
  }

  return students;
}

// Parse Excel (.xlsx, .xls, .csv)
export async function parseExcelStudentFile(file: File): Promise<FileParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        fileType: 'EXCEL',
        fileName: file.name,
        students: [],
        error: 'Tệp Excel không có dòng dữ liệu hợp lệ nào.',
      };
    }

    const students: ParsedStudentRow[] = [];
    let idx = 1;

    for (const row of rawRows) {
      // Find full name
      const nameKey = Object.keys(row).find((k) =>
        /^(họ\s*và\s*tên|họ\s*tên|tên\s*học\s*sinh|hovaten|fullname|name|học\s*sinh)$/i.test(k.trim().toLowerCase())
      );
      const fullName = nameKey ? String(row[nameKey]).trim() : '';

      if (!fullName || !isValidStudentName(fullName)) continue;

      // Find code
      const codeKey = Object.keys(row).find((k) =>
        /^(mã\s*học\s*sinh|mã\s*hs|mahocsinh|code|id|stt)$/i.test(k.trim().toLowerCase())
      );
      const rawCode = codeKey ? String(row[codeKey]).trim() : '';
      const code = rawCode && !/^\d+$/.test(rawCode) ? rawCode.toUpperCase() : `HS${String(idx).padStart(2, '0')}`;

      // Find gender
      const genderKey = Object.keys(row).find((k) =>
        /^(giới\s*tính|gioitinh|gender|phái)$/i.test(k.trim().toLowerCase())
      );
      const rawGender = genderKey ? String(row[genderKey]).trim().toLowerCase() : '';
      const gender: 'Nam' | 'Nữ' = /^(nữ|nu|female|f)$/i.test(rawGender) ? 'Nữ' : 'Nam';

      // Find on-time rate
      const onTimeKey = Object.keys(row).find((k) =>
        /^(đúng\s*hạn|tỷ\s*lệ\s*đúng\s*hạn|ontime|ontimerate|baseline_dung_han)$/i.test(k.trim().toLowerCase())
      );
      const onTimeRate = onTimeKey ? Math.min(100, Math.max(0, Number(row[onTimeKey]) || 85)) : 85;

      // Find average score
      const scoreKey = Object.keys(row).find((k) =>
        /^(điểm\s*tb|điểm\s*trung\s*bình|diemtrungbinh|avgscore|điểm|gpa)$/i.test(k.trim().toLowerCase())
      );
      const avgScore = scoreKey ? Math.min(10, Math.max(0, Number(row[scoreKey]) || 7.5)) : 7.5;

      // Find notes
      const notesKey = Object.keys(row).find((k) =>
        /^(ghi\s*chú|ghichu|notes|nhận\s*xét)$/i.test(k.trim().toLowerCase())
      );
      const notes = notesKey ? String(row[notesKey]).trim() : 'Nhập từ bảng tính Excel';

      students.push({
        code,
        fullName,
        gender,
        onTimeRate,
        avgScore,
        notes,
      });
      idx++;
    }

    return {
      success: students.length > 0,
      fileType: 'EXCEL',
      fileName: file.name,
      students,
      error: students.length === 0 ? 'Không tìm thấy cột Họ và tên học sinh trong bảng tính.' : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      fileType: 'EXCEL',
      fileName: file.name,
      students: [],
      error: `Lỗi đọc tệp Excel: ${err?.message || 'Định dạng tệp không hợp lệ.'}`,
    };
  }
}

// Parse Word (.docx)
export async function parseWordStudentFile(file: File): Promise<FileParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // 1. Try HTML conversion to extract structured tables
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = htmlResult.value;

    const students: ParsedStudentRow[] = [];

    // Parse HTML tables if present
    if (html.includes('<table')) {
      const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      let idx = 1;

      for (const tr of rowMatches) {
        const cellMatches = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (cellMatches.length >= 2) {
          const cells = cellMatches.map((td) =>
            cleanText(td.replace(/<[^>]+>/g, ''))
          );

          // Check if any cell looks like a student name
          let foundName = '';
          let foundCode = '';
          let gender: 'Nam' | 'Nữ' = 'Nam';
          let onTime = 85;
          let score = 7.5;
          let notes = '';

          for (const cell of cells) {
            if (/^(HS\d+|STU\d+|[A-Z]{2,4}\d{2,4})$/i.test(cell)) {
              foundCode = cell.toUpperCase();
            } else if (/^(nam|nữ|nu)$/i.test(cell)) {
              gender = /^(nữ|nu)$/i.test(cell) ? 'Nữ' : 'Nam';
            } else if (/^\d+(\.\d+)?%$/.test(cell)) {
              onTime = parseFloat(cell) || 85;
            } else if (/^\d+(\.\d+)?$/.test(cell)) {
              const num = parseFloat(cell);
              if (num <= 10 && num >= 0) score = num;
              else if (num > 10 && num <= 100) onTime = num;
            } else if (isValidStudentName(cell) && !foundName) {
              foundName = cell;
            } else if (cell.length > 5) {
              notes = cell;
            }
          }

          if (foundName) {
            students.push({
              code: foundCode || `HS${String(idx).padStart(2, '0')}`,
              fullName: foundName,
              gender,
              onTimeRate: onTime,
              avgScore: score,
              notes: notes || 'Nhập từ bảng trong tệp Word (.docx)',
            });
            idx++;
          }
        }
      }
    }

    // 2. If no table students found, parse raw text lines
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = rawResult.value;

    if (students.length === 0 && rawText) {
      const lines = rawText.split('\n');
      const textStudents = extractStudentsFromTextLines(lines);
      students.push(...textStudents);
    }

    return {
      success: students.length > 0,
      fileType: 'WORD',
      fileName: file.name,
      students,
      rawTextPreview: rawText.slice(0, 300),
      error:
        students.length === 0
          ? 'Không tìm thấy danh sách học sinh hợp lệ trong tệp Word. Vui lòng đảm bảo tệp chứa danh sách có Họ tên và Mã học sinh (dạng bảng hoặc từng dòng).'
          : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      fileType: 'WORD',
      fileName: file.name,
      students: [],
      error: `Lỗi đọc tệp Word: ${err?.message || 'Định dạng .docx không đúng quy chuẩn.'}`,
    };
  }
}

// Parse PDF (.pdf)
export async function parsePdfStudentFile(file: File): Promise<FileParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    let extractedText = '';

    // Dynamic import of pdfjs-dist
    try {
      const pdfjs = await import('pdfjs-dist');
      // Set worker if available in browser
      if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.0.379'}/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        extractedText += pageText + '\n';
      }
    } catch (pdfErr) {
      // Fallback binary text stream decoding for simple text PDFs
      const decoder = new TextDecoder('utf-8');
      const rawDecoded = decoder.decode(new Uint8Array(arrayBuffer));
      // Extract text in parentheses /BT ... ET blocks in PDF
      const matches = rawDecoded.match(/\((.*?)\)\s*Tj/g) || [];
      if (matches.length > 0) {
        extractedText = matches.map((m) => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
      } else {
        extractedText = rawDecoded.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
      }
    }

    if (!extractedText.trim()) {
      return {
        success: false,
        fileType: 'PDF',
        fileName: file.name,
        students: [],
        error: 'Không trích xuất được văn bản từ tệp PDF (có thể là tệp PDF dạng ảnh scan).',
      };
    }

    // Split extracted text into lines or delimiters
    const lines = extractedText
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Also handle case where text is joined by spaces
    const flatLines = lines.length > 1 ? lines : extractedText.split(/(?=\d+[\.\)\s]+[A-ZÀ-Ỹ])/);

    const students = extractStudentsFromTextLines(flatLines);

    return {
      success: students.length > 0,
      fileType: 'PDF',
      fileName: file.name,
      students,
      rawTextPreview: extractedText.slice(0, 300),
      error:
        students.length === 0
          ? 'Không nhận diện được học sinh từ tệp PDF. Vui lòng kiểm tra định dạng danh sách (VD: 1. Nguyễn Văn A - HS01 - Nam).'
          : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      fileType: 'PDF',
      fileName: file.name,
      students: [],
      error: `Lỗi đọc tệp PDF: ${err?.message || 'Không thể xử lý tệp PDF này.'}`,
    };
  }
}

// Universal parser for any student file (Excel, Word, PDF)
export async function parseStudentFile(file: File): Promise<FileParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return parseExcelStudentFile(file);
  } else if (ext === 'docx' || ext === 'doc') {
    return parseWordStudentFile(file);
  } else if (ext === 'pdf') {
    return parsePdfStudentFile(file);
  } else {
    // Attempt Excel first, then Word
    try {
      const res = await parseExcelStudentFile(file);
      if (res.success) return res;
    } catch {}
    return {
      success: false,
      fileType: 'UNKNOWN',
      fileName: file.name,
      students: [],
      error: `Định dạng tệp .${ext} không được hỗ trợ. Vui lòng tải lên tệp Word (.docx), PDF (.pdf), hoặc Excel (.xlsx, .csv).`,
    };
  }
}

// Convert parsed student row to full Student object
export function buildStudentFromParsedRow(row: ParsedStudentRow, existingCount: number): Student {
  const birthYear = 2009;
  return {
    id: `STU_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: row.code || `HS${String(existingCount + 1).padStart(2, '0')}`,
    fullName: row.fullName,
    birthDate: `15/05/${birthYear}`,
    classId: 'LOP_11A1',
    gender: row.gender,
    currentStatus: 'ON_DINH',
    warningLevel: 0,
    activeSignalsCount: 0,
    activeInterventionsCount: 0,
    baseline: {
      avgScore: row.avgScore,
      onTimeRate: row.onTimeRate,
      participationScore: 4.0,
      avgDelayHours: 1.0,
      focusMinutesAvg: 35,
      recordedPeriod: 'Tuần 1 - 4',
    },
    profile: {
      personalGoals: ['Hoàn thành tốt chương trình Hóa học 11'],
      strengths: ['Tập trung khi có hướng dẫn chi tiết'],
      currentDifficulties: [],
      taskCompletionHabits: 'Nộp bài đúng hạn',
      participationStyle: 'Tương tác bình thường trong giờ học Hóa',
      triedStrategies: [],
      effectiveStrategies: ['Chia nhỏ bài tập thành từng chặng 15 phút'],
      ineffectiveStrategies: [],
      lastUpdated: new Date().toLocaleDateString('vi-VN'),
    },
    lastDataUpdate: new Date().toLocaleDateString('vi-VN'),
    notes: row.notes || 'Học sinh nhập từ tệp danh sách lớp 11A1',
  };
}

// Download Sample Excel (.xlsx) Template for Student List
export function downloadSampleExcelStudentTemplate() {
  const sampleStudents = [
    {
      'STT': 1,
      'Mã học sinh': 'HS09',
      'Họ và tên': 'Nguyễn Hoàng Long',
      'Giới tính': 'Nam',
      'Tỷ lệ đúng hạn (%)': 88,
      'Điểm TB': 8.2,
      'Ghi chú': 'Học sinh chuyển đến tuần 3, học lực khá môn Hóa',
    },
    {
      'STT': 2,
      'Mã học sinh': 'HS10',
      'Họ và tên': 'Phạm Thùy Chi',
      'Giới tính': 'Nữ',
      'Tỷ lệ đúng hạn (%)': 92,
      'Điểm TB': 8.7,
      'Ghi chú': 'Yêu thích làm thí nghiệm Hóa học',
    },
    {
      'STT': 3,
      'Mã học sinh': 'HS11',
      'Họ và tên': 'Trần Đăng Khoa',
      'Giới tính': 'Nam',
      'Tỷ lệ đúng hạn (%)': 75,
      'Điểm TB': 7.0,
      'Ghi chú': 'Cần nhắc nhở hạn nộp báo cáo thực hành',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleStudents);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lop_11A1');
  XLSX.writeFile(wb, 'mau_danh_sach_hoc_sinh_11A1.xlsx');
}

// Download Sample Word (.doc HTML structured) Template
export function downloadSampleWordStudentTemplate() {
  const docContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Danh Sách Học Sinh Lớp 11A1</title>
<style>
body { font-family: 'Times New Roman', serif; margin: 30px; }
h2 { text-align: center; color: #1e3a8a; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
th { background-color: #f1f5f9; }
</style>
</head>
<body>
<h2>DANH SÁCH HỌC SINH LỚP 11A1 (MÔN HÓA HỌC)</h2>
<p><em>Mẫu văn bản Word (.doc / .docx) nhập học sinh vào hệ thống quản lý thích ứng</em></p>
<table>
<thead>
<tr>
<th>STT</th>
<th>Mã HS</th>
<th>Họ và Tên</th>
<th>Giới Tính</th>
<th>Đúng Hạn (%)</th>
<th>Điểm TB</th>
<th>Ghi Chú</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>HS09</td>
<td>Nguyễn Hoàng Long</td>
<td>Nam</td>
<td>88%</td>
<td>8.2</td>
<td>Học sinh chuyển đến, học lực tốt</td>
</tr>
<tr>
<td>2</td>
<td>HS10</td>
<td>Phạm Thùy Chi</td>
<td>Nữ</td>
<td>92%</td>
<td>8.7</td>
<td>Tích cực tham gia thảo luận thí nghiệm</td>
</tr>
<tr>
<td>3</td>
<td>HS11</td>
<td>Trần Đăng Khoa</td>
<td>Nam</td>
<td>75%</td>
<td>7.0</td>
<td>Cần nhắc hạn nộp bài tập Hóa học</td>
</tr>
</tbody>
</table>
</body>
</html>`;

  const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mau_danh_sach_hoc_sinh_11A1.doc';
  link.click();
  URL.revokeObjectURL(url);
}

// Download Sample PDF / Text format guide
export function downloadSamplePdfGuide() {
  const textContent = `BỘ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT CHUYÊN
DANH SÁCH HỌC SINH MẪU (HỖ TRỢ NHẬP TỆP PDF / WORD / EXCEL)
LỚP: 11A1 - GIÁO VIÊN CHỦ NHIỆM & GIẢNG DẠY HÓA HỌC - NĂM HỌC 2026-2027
--------------------------------------------------------------
Quy tắc định dạng để hệ thống nhận diện tự động từ tệp:
1. Nguyễn Hoàng Long - HS09 - Nam - 88% - 8.2 - Học sinh mới môn Hóa
2. Phạm Thùy Chi - HS10 - Nữ - 92% - 8.7 - Tích cực phát biểu thí nghiệm
3. Trần Đăng Khoa - HS11 - Nam - 75% - 7.0 - Cần theo dõi nộp bài
4. Lê Bảo Ngọc - HS12 - Nữ - 85% - 7.8 - Tập trung tốt giờ Hóa

Ghi chú:
- Cột hoặc dòng chứa tên học sinh (Tiếng Việt có dấu).
- Mã học sinh dạng HSxx (HS01, HS02...).
- Tỷ lệ đúng hạn (%) và Điểm TB (0-10) sẽ được nạp tự động vào Baseline cá nhân.`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mau_huong_dan_danh_sach_11A1.txt';
  link.click();
  URL.revokeObjectURL(url);
}
