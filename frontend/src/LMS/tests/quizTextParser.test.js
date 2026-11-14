import { describe, expect, it } from 'vitest';
import { parseQuestionsFromClientText } from '../utils/quizTextParser';

describe('Quiz Text Parser Utility', () => {
  it('parses single choice questions with asterisk on option', () => {
    const txt = `1. What is the powerhouse of the cell?
A) Nucleus
*B) Mitochondria
C) Ribosome
D) Endoplasmic Reticulum
Explanation: Produces ATP.`;

    const { questions, warnings } = parseQuestionsFromClientText(txt);
    expect(questions).toHaveLength(1);
    expect(questions[0].prompt).toBe('What is the powerhouse of the cell?');
    expect(questions[0].questionType).toBe('single_choice');
    expect(questions[0].options[1].label).toBe('Mitochondria');
    expect(questions[0].options[1].isCorrect).toBe(true);
    expect(questions[0].options[0].isCorrect).toBe(false);
    expect(questions[0].explanation).toBe('Produces ATP.');
    expect(warnings).toHaveLength(0);
  });

  it('parses multiple choice questions with [x] checkbox syntax', () => {
    const txt = `2. Which numbers are prime?
[x] 2
[x] 3
[ ] 4
[ ] 9`;

    const { questions } = parseQuestionsFromClientText(txt);
    expect(questions).toHaveLength(1);
    expect(questions[0].questionType).toBe('multiple_choice');
    const correctOpts = questions[0].options.filter((o) => o.isCorrect).map((o) => o.label);
    expect(correctOpts).toEqual(['2', '3']);
  });

  it('parses question with Answer: line', () => {
    const txt = `3. What is the capital of Sri Lanka?
A) Colombo
B) Kandy
C) Sri Jayawardenepura Kotte
D) Galle
Answer: C`;

    const { questions } = parseQuestionsFromClientText(txt);
    expect(questions).toHaveLength(1);
    expect(questions[0].options[2].isCorrect).toBe(true);
    expect(questions[0].questionType).toBe('single_choice');
  });

  it('parses questions matching against trailing Answer Key block', () => {
    const txt = `1. Question One?
A. Option A
B. Option B

2. Question Two?
A. Option A
B. Option B

Answer Key:
1. B
2. A, B`;

    const { questions } = parseQuestionsFromClientText(txt);
    expect(questions).toHaveLength(2);
    expect(questions[0].options[1].isCorrect).toBe(true);
    expect(questions[0].questionType).toBe('single_choice');

    expect(questions[1].questionType).toBe('multiple_choice');
    expect(questions[1].options[0].isCorrect).toBe(true);
    expect(questions[1].options[1].isCorrect).toBe(true);
  });
});

