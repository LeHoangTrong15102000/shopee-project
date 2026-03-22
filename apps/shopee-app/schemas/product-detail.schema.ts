// Product Detail form validation constants
// Shared validation rules to ensure consistency across ReviewForm and QuestionForm

export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 2000;
export const QUESTION_MIN_LENGTH = 10;
export const QUESTION_MAX_LENGTH = 2000;
export const ANSWER_MIN_LENGTH = 10;
export const ANSWER_MAX_LENGTH = 2000;

// Validation helper functions
export const validateReviewComment = (comment: string): boolean => {
  const trimmed = comment.trim();
  return trimmed.length >= REVIEW_MIN_LENGTH && trimmed.length <= REVIEW_MAX_LENGTH;
};

export const validateQuestionText = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.length >= QUESTION_MIN_LENGTH && trimmed.length <= QUESTION_MAX_LENGTH;
};

export const validateAnswerText = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.length >= ANSWER_MIN_LENGTH && trimmed.length <= ANSWER_MAX_LENGTH;
};
