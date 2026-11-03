/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';

export interface CurriculumParseResult {
  success: boolean;
  fileName: string;
  fileSizeFormatted: string;
  fileType: 'IMAGE' | 'WORD' | 'PDF';
  previewImageUrl?: string;
  extractedText: string;
  learningObjectives: string;
  detectedMeta?: {
    subject?: string;
    grade?: number;
    chapter?: string;
    topic?: string;
    knowledgeContent?: string;
    examTitle?: string;
  };
  isAIExtracted: boolean;
  error?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clean and structure raw text into standard YCCD (Yêu cầu cần đạt) bullet points
 */
export function formatRawTextToObjectives(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cleanObjectives: string[] = [];

  for (const line of lines) {
    // Skip obvious table headers or metadata lines
    if (/^(trang\s+\d+|bộ\s+giáo\s+dục|kết\s+nối\s+tri\s+thức|sách\s+giáo\s+khoa)/i.test(line)) {
      continue;
    }

    // Clean leading bullet markers
    const cleanLine = line.replace(/^[-*•+–—\d+.)\s]+/, '').trim();
    if (cleanLine.length >= 8) {
      cleanObjectives.push(`• ${cleanLine}`);
    }
  }

  if (cleanObjectives.length === 0) {
    return rawText.slice(0, 1000);
  }

  return cleanObjectives.slice(0, 20).join('\n');
}

/**
 * Parse Image (PNG, JPG, JPEG, WEBP)
 */
export async function parseCurriculumImage(
  file: File,
  currentSubject: string = 'Hóa học',
  currentGrade: number = 11
): Promise<CurriculumParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;

      try {
        // Try server-side Gemini Vision OCR
        const response = await fetch('/api/ai/extract-curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileType: 'IMAGE',
            base64Data: dataUrl,
            mimeType: file.type || 'image/jpeg',
            subject: currentSubject,
            grade: currentGrade,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.extracted && resData.extracted.learningObjectives) {
            resolve({
              success: true,
              fileName: file.name,
              fileSizeFormatted: formatFileSize(file.size),
              fileType: 'IMAGE',
              previewImageUrl: dataUrl,
              extractedText: resData.extracted.learningObjectives,
              learningObjectives: resData.extracted.learningObjectives,
              detectedMeta: {
                subject: resData.extracted.subject,
                grade: resData.extracted.grade,
                chapter: resData.extracted.chapter,
                topic: resData.extracted.topic,
                knowledgeContent: resData.extracted.knowledgeContent,
                examTitle: resData.extracted.examTitle,
              },
              isAIExtracted: !resData.fallback,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('AI OCR failed, using image preview fallback:', err);
      }

      // Fallback when offline or no API key
      const fallbackYCCD = [
        `• Nhận biết các khái niệm, quy tắc và nội dung trọng tâm môn ${currentSubject} ${currentGrade} từ ảnh chụp "${file.name}".`,
        `• Trình bày và giải thích được cấu trúc, hiện tượng và định luật theo chuẩn SGK Kết nối tri thức.`,
        `• Vận dụng các kiến thức và công thức trong tài liệu vào giải bài tập và tình huống thực tiễn.`,
      ].join('\n');

      resolve({
        success: true,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: 'IMAGE',
        previewImageUrl: dataUrl,
        extractedText: `[Ảnh chụp: ${file.name}]`,
        learningObjectives: fallbackYCCD,
        isAIExtracted: false,
      });
    };

    reader.onerror = () => {
      resolve({
        success: false,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: 'IMAGE',
        extractedText: '',
        learningObjectives: '',
        isAIExtracted: false,
        error: 'Không thể đọc tệp hình ảnh. Vui lòng thử lại tệp khác.',
      });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Parse Word (.doc, .docx)
 */
export async function parseCurriculumWord(
  file: File,
  currentSubject: string = 'Hóa học',
  currentGrade: number = 11
): Promise<CurriculumParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = rawResult.value || '';

    if (!rawText.trim()) {
      return {
        success: false,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: 'WORD',
        extractedText: '',
        learningObjectives: '',
        isAIExtracted: false,
        error: 'Tệp Word không có nội dung văn bản hoặc bị mã hóa.',
      };
    }

    // Attempt AI structuring if server is online
    try {
      const response = await fetch('/api/ai/extract-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'WORD',
          rawText: rawText.slice(0, 10000),
          subject: currentSubject,
          grade: currentGrade,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.extracted && resData.extracted.learningObjectives) {
          return {
            success: true,
            fileName: file.name,
            fileSizeFormatted: formatFileSize(file.size),
            fileType: 'WORD',
            extractedText: rawText,
            learningObjectives: resData.extracted.learningObjectives,
            detectedMeta: {
              subject: resData.extracted.subject,
              grade: resData.extracted.grade,
              chapter: resData.extracted.chapter,
              topic: resData.extracted.topic,
              knowledgeContent: resData.extracted.knowledgeContent,
              examTitle: resData.extracted.examTitle,
            },
            isAIExtracted: !resData.fallback,
          };
        }
      }
    } catch {
      // Fallback
    }

    const structuredObjectives = formatRawTextToObjectives(rawText);

    return {
      success: true,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: 'WORD',
      extractedText: rawText,
      learningObjectives: structuredObjectives,
      isAIExtracted: false,
    };
  } catch (err: any) {
    return {
      success: false,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: 'WORD',
      extractedText: '',
      learningObjectives: '',
      isAIExtracted: false,
      error: `Lỗi đọc tệp Word: ${err?.message || 'Không thể giải mã tệp docx.'}`,
    };
  }
}

