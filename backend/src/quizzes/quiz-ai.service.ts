import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/quiz.dto';

// Dynamic require for pdf-parse v2
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseModule = require('pdf-parse');

export interface ParsedQuizImportResult {
  questions: CreateQuestionDto[];
  totalParsed: number;
  warnings?: string[];
  engine?: string;
  sourceTextLength?: number;
}

@Injectable()
export class QuizAiService {
  private readonly logger = new Logger(QuizAiService.name);

  /**
   * Extract plain text from an uploaded file (PDF or TXT/markdown)
   */
  async extractTextFromFile(file: {
    buffer: Buffer;
    originalname?: string;
    mimetype?: string;
  }): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname?.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        const PDFParseClass = pdfParseModule?.PDFParse || pdfParseModule;
        if (typeof PDFParseClass === 'function' && PDFParseClass.prototype?.getText) {
          const parser = new PDFParseClass({ data: file.buffer });
          const res = await parser.getText();
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
          return (res?.text || res || '').trim();
        } else if (typeof pdfParseModule === 'function') {
          const res = await pdfParseModule(file.buffer);
          return (res?.text || '').trim();
        }
      } catch (err: any) {
        this.logger.error(`PDF extraction error: ${err.message}`, err.stack);
        throw new BadRequestException(
          'Failed to extract text from PDF. Please make sure the PDF contains selectable text (not scanned images).',
        );
      }
    }

    // Default to utf-8 text (.txt, .md, etc.)
    return file.buffer.toString('utf-8').trim();
  }

  /**
   * Parse questions, options, and correct answers from text (Bulk TXT / Copy-Paste format)
   */
  parseQuestionsFromText(rawText: string): ParsedQuizImportResult {
    if (!rawText || !rawText.trim()) {
      throw new BadRequestException('Please provide question text to parse.');
    }

    const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const warnings: string[] = [];

    // Check for trailing global Answer Key block
    // e.g. "Answer Key:\n1. A\n2. B, C\n3. D"
    const answerKeyMatch = clean.match(
      /(?:\n|^)\s*(?:Answers?|Answer\s*Key|Answers?\s*List|Solutions?)\s*:?\s*\n([\s\S]+)$/i,
    );

    let contentToParse = clean;
    const globalKeyMap = new Map<number, string[]>();

    if (answerKeyMatch) {
      contentToParse = clean.slice(0, answerKeyMatch.index).trim();
      const keyLines = answerKeyMatch[1].split('\n');
      for (const kline of keyLines) {
        const m = kline.match(/^\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s]+([A-Za-z0-9,\s]+)/i);
        if (m) {
          const qNum = parseInt(m[1], 10);
          const rawLetters = m[2]
            .split(/[,;\s]+/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          if (rawLetters.length > 0) {
            globalKeyMap.set(qNum, rawLetters);
          }
        }
      }
    }

    // Split content into question blocks
    // Matches "1. ", "Q1: ", "Question 1: ", "1) " at the start of lines
    const rawBlocks: string[] = [];
    const lines = contentToParse.split('\n');
    let currentBlock: string[] = [];

    const isQuestionStart = (line: string) =>
      /^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s+/i.test(line);

    for (const line of lines) {
      if (isQuestionStart(line)) {
        if (currentBlock.length > 0) {
          rawBlocks.push(currentBlock.join('\n').trim());
        }
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      rawBlocks.push(currentBlock.join('\n').trim());
    }

    const questions: CreateQuestionDto[] = [];

    rawBlocks.forEach((block, idx) => {
      const qNum = idx + 1;
      const bLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (bLines.length === 0) return;

      let prompt = '';
      let explanation = '';
      const options: { label: string; isCorrect: boolean; keyLetter?: string }[] = [];
      const perQuestionAnswerLetters: string[] = [];

      // Check for inline answer or explanation lines
      const nonOptionLines: string[] = [];

      for (let i = 0; i < bLines.length; i += 1) {
        const line = bLines[i];

        // Line 0 is always the start of the question prompt
        if (i === 0) {
          nonOptionLines.push(line);
          continue;
        }

        // Per-question Answer line: "Answer: B", "Ans: A, C", "Correct: B"
        const ansMatch = line.match(/^\s*(?:Answers?|Ans|Correct(?:\s*Answers?)?|Key)\s*[:\-]\s*([A-Za-z0-9,\s]+)/i);
        if (ansMatch) {
          const letters = ansMatch[1]
            .split(/[,;\s]+/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          perQuestionAnswerLetters.push(...letters);
          continue;
        }

        // Explanation line: "Explanation: ..." or "Exp: ..."
        const expMatch = line.match(/^\s*(?:Explanations?|Exp|Notes?)\s*[:\-]\s*(.+)$/i);
        if (expMatch) {
          explanation = expMatch[1].trim();
          continue;
        }

        // Checkbox option: "[x] Mitochondria" or "[ ] Nucleus"
        const checkboxMatch = line.match(/^\s*\[([ xX*✓])\]\s*(.+)$/);
        if (checkboxMatch) {
          const isMarked = ['x', 'X', '*', '✓'].includes(checkboxMatch[1]);
          options.push({
            label: checkboxMatch[2].trim(),
            isCorrect: isMarked,
          });
          continue;
        }

        // Standard option: "A) ...", "A. ...", "*B) ...", "B*) ...", "(A) ..."
        const optMatch = line.match(
          /^\s*([*✓])?\s*(?:\(?([A-Za-z]|[1-9])\)?(?:[\.\)\-\:]|\*))\s*(.+)$/,
        );

        if (optMatch && options.length < 10) {
          const hasStarBefore = Boolean(optMatch[1]);
          const keyLetter = optMatch[2].toUpperCase();
          let optLabel = optMatch[3].trim();

          // Check if optLabel has markers like "(Correct)", "[x]", "*", "✓"
          let isMarked = hasStarBefore;
          if (/\*$/.test(optLabel)) {
            isMarked = true;
            optLabel = optLabel.replace(/\*+$/, '').trim();
          }
          if (/(?:\(|\[)?\s*(?:Correct|Answer|True)\s*(?:\)|\])?/i.test(optLabel)) {
            isMarked = true;
            optLabel = optLabel
              .replace(/(?:\(|\[)?\s*(?:Correct|Answer|True)\s*(?:\)|\])?/gi, '')
              .trim();
          }
          if (/[✓✔]/.test(optLabel)) {
            isMarked = true;
            optLabel = optLabel.replace(/[✓✔]/g, '').trim();
          }

          options.push({
            label: optLabel,
            isCorrect: isMarked,
            keyLetter,
          });
          continue;
        }

        // If not option or answer/explanation, it belongs to the prompt
        if (options.length === 0) {
          nonOptionLines.push(line);
        } else {
          // If we already started options and hit a random trailing line, append to explanation or last option
          if (!explanation) {
            explanation = line;
          }
        }
      }

      // Build prompt from nonOptionLines, stripping leading question number
      prompt = nonOptionLines
        .join(' ')
        .replace(/^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s*/i, '')
        .trim();

      if (!prompt) {
        prompt = `Question ${qNum}`;
      }

      // If options didn't have embedded markers, resolve from per-question answer or global answer key
      const targetLetters = perQuestionAnswerLetters.length > 0
        ? perQuestionAnswerLetters
        : globalKeyMap.get(qNum) || [];

      if (targetLetters.length > 0) {
        options.forEach((opt, oIdx) => {
          const letter = opt.keyLetter || String.fromCharCode(65 + oIdx);
          if (targetLetters.includes(letter)) {
            opt.isCorrect = true;
          }
        });
      }

      // Fallback if no option marked correct: mark first option with warning
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (options.length >= 2 && correctCount === 0) {
        options[0].isCorrect = true;
        warnings.push(`Q${qNum}: No correct option was detected; marked Option A by default. Please verify.`);
      }

      if (options.length >= 2) {
        const finalType = correctCount > 1 ? 'multiple_choice' : 'single_choice';
        questions.push({
          prompt,
          questionType: finalType,
          marks: 1,
          explanation: explanation || undefined,
          options: options.map((o) => ({
            label: o.label || 'Option',
            isCorrect: Boolean(o.isCorrect),
          })),
        });
      }
    });

    if (questions.length === 0) {
      throw new BadRequestException(
        'Could not parse any valid questions. Please ensure each question starts with a number (e.g. 1. What is...) and has at least two options (e.g. A. option, B. option).',
      );
    }

    return {
      questions,
      totalParsed: questions.length,
      warnings: warnings.length > 0 ? warnings : undefined,
      engine: 'txt_parser',
      sourceTextLength: rawText.length,
    };
  }

  /**
   * Detect if text is already a structured MCQ quiz format (numbered questions with lettered options)
   */
  private isPreFormattedQuiz(text: string): boolean {
    const hasNumberedQuestion = /^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s+\S/im.test(text);
    const hasLetteredOption = /^\s*(?:[*✓])?\s*[A-Ea-e][\.\)\-\:]\s+\S/im.test(text);
    const hasCheckbox = /^\s*\[[xX\s*✓]\]/im.test(text);
    const hasAnswerLine = /^\s*(?:Answers?|Ans|Correct(?:\s*Answers?)?|Key)\s*[:\-]/im.test(text);
    return hasNumberedQuestion && (hasLetteredOption || hasCheckbox || hasAnswerLine);
  }

  /**
   * AI Quiz Generator: generate questions and answers from study material (using Gemini or heuristic NLP)
   * If the text already looks like a structured MCQ, parses it directly instead of generating.
   */
  async generateQuizWithAI(params: {
    studyText: string;
    questionCount?: number;
    questionType?: 'single_choice' | 'multiple_choice' | 'mixed';
    apiKey?: string;
  }): Promise<ParsedQuizImportResult> {
    const text = (params.studyText || '').trim();
    if (text.length < 30) {
      throw new BadRequestException(
        'Study text is too short. Please provide at least 30 characters of lesson content or upload a document.',
      );
    }

    // Auto-detect: if text already has numbered questions + lettered options, parse it directly
    if (this.isPreFormattedQuiz(text)) {
      const parsed = this.parseQuestionsFromText(text);
      return {
        ...parsed,
        engine: 'txt_parser_auto_detected',
        warnings: [
          'Your text already contained formatted questions, so they were parsed directly instead of AI-generated.',
          ...(parsed.warnings || []),
        ],
      };
    }

    const count = Math.min(20, Math.max(1, Number(params.questionCount) || 5));
    const targetType = params.questionType || 'mixed';
    const apiKey = params.apiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiApi(text, count, targetType, apiKey);
        if (geminiResult && geminiResult.length > 0) {
          return {
            questions: geminiResult,
            totalParsed: geminiResult.length,
            engine: 'google_gemini_ai',
            sourceTextLength: text.length,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API failed: ${err.message}. Falling back to Built-in Curriculum Engine.`);
      }
    }

    // Fallback: Built-in intelligent heuristic curriculum engine
    const heuristicQuestions = this.generateHeuristicQuestions(text, count, targetType);
    return {
      questions: heuristicQuestions,
      totalParsed: heuristicQuestions.length,
      engine: 'builtin_curriculum_nlp',
      warnings: !apiKey
        ? ['Generated using Built-in Curriculum Engine. (Tip: provide a Gemini API key for deep generative questions)']
        : undefined,
      sourceTextLength: text.length,
    };
  }

  /**
   * Call Google Gemini API with JSON output mode
   */
  private async callGeminiApi(
    studyText: string,
    count: number,
    questionType: string,
    apiKey: string,
  ): Promise<CreateQuestionDto[]> {
    const prompt = `You are an expert tuition teacher and exam assessment creator.
Analyze the following study material carefully and generate exactly ${count} educational quiz questions.

Requirements:
- Target question type preference: "${questionType}".
  * If "single_choice": exactly 1 option is marked with isCorrect: true.
  * If "multiple_choice": 2 or more options are marked with isCorrect: true.
  * If "mixed": provide a realistic mix of both single_choice and multiple_choice questions.
- Every question must have exactly 4 plausible options based on the text.
- Provide a clear, concise explanation for each question explaining why the correct answer is right.
- Set marks to 1 for each question.
- Do NOT include markdown code blocks or backticks in the response. Return strictly valid JSON.

JSON Schema format:
{
  "questions": [
    {
      "prompt": "Question text here?",
      "questionType": "single_choice" | "multiple_choice",
      "marks": 1,
      "explanation": "Clear explanation of the answer...",
      "options": [
        { "label": "Option text 1", "isCorrect": true },
        { "label": "Option text 2", "isCorrect": false },
        { "label": "Option text 3", "isCorrect": false },
        { "label": "Option text 4", "isCorrect": false }
      ]
    }
  ]
}

Study Material:
${studyText.slice(0, 16000)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawOutput) {
      throw new Error('Gemini returned empty text');
    }

    const parsed = JSON.parse(rawOutput);
    const rawList = Array.isArray(parsed) ? parsed : parsed.questions || [];

    const validated: CreateQuestionDto[] = [];
    for (const q of rawList) {
      if (!q.prompt || !Array.isArray(q.options) || q.options.length < 2) continue;
      const correctCount = q.options.filter((o: any) => o.isCorrect).length;
      const qType =
        q.questionType === 'multiple_choice' || correctCount > 1
          ? 'multiple_choice'
          : 'single_choice';

      // Ensure at least one correct
      if (correctCount === 0) {
        q.options[0].isCorrect = true;
      }
      if (qType === 'single_choice' && correctCount > 1) {
        let first = false;
        q.options.forEach((o: any) => {
          if (o.isCorrect && !first) {
            first = true;
          } else {
            o.isCorrect = false;
          }
        });
      }

      validated.push({
        prompt: q.prompt.trim(),
        questionType: qType,
        marks: Number(q.marks) || 1,
        explanation: q.explanation?.trim() || undefined,
        options: q.options.map((o: any) => ({
          label: String(o.label || '').trim(),
          isCorrect: Boolean(o.isCorrect),
        })),
      });
    }

    return validated;
  }

  /**
   * Built-in intelligent heuristic question generator (fallback for offline/no-key usage)
   */
  private generateHeuristicQuestions(
    text: string,
    count: number,
    targetType: string,
  ): CreateQuestionDto[] {
    // Break into sentences
    const sentences = text
      .split(/(?<=[.?!])\s+(?=[A-Z0-9])/)
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter((s) => s.length >= 25 && s.length <= 250);

    // Extract significant terms / keywords
    const words = text
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !/^(this|that|with|from|have|which|about|there|their|they|what|when|where)$/i.test(w));

    const uniqueTerms = Array.from(new Set(words));
    const questions: CreateQuestionDto[] = [];

    // Definition & fact extractors
    const factSentences = sentences.filter((s) =>
      /\b(?:is|are|defined as|refers to|known as|means|consists of|used for|responsible for|causes|results in)\b/i.test(
        s,
      ),
    );

    const candidates = factSentences.length >= count ? factSentences : sentences;

    for (let i = 0; i < Math.min(count, candidates.length); i += 1) {
      const sentence = candidates[i];
      const isMulti =
        targetType === 'multiple_choice' ||
        (targetType === 'mixed' && i % 2 === 1);

      if (isMulti) {
        // Multi-choice statement validation
        const correctOpt1 = sentence;
        const correctOpt2 = `It directly influences key processes described in this lesson.`;
        const distractor1 = `It has no measurable connection to the principles discussed.`;
        const distractor2 = `It strictly reverses all typical behaviors in standard conditions.`;

        questions.push({
          prompt: `Based on the lesson notes, which of the following statements are ACCURATE regarding the principles discussed?`,
          questionType: 'multiple_choice',
          marks: 1,
          explanation: `Accurate according to the text: "${sentence.slice(0, 120)}..."`,
          options: [
            { label: correctOpt1, isCorrect: true },
            { label: distractor1, isCorrect: false },
            { label: correctOpt2, isCorrect: true },
            { label: distractor2, isCorrect: false },
          ],
        });
      } else {
        // Single choice concept check / blank fill
        const match = sentence.match(
          /^([A-Za-z0-9\s]{3,35})\s+(is|are|refers to|means|consists of)\s+(.+)$/i,
        );

        if (match) {
          const subject = match[1].trim();
          const rest = match[3].trim().replace(/\.$/, '');

          const distractors = uniqueTerms
            .filter((t) => t.toLowerCase() !== subject.toLowerCase())
            .slice(i * 3, i * 3 + 3);

          while (distractors.length < 3) {
            distractors.push(`Alternative Factor ${distractors.length + 1}`);
          }

          const allOpts = [
            { label: subject, isCorrect: true },
            ...distractors.map((d) => ({ label: d, isCorrect: false })),
          ];
          // Deterministic shuffle
          const shuffled = allOpts.sort((a, b) => a.label.localeCompare(b.label));

          questions.push({
            prompt: `According to the text, which term ${match[2]} "${rest.slice(0, 100)}..."?`,
            questionType: 'single_choice',
            marks: 1,
            explanation: `The lesson notes state: "${sentence}"`,
            options: shuffled,
          });
        } else {
          // General comprehension
          questions.push({
            prompt: `Which of the following statements is directly supported by the text?`,
            questionType: 'single_choice',
            marks: 1,
            explanation: `Derived from: "${sentence}"`,
            options: [
              { label: sentence, isCorrect: true },
              {
                label: `The text states the exact opposite of standard observations.`,
                isCorrect: false,
              },
              {
                label: `This phenomenon was entirely dismissed in modern research.`,
                isCorrect: false,
              },
              {
                label: `No relationship exists between the factors mentioned.`,
                isCorrect: false,
              },
            ],
          });
        }
      }
    }

    return questions;
  }
}

