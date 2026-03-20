import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThumbsUp, MessageCircle, ShieldCheck } from 'lucide-react-native';
import { AppText, Avatar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import type { Question } from '@/apis/product-detail.api';

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string) => void;
  onToggleLike: (questionId: string) => void;
}

const INITIAL_ANSWERS = 2;

export default function QuestionCard({ question, onAnswer, onToggleLike }: QuestionCardProps) {
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const date = new Date(question.createdAt).toLocaleDateString(locale);
  const visibleAnswers = showAllAnswers ? question.answers : question.answers.slice(0, INITIAL_ANSWERS);
  const hiddenCount = question.answers.length - INITIAL_ANSWERS;

  return (
    <View className="border-b py-3" style={{ borderBottomColor: colors.neutrals800 }}>
      {/* Question header */}
      <View className="flex-row items-center gap-2">
        {question.user_avatar ? (
          <Avatar size="sm" source={{ uri: question.user_avatar }} alt={question.user_name} />
        ) : (
          <Avatar size="sm" text={question.user_name} />
        )}
        <View className="flex-1">
          <AppText raw variant="bodySmall" weight="medium">
            {question.user_name}
          </AppText>
          <AppText raw variant="labelSmall" color="muted">
            {date}
          </AppText>
        </View>
      </View>

      {/* Question text */}
      <AppText raw variant="bodySmall" className="mt-2">
        {question.question}
      </AppText>

      {/* Actions row */}
      <View className="mt-2 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => onToggleLike(question._id)}
          accessibilityRole="button"
          accessibilityLabel={question.is_liked ? 'Unlike question' : 'Like question'}
          accessibilityState={{ selected: question.is_liked }}
          className="flex-row items-center gap-1"
        >
          <ThumbsUp
            size={14}
            color={question.is_liked ? colors.primary : colors.neutrals400}
            fill={question.is_liked ? colors.primary : 'transparent'}
          />
          {question.likes_count > 0 && (
            <AppText raw variant="labelSmall" color="muted">
              {question.likes_count}
            </AppText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAnswer(question._id)}
          accessibilityRole="button"
          accessibilityLabel={t('PD_ANSWER_A11Y')}
          className="flex-row items-center gap-1"
        >
          <MessageCircle size={14} color={colors.neutrals400} />
          <AppText raw variant="labelSmall" color="muted">
            {t('PD_ANSWER')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Answers */}
      {question.answers.length > 0 && (
        <View className="ml-6 mt-2">
          {visibleAnswers.map((ans) => (
            <View key={ans._id} className="mb-2 flex-row gap-2">
              {ans.user_avatar ? (
                <Avatar size="sm" source={{ uri: ans.user_avatar }} alt={ans.user_name} />
              ) : (
                <Avatar size="sm" text={ans.user_name} />
              )}
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <AppText raw variant="labelSmall" weight="medium">
                    {ans.user_name}
                  </AppText>
                  {ans.is_seller && (
                    <ShieldCheck size={12} color={colors.primary} />
                  )}
                </View>
                <AppText raw variant="bodySmall" color="muted">
                  {ans.answer}
                </AppText>
              </View>
            </View>
          ))}
          {!showAllAnswers && hiddenCount > 0 && (
            <TouchableOpacity onPress={() => setShowAllAnswers(true)} accessibilityRole="button">
              <AppText raw variant="labelSmall" style={{ color: colors.primary }}>
                {t('PD_VIEW_MORE_ANSWERS', { count: hiddenCount })}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}