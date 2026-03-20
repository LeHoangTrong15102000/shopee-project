import React, { useCallback, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Star } from 'lucide-react-native';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  loading?: boolean;
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

export default function ReviewForm({ onSubmit, loading, bottomSheetRef }: ReviewFormProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (comment.trim().length < 10) {
      setError(t('PD_REVIEW_MIN_LENGTH'));
      return;
    }
    if (rating === 0) {
      setError(t('PD_REVIEW_RATING_LABEL'));
      return;
    }
    setError('');
    onSubmit({ rating, comment: comment.trim() });
  };

  const resetForm = useCallback(() => {
    setRating(0);
    setComment('');
    setError('');
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.neutrals400 }}
      onDismiss={resetForm}>
      <BottomSheetView className="px-4 pb-8">
        <AppText raw variant="heading4" weight="bold" className="mb-4">
          {t('PD_WRITE_REVIEW')}
        </AppText>

        {/* Star rating */}
        <AppText raw variant="bodySmall" weight="medium" className="mb-2">
          {t('PD_REVIEW_RATING_LABEL')}
        </AppText>
        <View
          className="mb-4 flex-row gap-2"
          accessibilityRole="radiogroup"
          accessibilityLabel={t('PD_REVIEW_RATING_LABEL')}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setRating(s)}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${s} stars`}
              accessibilityState={{ selected: s <= rating }}>
              <Star
                size={32}
                color={colors.warning}
                fill={s <= rating ? colors.warning : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment input */}
        <AppText raw variant="bodySmall" weight="medium" className="mb-2">
          {t('PD_REVIEW_COMMENT_LABEL')}
        </AppText>
        <TextInput
          value={comment}
          onChangeText={(text) => {
            setComment(text);
            if (error) setError('');
          }}
          placeholder={t('PD_REVIEW_COMMENT_PLACEHOLDER')}
          placeholderTextColor={colors.neutrals400}
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: colors.neutrals800,
            color: colors.foreground,
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
          accessibilityLabel={t('PD_REVIEW_COMMENT_LABEL')}
        />
        {error ? (
          <AppText raw variant="labelSmall" color="error" className="mt-1">
            {error}
          </AppText>
        ) : null}

        <View className="mt-4">
          <AppButton variant="primary" onPress={handleSubmit} loading={loading} disabled={loading}>
            {t('PD_REVIEW_SUBMIT')}
          </AppButton>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
