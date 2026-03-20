import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import QuestionCard from './QuestionCard';
import type { Question } from '@/apis/product-detail.api';

interface QASectionProps {
  questions: Question[];
  hasNextPage: boolean;
  onLoadMore: () => void;
  onAskQuestion: () => void;
  onAnswerQuestion: (questionId: string) => void;
  onToggleLike: (questionId: string) => void;
}

export default function QASection({
  questions,
  hasNextPage,
  onLoadMore,
  onAskQuestion,
  onAnswerQuestion,
  onToggleLike,
}: QASectionProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View className="px-4 py-3">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="heading4" weight="bold">
          {t('PD_QA')}
        </AppText>
        <TouchableOpacity
          onPress={onAskQuestion}
          accessibilityRole="button"
          accessibilityLabel={t('PD_ASK_QUESTION_A11Y')}>
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {t('PD_ASK_QUESTION')}
          </AppText>
        </TouchableOpacity>
      </View>

      {questions.length === 0 ? (
        <View className="items-center py-6">
          <AppText raw variant="bodySmall" color="muted">
            {t('PD_NO_QUESTIONS')}
          </AppText>
          <TouchableOpacity onPress={onAskQuestion} className="mt-2" accessibilityRole="button">
            <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
              {t('PD_BE_FIRST_QUESTION')}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {questions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              onAnswer={onAnswerQuestion}
              onToggleLike={onToggleLike}
            />
          ))}
          {hasNextPage && (
            <AppButton variant="ghost" size="sm" onPress={onLoadMore}>
              {t('PD_VIEW_MORE_QUESTIONS')}
            </AppButton>
          )}
        </>
      )}
    </View>
  );
}
