export const SAMPLE_QUIZ_TXT = `1. What is the powerhouse of the cell?
A) Nucleus
*B) Mitochondria
C) Ribosome
D) Endoplasmic Reticulum
Explanation: Mitochondria generate most of the chemical energy needed by cellular processes.

2. Which of the following numbers are prime numbers?
[x] 2
[x] 3
[ ] 4
[ ] 9
Explanation: 2 and 3 are prime numbers because they have only two distinct positive divisors: 1 and themselves.

3. What is the administrative capital of Sri Lanka?
A) Colombo
B) Kandy
C) Sri Jayawardenepura Kotte
D) Galle
Answer: C

4. Which of the following are primary states of matter?
*A) Solid
*B) Liquid
*C) Gas
D) Plasma
Explanation: Solid, liquid, and gas are the three classic fundamental states of matter.
`;

export function downloadSampleQuizTxt() {
  const blob = new Blob([SAMPLE_QUIZ_TXT], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_quiz_questions.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseQuestionsFromClientText(rawText) {
  if (!rawText || !rawText.trim()) {
    return { questions: [], warnings: [] };
  }

  const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const warnings = [];

  // Trailing answer key block (e.g. "Answer Key:\n1. B\n2. A, B")
  const keyBlockMatch = clean.match(
    /(?:\n|^)\s*(?:Answers?|Answer\s*Key|Answers?\s*List|Solutions?)\s*:?\s*\n([\s\S]+)$/i,
  );

  let contentToParse = clean;
  const globalKeyMap = new Map();

  if (keyBlockMatch) {
    contentToParse = clean.slice(0, keyBlockMatch.index).trim();
    const keyLines = keyBlockMatch[1].split('\n');
    for (const kline of keyLines) {
      const m = kline.match(
        /^\s*(?:Q(?:uestion)?\.?\s*)?(\d+)[\.\)\-\:\s]+([A-Za-z0-9,\s]+)/i,
      );
      if (m) {
        const qNum = parseInt(m[1], 10);
        const letters = m[2]
          .split(/[,;\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        if (letters.length > 0) {
          globalKeyMap.set(qNum, letters);
        }
      }
    }
  }

  const rawBlocks = [];
  const lines = contentToParse.split('\n');
  let currentBlock = [];

  const isQuestionStart = (line) =>
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

  const questions = [];

  rawBlocks.forEach((block, idx) => {
    const qNum = idx + 1;
    const bLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (bLines.length === 0) return;

    let explanation = '';
    const options = [];
    const perQuestionAnswerLetters = [];
    const nonOptionLines = [];

    for (let i = 0; i < bLines.length; i += 1) {
      const line = bLines[i];

      // Line 0 is always the start of the question prompt
      if (i === 0) {
        nonOptionLines.push(line);
        continue;
      }

      // Per-question Answer line: "Answer: B", "Ans: A, C"
      const ansMatch = line.match(
        /^\s*(?:Answers?|Ans|Correct(?:\s*Answers?)?|Key)\s*[:\-]\s*([A-Za-z0-9,\s]+)/i,
      );
      if (ansMatch) {
        const letters = ansMatch[1]
          .split(/[,;\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        perQuestionAnswerLetters.push(...letters);
        continue;
      }

      // Explanation line
      const expMatch = line.match(/^\s*(?:Explanations?|Exp|Notes?)\s*[:\-]\s*(.+)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      // Checkbox format: "[x] Option" or "[ ] Option"
      const checkboxMatch = line.match(/^\s*\[([ xX*✓])\]\s*(.+)$/);
      if (checkboxMatch) {
        const isMarked = ['x', 'X', '*', '✓'].includes(checkboxMatch[1]);
        options.push({
          label: checkboxMatch[2].trim(),
          isCorrect: isMarked,
        });
        continue;
      }

      // Option format: "A) Option", "*A. Option", "A*. Option", "(A) Option"
      const optMatch = line.match(
        /^\s*([*✓])?\s*(?:\(?([A-Za-z]|[1-9])\)?(?:[\.\)\-\:]|\*))\s*(.+)$/,
      );

      if (optMatch && options.length < 10) {
        const hasStarBefore = Boolean(optMatch[1]);
        const keyLetter = optMatch[2].toUpperCase();
        let optLabel = optMatch[3].trim();

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

      if (options.length === 0) {
        nonOptionLines.push(line);
      } else if (!explanation) {
        explanation = line;
      }
    }

    let prompt = nonOptionLines
      .join(' ')
      .replace(/^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s*/i, '')
      .trim();

    if (!prompt) {
      prompt = `Question ${qNum}`;
    }

    const targetLetters =
      perQuestionAnswerLetters.length > 0
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

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (options.length >= 2 && correctCount === 0) {
      options[0].isCorrect = true;
      warnings.push(`Q${qNum}: No answer marked; Option A set as default.`);
    }

    if (options.length >= 2) {
      const finalType = correctCount > 1 ? 'multiple_choice' : 'single_choice';
      questions.push({
        prompt,
        questionType: finalType,
        marks: 1,
        explanation: explanation || '',
        options: options.map((o) => ({
          label: o.label || 'Option',
          isCorrect: Boolean(o.isCorrect),
        })),
      });
    }
  });

  return { questions, warnings };
}
