import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrueFalseReview } from '../TrueFalseReview';

describe('TrueFalseReview', () => {
  it('balances true and false options when presenting statements', () => {
    const question = {
      id: '1',
      question_type: 'true_false',
      payload: {
        stem: 'Test stem',
        statements: [
          { true_statement: 'T1', false_alternative: 'F1' },
          { true_statement: 'T2', false_alternative: 'F2' },
          { true_statement: 'T3', false_alternative: 'F3' },
          { true_statement: 'T4', false_alternative: 'F4' },
        ]
      }
    };

    render(<TrueFalseReview question={question as any} onNext={vi.fn()} onPrev={vi.fn()} />);

    let tCount = 0;
    let fCount = 0;
    for (let i = 1; i <= 4; i++) {
      if (screen.queryByText(`T${i}`)) tCount++;
      if (screen.queryByText(`F${i}`)) fCount++;
    }

    expect(tCount).toBe(2);
    expect(fCount).toBe(2);
  });
});
