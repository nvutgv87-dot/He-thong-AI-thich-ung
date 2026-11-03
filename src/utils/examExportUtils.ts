import { ExamPaper, QuestionBankItem, StudentExamResult } from '../types/examTypes';
import { formatScore } from './scoreUtils';

export interface ExportSelectionOptions {
  includeExam: boolean;
  includeAnswers: boolean;
  includeGradingGuide: boolean;
  includeMatrix: boolean;
  includeSpecifications: boolean;
  includeQuestionBank: boolean;
  includeStudentResults: boolean;
  includeCognitiveAnalysis: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportSelectionOptions = {
  includeExam: true,
  includeAnswers: true,
  includeGradingGuide: true,
  includeMatrix: true,
  includeSpecifications: true,
  includeQuestionBank: false,
  includeStudentResults: true,
  includeCognitiveAnalysis: true,
};

export class ExamExportService {
  /**
   * Xuất file Word (.doc) tương thích Microsoft Word, Google Docs, WPS Office
   */
  exportToWord(
    exam: ExamPaper,
    options: ExportSelectionOptions,
    studentResults: StudentExamResult[] = [],
    questionBank: QuestionBankItem[] = []
  ): void {
    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${exam.title}</title>
<style>
  @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.45; color: #111; }
  h1 { font-size: 16pt; text-align: center; text-transform: uppercase; margin: 10px 0; }
  h2 { font-size: 14pt; color: #1e3a8a; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4px; margin-top: 24px; text-transform: uppercase; }
  h3 { font-size: 13pt; color: #047857; margin-top: 16px; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  .header-table td { border: none; padding: 4px; text-align: center; vertical-align: top; font-size: 12pt; }
  .table-data { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11pt; }
  .table-data th, .table-data td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
  .table-data th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
  .badge-know { background-color: #eff6ff; color: #1d4ed8; padding: 2px 6px; font-weight: bold; border-radius: 4px; font-size: 10pt; }
  .badge-understand { background-color: #ecfdf5; color: #047857; padding: 2px 6px; font-weight: bold; border-radius: 4px; font-size: 10pt; }
  .badge-apply { background-color: #faf5ff; color: #7e22ce; padding: 2px 6px; font-weight: bold; border-radius: 4px; font-size: 10pt; }
  .question-item { margin-bottom: 14px; page-break-inside: avoid; }
  .options-grid { margin-left: 20px; margin-top: 4px; }
  .answer-callout { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 6px 12px; margin-top: 6px; font-size: 11.5pt; }
  .rubric-callout { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 6px 12px; margin-top: 6px; font-size: 11pt; }
  .footer-sig { width: 100%; margin-top: 30px; text-align: center; }
</style>
</head>
<body>
  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 45%;">
        <strong>SỞ GD&ĐT · TRƯỜNG THPT</strong><br>
        <strong>TỔ CHUYÊN MÔN HÓA HỌC</strong>
      </td>
      <td style="width: 55%;">
        <strong>BỘ HỒ SƠ KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025 - 2026</strong><br>
        <strong>MÔN: ${exam.subject.toUpperCase()} - KHỐI ${exam.grade}</strong><br>
        <em>Bộ sách: ${exam.curriculum} · Thời gian: ${exam.durationMinutes} phút</em>
      </td>
    </tr>
  </table>

  <h1>${exam.title}</h1>
  <p style="text-align: center; font-style: italic; margin-bottom: 15px;">
    Mã đề: <strong>${exam.code}</strong> | Tổng điểm: <strong>10,0 điểm</strong> | Tỷ lệ nhận thức: 
    <strong>BIẾT: ${exam.ratio.know}% · HIỂU: ${exam.ratio.understand}% · VẬN DỤNG: ${exam.ratio.apply}%</strong>
  </p>
  <hr style="border: 0.5px solid #000; margin-bottom: 20px;">
`;

    // 1. Ma trận đề
    if (options.includeMatrix && exam.matrix && exam.matrix.length > 0) {
      html += `<h2>I. MA TRẬN ĐỀ KIỂM TRA (TỔNG 10,0 ĐIỂM)</h2>
      <table class="table-data">
        <thead>
          <tr>
            <th rowspan="2">TT</th>
            <th rowspan="2">Chủ đề / Bài</th>
            <th colspan="2">BIẾT (${exam.ratio.know}%)</th>
            <th colspan="2">HIỂU (${exam.ratio.understand}%)</th>
            <th colspan="2">VẬN DỤNG (${exam.ratio.apply}%)</th>
            <th rowspan="2">Tổng câu</th>
            <th rowspan="2">Tổng điểm</th>
            <th rowspan="2">Tỷ lệ %</th>
          </tr>
          <tr>
            <th>Số câu</th><th>Điểm</th>
            <th>Số câu</th><th>Điểm</th>
            <th>Số câu</th><th>Điểm</th>
          </tr>
        </thead>
        <tbody>
          ${exam.matrix
            .map(
              (m, idx) => `<tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td><strong>${m.topic}</strong> (${m.chapter})</td>
              <td style="text-align: center;">${m.knowCount}</td>
              <td style="text-align: center;">${formatScore(m.knowPoints)}</td>
              <td style="text-align: center;">${m.understandCount}</td>
              <td style="text-align: center;">${formatScore(m.understandPoints)}</td>
              <td style="text-align: center;">${m.applyCount}</td>
              <td style="text-align: center;">${formatScore(m.applyPoints)}</td>
              <td style="text-align: center; font-weight: bold;">${m.knowCount + m.understandCount + m.applyCount}</td>
              <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${formatScore(m.totalPoints)}</td>
              <td style="text-align: center;">${m.percentage}%</td>
            </tr>`
            )
            .join('')}
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="2" style="text-align: center;">TỔNG CỘNG</td>
            <td style="text-align: center;">${exam.matrix.reduce((s, m) => s + m.knowCount, 0)}</td>
            <td style="text-align: center;">${formatScore(exam.matrix.reduce((s, m) => s + m.knowPoints, 0))}</td>
            <td style="text-align: center;">${exam.matrix.reduce((s, m) => s + m.understandCount, 0)}</td>
            <td style="text-align: center;">${formatScore(exam.matrix.reduce((s, m) => s + m.understandPoints, 0))}</td>
            <td style="text-align: center;">${exam.matrix.reduce((s, m) => s + m.applyCount, 0)}</td>
            <td style="text-align: center;">${formatScore(exam.matrix.reduce((s, m) => s + m.applyPoints, 0))}</td>
            <td style="text-align: center;">${exam.questions.length}</td>
            <td style="text-align: center; color: #1e3a8a;">10,0đ</td>
            <td style="text-align: center;">100%</td>
          </tr>
        </tbody>
      </table>`;
    }

    // 2. Bản đặc tả
    if (options.includeSpecifications && exam.specifications && exam.specifications.length > 0) {
      html += `<h2>II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA CHUẨN SGK KẾT NỐI TRI THỨC</h2>
      <table class="table-data">
        <thead>
          <tr>
            <th style="width: 5%;">Câu</th>
            <th style="width: 20%;">Chủ đề / Nội dung</th>
            <th style="width: 45%;">Yêu cầu cần đạt chuẩn CT GDPT 2018</th>
            <th style="width: 10%;">Mức độ</th>
            <th style="width: 10%;">Dạng câu</th>
            <th style="width: 10%;">Điểm</th>
          </tr>
        </thead>
        <tbody>
          ${exam.specifications
            .map(
              (spec) => `<tr>
              <td style="text-align: center; font-weight: bold;">${spec.questionNumber}</td>
              <td>${spec.topic}</td>
              <td>${spec.competencyRequirement}</td>
              <td style="text-align: center;"><span class="badge-${spec.cognitive_level.toLowerCase()}">${spec.cognitive_level === 'KNOW' ? 'BIẾT' : spec.cognitive_level === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}</span></td>
              <td style="text-align: center;">${spec.section === 'MULTIPLE_CHOICE' ? 'Phần I' : spec.section === 'TRUE_FALSE' ? 'Phần II' : spec.section === 'SHORT_ANSWER' ? 'Phần III' : 'Phần IV'}</td>
              <td style="text-align: center; font-weight: bold;">${formatScore(spec.points)}đ</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`;
    }

    // 3. Đề kiểm tra
    if (options.includeExam) {
      html += `<h2>III. NỘI DUNG ĐỀ KIỂM TRA (4 PHẦN CHUẨN)</h2>`;
      
      const p1 = exam.questions.filter((q) => q.section === 'MULTIPLE_CHOICE');
      if (p1.length > 0) {
        html += `<h3>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (5,0 điểm). Thí sinh chọn 1 phương án đúng.</h3>`;
        p1.forEach((q) => {
          html += `<div class="question-item">
            <strong>Câu ${q.questionNumber} (${formatScore(q.points)}đ) [${q.cognitive_level === 'KNOW' ? 'BIẾT' : q.cognitive_level === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}]:</strong> ${q.content}`;
          if (q.options) {
            html += `<div class="options-grid">${q.options.map((opt) => `<div>${opt}</div>`).join('')}</div>`;
          }
          if (options.includeAnswers) {
            html += `<div class="answer-callout"><strong>Đáp án đúng: ${q.correctAnswer}</strong>. ${options.includeGradingGuide && q.explanation ? `<em>Lời giải: ${q.explanation}</em>` : ''}</div>`;
          }
          html += `</div>`;
        });
      }

      const p2 = exam.questions.filter((q) => q.section === 'TRUE_FALSE');
      if (p2.length > 0) {
        html += `<h3>PHẦN II. Câu trắc nghiệm Đúng/Sai (2,0 điểm). Thí sinh trả lời Đúng hoặc Sai cho mỗi ý a, b, c, d.</h3>`;
        p2.forEach((q) => {
          html += `<div class="question-item">
            <strong>Câu ${q.questionNumber} (${formatScore(q.points)}đ) [${q.cognitive_level === 'KNOW' ? 'BIẾT' : q.cognitive_level === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}]:</strong> ${q.content}`;
          if (q.trueFalseItems) {
            html += `<table class="table-data" style="margin-top: 6px;">
              <thead><tr><th style="width: 8%;">Ý</th><th style="width: 72%;">Nội dung phát biểu</th><th style="width: 10%;">Đúng</th><th style="width: 10%;">Sai</th></tr></thead>
              <tbody>
                ${q.trueFalseItems
                  .map(
                    (tf) => `<tr>
                  <td style="text-align: center; font-weight: bold;">${tf.label}</td>
                  <td>${tf.statement}</td>
                  <td style="text-align: center;">${options.includeAnswers && tf.isCorrect ? '✓' : ''}</td>
                  <td style="text-align: center;">${options.includeAnswers && !tf.isCorrect ? '✓' : ''}</td>
                </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`;
          }
          if (options.includeAnswers && options.includeGradingGuide) {
            html += `<div class="answer-callout"><em>Thang điểm Phần II: Đúng 1 ý = 0,10đ; Đúng 2 ý = 0,25đ; Đúng 3 ý = 0,50đ; Đúng 4 ý = 1,00đ. ${q.explanation ? `Giải thích: ${q.explanation}` : ''}</em></div>`;
          }
          html += `</div>`;
        });
      }

      const p3 = exam.questions.filter((q) => q.section === 'SHORT_ANSWER');
      if (p3.length > 0) {
        html += `<h3>PHẦN III. Câu trắc nghiệm trả lời ngắn (1,5 điểm). Thí sinh điền kết quả vào ô trả lời.</h3>`;
        p3.forEach((q) => {
          html += `<div class="question-item">
            <strong>Câu ${q.questionNumber} (${formatScore(q.points)}đ) [${q.cognitive_level === 'KNOW' ? 'BIẾT' : q.cognitive_level === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}]:</strong> ${q.content}`;
          if (options.includeAnswers) {
            html += `<div class="answer-callout"><strong>Đáp số chuẩn: ${q.shortAnswerKey || ''}</strong>. ${options.includeGradingGuide && q.explanation ? `<em>Hướng dẫn giải: ${q.explanation}</em>` : ''}</div>`;
          }
          html += `</div>`;
        });
      }

      const p4 = exam.questions.filter((q) => q.section === 'ESSAY');
      if (p4.length > 0) {
        html += `<h3>PHẦN IV. Tự luận (1,5 điểm). Thí sinh trình bày chi tiết lời giải theo Rubric.</h3>`;
        p4.forEach((q) => {
          html += `<div class="question-item">
            <strong>Câu ${q.questionNumber} (${formatScore(q.points)}đ) [${q.cognitive_level === 'KNOW' ? 'BIẾT' : q.cognitive_level === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}]:</strong><br>
            <div style="margin: 6px 0;">${q.content.replace(/\n/g, '<br>')}</div>`;
          if (options.includeAnswers && options.includeGradingGuide) {
            html += `<div class="rubric-callout">
              <strong>HƯỚNG DẪN CHẤM & RUBRIC ĐÁNH GIÁ CHI TIẾT:</strong><br>
              ${(q.sampleEssayAnswer || '').replace(/\n/g, '<br>')}`;
            if (q.essayRubric && q.essayRubric.length > 0) {
              html += `<table class="table-data" style="margin-top: 6px;">
                <thead><tr><th>Tiêu chí đánh giá</th><th>Nội dung yêu cầu cần đạt</th><th>Điểm</th></tr></thead>
                <tbody>
                  ${q.essayRubric.map((r) => `<tr><td>${r.criteria}</td><td>${r.expectedContent}</td><td style="text-align: center; font-weight: bold;">${r.points}đ</td></tr>`).join('')}
                </tbody>
              </table>`;
            }
            html += `</div>`;
          }
          html += `</div>`;
        });
      }
    }

    // 4. Kết quả học sinh & Phân tích BIẾT - HIỂU - VẬN DỤNG
    if (options.includeStudentResults && studentResults.length > 0) {
      html += `<h2>IV. BẢNG TỔNG HỢP KẾT QUẢ VÀ PHÂN TÍCH THEO 3 MỨC ĐỘ</h2>
      <table class="table-data">
        <thead>
          <tr>
            <th>STT</th>
            <th>Mã HS</th>
            <th>Họ và tên</th>
            <th>Điểm P.I (5đ)</th>
            <th>Điểm P.II (2đ)</th>
            <th>Điểm P.III (1.5đ)</th>
            <th>Điểm P.IV (1.5đ)</th>
            <th>Tổng điểm</th>
            <th>% BIẾT</th>
            <th>% HIỂU</th>
            <th>% VẬN DỤNG</th>
            <th>Mức hỗ trợ</th>
          </tr>
        </thead>
        <tbody>
          ${studentResults
            .map(
              (r, idx) => `<tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td style="text-align: center; font-weight: bold;">${r.studentCode}</td>
              <td>${r.studentName}</td>
              <td style="text-align: center;">${formatScore(r.scorePart1)}</td>
              <td style="text-align: center;">${formatScore(r.scorePart2)}</td>
              <td style="text-align: center;">${formatScore(r.scorePart3)}</td>
              <td style="text-align: center;">${formatScore(r.scorePart4)}</td>
              <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${formatScore(r.totalScore)}</td>
              <td style="text-align: center;">${r.cognitiveScores?.know?.percentage || 0}%</td>
              <td style="text-align: center;">${r.cognitiveScores?.understand?.percentage || 0}%</td>
              <td style="text-align: center;">${r.cognitiveScores?.apply?.percentage || 0}%</td>
              <td style="text-align: center;">${r.aiPedagogicalComment?.supportLevel || 'Khuyến khích'}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`;
    }

    // Footer signatures
    html += `
  <table class="footer-sig">
    <tr>
      <td style="width: 50%; text-align: center;">
        <em>Ngày ...... tháng ...... năm 2026</em><br>
        <strong>GIÁO VIÊN RA ĐỀ</strong><br><br><br><br>
        <strong>${exam.createdBy || 'Thầy Nguyễn Vũ'}</strong>
      </td>
      <td style="width: 50%; text-align: center;">
        <em>Duyệt của Tổ chuyên môn Hóa học</em><br>
        <strong>TỔ TRƯỞNG CHUYÊN MÔN</strong><br><br><br><br>
        <strong>ThS. Nguyễn Hoàng Nam</strong>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HO_SO_KIEM_TRA_${exam.code}_${new Date().toISOString().slice(0, 10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Xuất file Excel (.xlsx / CSV với UTF-8 BOM)
   */
  exportToExcel(
    exam: ExamPaper,
    options: ExportSelectionOptions,
    studentResults: StudentExamResult[] = []
  ): void {
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

    csv += `BỘ HỒ SƠ KIỂM TRA ĐỊNH KỲ MÔN ${exam.subject.toUpperCase()} LỚP ${exam.grade}\n`;
    csv += `Tên đề:;"${exam.title.replace(/"/g, '""')}"\n`;
    csv += `Mã đề:;${exam.code};Thời gian:;${exam.durationMinutes} phút;Tổng điểm:;10.0\n`;
    csv += `Cấu trúc tỷ lệ nhận thức:;BIẾT: ${exam.ratio.know}%;HIỂU: ${exam.ratio.understand}%;VẬN DỤNG: ${exam.ratio.apply}%\n\n`;

    // 1. Ma trận đề
    if (options.includeMatrix && exam.matrix) {
      csv += `--- I. MA TRẬN ĐỀ KIỂM TRA ---\n`;
      csv += `STT;Chủ đề / Bài;Chương;Số câu BIẾT;Điểm BIẾT;Số câu HIỂU;Điểm HIỂU;Số câu VẬN DỤNG;Điểm VẬN DỤNG;Tổng số câu;Tổng điểm;Tỷ lệ %\n`;
      exam.matrix.forEach((m, idx) => {
        csv += `${idx + 1};"${m.topic}";"${m.chapter}";${m.knowCount};${m.knowPoints};${m.understandCount};${m.understandPoints};${m.applyCount};${m.applyPoints};${m.knowCount + m.understandCount + m.applyCount};${m.totalPoints};${m.percentage}%\n`;
      });
      csv += `\n`;
    }

    // 2. Bản đặc tả
    if (options.includeSpecifications && exam.specifications) {
      csv += `--- II. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ---\n`;
      csv += `Câu số;Chủ đề;Nội dung yêu cầu cần đạt;Mức độ nhận thức;Dạng câu;Điểm\n`;
      exam.specifications.forEach((spec) => {
        csv += `${spec.questionNumber};"${spec.topic}";"${spec.competencyRequirement.replace(/"/g, '""')}";${spec.cognitive_level};${spec.section};${spec.points}\n`;
      });
      csv += `\n`;
    }

    // 3. Kết quả học sinh
    if (options.includeStudentResults && studentResults.length > 0) {
      csv += `--- III. KẾT QUẢ ĐIỂM SỐ VÀ PHÂN TÍCH 3 MỨC ĐỘ HỌC SINH ---\n`;
      csv += `STT;Mã HS;Họ và tên;Điểm Phần I;Điểm Phần II;Điểm Phần III;Điểm Phần IV;Tổng điểm;% BIẾT;% HIỂU;% VẬN DỤNG;Số câu đúng;Số câu sai;Thời gian làm (phút);Mức hỗ trợ\n`;
      studentResults.forEach((r, idx) => {
        const durMin = Math.round(r.durationSeconds / 60);
        csv += `${idx + 1};${r.studentCode};"${r.studentName}";${r.scorePart1};${r.scorePart2};${r.scorePart3};${r.scorePart4};${r.totalScore};${r.cognitiveScores?.know?.percentage || 0}%;${r.cognitiveScores?.understand?.percentage || 0}%;${r.cognitiveScores?.apply?.percentage || 0}%;${r.correctCount};${r.incorrectCount};${durMin};"${r.aiPedagogicalComment?.supportLevel || 'Khuyến khích'}"\n`;
      });
      csv += `\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DANH_SACH_VA_MA_TRAN_${exam.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * In trực tiếp hoặc xuất PDF qua hộp thoại Print của trình duyệt
   */
  printOrExportPDF(exam: ExamPaper, options: ExportSelectionOptions): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let content = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>In đề thi: ${exam.title}</title>
<style>
  @media print {
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; color: #000; }
    .no-print { display: none !important; }
  }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 20px; line-height: 1.45; }
  h1 { font-size: 15pt; text-align: center; text-transform: uppercase; margin: 8px 0; }
  .header-box { width: 100%; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
  .table-print { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt; }
  .table-print th, .table-print td { border: 1px solid #000; padding: 5px; }
  .table-print th { background-color: #f3f4f6; }
  .btn-print { background-color: #2563eb; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; margin-bottom: 15px; }
</style>
</head>
<body>
  <div class="no-print" style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
    <div><strong>Chế độ xem trước In / Xuất PDF:</strong> Sử dụng lệnh In của trình duyệt (Ctrl + P) và chọn "Save as PDF" để lưu file PDF chất lượng cao.</div>
    <button class="btn-print" onclick="window.print()">In ngay / Lưu PDF</button>
  </div>

  <table class="header-box">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <strong>SỞ GD&ĐT · TRƯỜNG THPT</strong><br>
        <strong>TỔ CHUYÊN MÔN HÓA HỌC</strong>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <strong>KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025 - 2026</strong><br>
        <strong>MÔN: ${exam.subject.toUpperCase()} - KHỐI ${exam.grade}</strong><br>
        <em>Thời gian làm bài: ${exam.durationMinutes} phút (Không kể thời gian phát đề)</em>
      </td>
    </tr>
  </table>

  <h1>${exam.title}</h1>
  <p style="text-align: center; font-style: italic;">Mã đề: <strong>${exam.code}</strong> (Thang 10,0 điểm - Chuẩn 3 mức độ BIẾT: ${exam.ratio.know}% / HIỂU: ${exam.ratio.understand}% / VẬN DỤNG: ${exam.ratio.apply}%)</p>
  <p><strong>Họ và tên học sinh:</strong> ............................................................................ <strong>Lớp:</strong> ................ <strong>SBD:</strong> ................</p>
  <hr style="border: 0.5px solid #000;">
`;

    exam.questions.forEach((q) => {
      content += `<div style="margin-bottom: 10px; page-break-inside: avoid;">
        <strong>Câu ${q.questionNumber} (${formatScore(q.points)}đ) [${q.cognitive_level}]:</strong> ${q.content}`;
      if (q.options) {
        content += `<div style="margin-left: 20px;">${q.options.map((o) => `<div>${o}</div>`).join('')}</div>`;
      }
      if (q.trueFalseItems) {
        content += `<table class="table-print" style="margin-top: 4px;">
          <tr><th>Ý</th><th>Nội dung</th><th style="width: 15%;">Đúng</th><th style="width: 15%;">Sai</th></tr>
          ${q.trueFalseItems.map((tf) => `<tr><td style="text-align: center; font-weight: bold;">${tf.label}</td><td>${tf.statement}</td><td></td><td></td></tr>`).join('')}
        </table>`;
      }
      if (options.includeAnswers) {
        content += `<div style="background: #f8fafc; padding: 4px 8px; border-left: 3px solid #2563eb; font-size: 10.5pt; margin-top: 4px;">
          <strong>Đáp án:</strong> ${q.correctAnswer || q.shortAnswerKey || q.sampleEssayAnswer || 'Theo hướng dẫn'}
        </div>`;
      }
      content += `</div>`;
    });

    content += `
  <p style="text-align: center; margin-top: 30px; font-weight: bold;">---------- HẾT ----------</p>
</body>
</html>`;

    printWindow.document.write(content);
    printWindow.document.close();
  }
}

export const examExportService = new ExamExportService();
