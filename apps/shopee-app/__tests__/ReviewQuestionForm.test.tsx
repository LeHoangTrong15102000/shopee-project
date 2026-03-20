import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReviewForm from '../components/product-detail/ReviewForm';
import QuestionForm from '../components/product-detail/QuestionForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    foreground: '#fff',
    warning: '#f4c790',
    neutrals400: '#6e6e6e',
    neutrals800: '#2a2a2a',
    background: '#000',
  }),
}));

describe('ReviewForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => onSubmit.mockClear());

  it('shows validation error when comment is too short', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <ReviewForm bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_REVIEW_COMMENT_LABEL'), 'Short');
    fireEvent.press(getByText('PD_REVIEW_SUBMIT'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only comment', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <ReviewForm bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_REVIEW_COMMENT_LABEL'), '          ');
    fireEvent.press(getByText('PD_REVIEW_SUBMIT'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when no rating selected', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <ReviewForm bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_REVIEW_COMMENT_LABEL'), 'This is a valid review comment');
    fireEvent.press(getByText('PD_REVIEW_SUBMIT'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when rating and valid comment provided', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <ReviewForm bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByLabelText('Rate 4 stars'));
    fireEvent.changeText(getByLabelText('PD_REVIEW_COMMENT_LABEL'), 'This is a valid review comment');
    fireEvent.press(getByText('PD_REVIEW_SUBMIT'));
    expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: 'This is a valid review comment' });
  });
});

describe('QuestionForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => onSubmit.mockClear());

  it('shows validation error when question is too short', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <QuestionForm mode="ask" bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_ASK_QUESTION'), 'Short');
    fireEvent.press(getByText('PD_QUESTION_SUBMIT'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid question', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <QuestionForm mode="ask" bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_ASK_QUESTION'), 'Is this product waterproof?');
    fireEvent.press(getByText('PD_QUESTION_SUBMIT'));
    expect(onSubmit).toHaveBeenCalledWith('Is this product waterproof?');
  });

  it('shows question context in answer mode', () => {
    const ref = createRef<any>();
    const { getByText } = render(
      <QuestionForm
        mode="answer"
        questionContext="Is this product waterproof?"
        bottomSheetRef={ref}
        onSubmit={onSubmit}
      />,
    );
    expect(getByText('Is this product waterproof?')).toBeTruthy();
  });

  it('validates answer minimum length', () => {
    const ref = createRef<any>();
    const { getByText, getByLabelText } = render(
      <QuestionForm mode="answer" bottomSheetRef={ref} onSubmit={onSubmit} />,
    );
    fireEvent.changeText(getByLabelText('PD_ANSWER'), 'No');
    fireEvent.press(getByText('PD_ANSWER_SUBMIT'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