/**
 * Parse PDF (.pdf)
 */
export async function parseCurriculumPdf(
  file: File,
  currentSubject: string = 'Hóa học',
  currentGrade: number = 11
): Promise<CurriculumParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';

    try {
      const pdfjs = await import('pdfjs-dist');
      if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.0.379'}/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;

      for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 15); pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        extractedText += pageText + '\n';
      }
    } catch (pdfErr) {
      console.warn('PDF.js dynamic import fallback, trying text decoder:', pdfErr);
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      const matches = text.match(/\(([^()]+)\)Tj/g) || text.match(/\[([^\]]+)\]TJ/g);
      if (matches) {
        extractedText = matches
          .map((m) => m.replace(/^[(\[]|[)\]]T[jJ]$/g, ''))
          .join(' ');
      }
    }

    if (!extractedText.trim()) {
      return {
        success: false,
        fileName: file.name,
        fileSizeFormatted: formatFileSize(file.size),
        fileType: 'PDF',
        extractedText: '',
        learningObjectives: '',
        isAIExtracted: false,
        error: 'Tệp PDF dạng ảnh quét (scanned) không có text layer hoặc bị khóa bản quyền.',
      };
    }

    // Attempt AI structuring
    try {
      const response = await fetch('/api/ai/extract-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: 'PDF',
          rawText: extractedText.slice(0, 10000),
          subject: currentSubject,
          grade: currentGrade,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.extracted && resData.extracted.learningObjectives) {
          return {
            success: true,
            fileName: file.name,
            fileSizeFormatted: formatFileSize(file.size),
            fileType: 'PDF',
            extractedText,
            learningObjectives: resData.extracted.learningObjectives,
            detectedMeta: {
              subject: resData.extracted.subject,
              grade: resData.extracted.grade,
              chapter: resData.extracted.chapter,
              topic: resData.extracted.topic,
              knowledgeContent: resData.extracted.knowledgeContent,
              examTitle: resData.extracted.examTitle,
            },
            isAIExtracted: !resData.fallback,
          };
        }
      }
    } catch {
      // Fallback
    }

    const structuredObjectives = formatRawTextToObjectives(extractedText);

    return {
      success: true,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: 'PDF',
      extractedText,
      learningObjectives: structuredObjectives,
      isAIExtracted: false,
    };
  } catch (err: any) {
    return {
      success: false,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: 'PDF',
      extractedText: '',
      learningObjectives: '',
      isAIExtracted: false,
      error: `Lỗi đọc tệp PDF: ${err?.message || 'Tệp PDF hỏng hoặc không đúng chuẩn.'}`,
    };
  }
}

/**
 * Universal dispatcher for Image, Word, PDF
 */
export async function parseCurriculumFile(
  file: File,
  currentSubject: string = 'Hóa học',
  currentGrade: number = 11
): Promise<CurriculumParseResult> {
  const name = file.name.toLowerCase();

  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(name)) {
    return parseCurriculumImage(file, currentSubject, currentGrade);
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    /\.(docx|doc)$/i.test(name)
  ) {
    return parseCurriculumWord(file, currentSubject, currentGrade);
  }

  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return parseCurriculumPdf(file, currentSubject, currentGrade);
  }

  return {
    success: false,
    fileName: file.name,
    fileSizeFormatted: formatFileSize(file.size),
    fileType: 'WORD',
    extractedText: '',
    learningObjectives: '',
    isAIExtracted: false,
    error: 'Định dạng tệp không được hỗ trợ. Vui lòng tải lên Hình ảnh (PNG, JPG, WEBP), Word (.doc, .docx) hoặc PDF (.pdf).',
  };
}
