import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import ReviewCard from './ReviewCard';
import type { Review, ReviewStats } from '@/apis/product-detail.api';

interface ReviewSectionProps {
  reviews: Review[];
  stats: ReviewStats | undefined;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onWriteReview: () => void;
  onToggleLike: (reviewId: string) => void;
}

function RatingBar({ rating, count, total, color }: { rating: number; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-2">
      <AppText raw variant="labelSmall" color="muted" style={{ width: 12, textAlign: 'right' }}>
        {rating}
      </AppText>
      <Star size={10} color={colors.warning} fill={colors.warning} />
      <View className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: colors.neutrals800 }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
      </View>
      <AppText raw variant="labelSmall" color="muted" style={{ width: 28, textAlign: 'right' }}>
        {count}
      </AppText>
    </View>
  );
}
export default function ReviewSection({
  reviews,
  stats,
  hasNextPage,
  onLoadMore,
  onWriteReview,
  onToggleLike,
}: ReviewSectionProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View className="px-4 py-3">
      <View className="mb-3 flex-row items-center justify-between">
        <AppText raw variant="heading4" weight="bold">
          {t('PD_REVIEWS')}
        </AppText>
        <TouchableOpacity
          onPress={onWriteReview}
          accessibilityRole="button"
          accessibilityLabel={t('PD_WRITE_REVIEW')}
        >
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {t('PD_WRITE_REVIEW')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Rating breakdown */}
      {stats && stats.total_reviews > 0 && (
        <View className="mb-4 flex-row gap-4">
          <View className="items-center justify-center">
            <AppText raw variant="display3" weight="bold">
              {stats.average_rating.toFixed(1)}
            </AppText>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  color={colors.warning}
                  fill={s <= Math.round(stats.average_rating) ? colors.warning : 'transparent'}
                />
              ))}
            </View>
            <AppText raw variant="labelSmall" color="muted">
              {t('PD_REVIEWS_COUNT', { count: stats.total_reviews })}
            </AppText>
          </View>
          <View className="flex-1 gap-1">
            {[5, 4, 3, 2, 1].map((r) => (
              <RatingBar
                key={r}
                rating={r}
                count={stats.rating_breakdown[r] || 0}
                total={stats.total_reviews}
                color={colors.warning}
              />
            ))}
          </View>
        </View>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <View className="items-center py-6">
          <AppText raw variant="bodySmall" color="muted">
            {t('PD_NO_REVIEWS')}
          </AppText>
          <TouchableOpacity onPress={onWriteReview} className="mt-2" accessibilityRole="button">
            <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
              {t('PD_BE_FIRST_REVIEW')}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} onToggleLike={onToggleLike} />
          ))}
          {hasNextPage && (
            <AppButton variant="ghost" size="sm" onPress={onLoadMore}>
              {t('PD_VIEW_MORE_REVIEWS')}
            </AppButton>
          )}
        </>
      )}
    </View>
  );
}
