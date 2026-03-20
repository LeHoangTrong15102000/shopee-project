import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Star, ThumbsUp } from 'lucide-react-native';
import { AppText, Avatar } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import type { Review } from '@/apis/product-detail.api';

interface ReviewCardProps {
  review: Review;
  onToggleLike: (reviewId: string) => void;
}

export default function ReviewCard({ review, onToggleLike }: ReviewCardProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const date = new Date(review.createdAt).toLocaleDateString(locale);

  return (
    <View className="border-b py-3" style={{ borderBottomColor: colors.neutrals800 }}>
      <View className="flex-row items-center gap-2">
        {review.user.avatar ? (
          <Avatar size="sm" source={{ uri: review.user.avatar }} alt={review.user.name} />
        ) : (
          <Avatar size="sm" text={review.user.name} />
        )}
        <View className="flex-1">
          <AppText raw variant="bodySmall" weight="medium">
            {review.user.name}
          </AppText>
          <View className="flex-row items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={10}
                color={colors.warning}
                fill={s <= review.rating ? colors.warning : 'transparent'}
              />
            ))}
            <AppText raw variant="labelSmall" color="muted" className="ml-1">
              {date}
            </AppText>
          </View>
        </View>
      </View>

      <AppText
        raw
        variant="bodySmall"
        color="muted"
        className="mt-2"
        numberOfLines={expanded ? undefined : 3}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityHint={expanded ? 'Collapse review text' : 'Expand review text'}
      >
        {review.comment}
      </AppText>

      <View className="mt-2 flex-row items-center">
        <TouchableOpacity
          onPress={() => onToggleLike(review._id)}
          accessibilityRole="button"
          accessibilityLabel={review.is_liked ? 'Unlike review' : 'Like review'}
          accessibilityState={{ selected: !!review.is_liked }}
          className="flex-row items-center gap-1"
        >
          <ThumbsUp
            size={14}
            color={review.is_liked ? colors.primary : colors.neutrals400}
            fill={review.is_liked ? colors.primary : 'transparent'}
          />
          {review.helpful_count > 0 && (
            <AppText raw variant="labelSmall" color="muted">
              {review.helpful_count}
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
