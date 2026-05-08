import React, { useState } from 'react'
import { View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import { Star, ThumbsUp, MessageCircle, Edit2, Trash2 } from 'lucide-react-native'
import { AppText, Avatar } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'
import type { Review } from '@/apis/product-detail.api'
import { useReviewComments, usePostReviewComment } from '@/hooks/useReviewComments'
import { useEditReview, useDeleteReview } from '@/hooks/useReviewActions'
import { useAuthStore } from '@/store/authStore'

interface ReviewCardProps {
  review: Review
  productId: string
  onToggleLike: (reviewId: string) => void
}

export default function ReviewCard({ review, productId, onToggleLike }: ReviewCardProps) {
  const colors = useColors()
  const { t, i18n } = useTranslation()
  const currentUserId = useAuthStore((s) => s.user?._id)

  const [expanded, setExpanded] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editComment, setEditComment] = useState(review.comment)

  const isOwner = !!currentUserId && currentUserId === review.user._id

  const { data: commentsData, isLoading: isLoadingComments } = useReviewComments(
    commentsOpen ? review._id : ''
  )
  const { mutate: postComment, isPending: isPostingComment } = usePostReviewComment()
  const { mutate: editReviewMutate, isPending: isEditing } = useEditReview(productId)
  const { mutate: deleteReviewMutate, isPending: isDeleting } = useDeleteReview(productId)

  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US'
  const date = new Date(review.createdAt).toLocaleDateString(locale)

  const comments = commentsData?.data ?? []

  const handleSubmitComment = () => {
    if (!commentInput.trim()) return
    postComment(
      { reviewId: review._id, content: commentInput.trim() },
      { onSuccess: () => setCommentInput('') }
    )
  }

  const handleEditSubmit = () => {
    editReviewMutate(
      { reviewId: review._id, payload: { rating: editRating, comment: editComment } },
      { onSuccess: () => setEditMode(false) }
    )
  }

  const handleDelete = () => {
    Alert.alert(
      t('review.delete.confirm'),
      undefined,
      [
        { text: t('review.delete.cancel'), style: 'cancel' },
        {
          text: t('review.delete.confirm'),
          style: 'destructive',
          onPress: () => deleteReviewMutate(review._id),
        },
      ]
    )
  }

  return (
    <View className="border-b py-3" style={{ borderBottomColor: colors.neutrals800 }}>
      {/* Header row */}
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
          <View className="flex-row items-center gap-1" accessible={false}>
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

        {/* Owner actions */}
        {isOwner && !editMode && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setEditMode(true)}
              accessibilityRole="button"
              accessibilityLabel={t('review.edit.title')}>
              <Edit2 size={16} color={colors.neutrals400} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel={t('review.delete.confirm')}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Trash2 size={16} color={colors.error} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit form */}
      {editMode ? (
        <View className="mt-2 gap-2">
          <AppText raw variant="bodySmall" weight="medium">
            {t('review.edit.title')}
          </AppText>
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setEditRating(s)} accessibilityRole="button">
                <Star
                  size={20}
                  color={colors.warning}
                  fill={s <= editRating ? colors.warning : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={editComment}
            onChangeText={setEditComment}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.neutrals700,
              borderRadius: 8,
              padding: 8,
              color: colors.foreground,
              minHeight: 60,
            }}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setEditMode(false)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.neutrals600,
                borderRadius: 8,
                paddingVertical: 6,
                alignItems: 'center',
              }}>
              <AppText raw variant="bodySmall">
                {t('review.delete.cancel')}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditSubmit}
              disabled={isEditing}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 6,
                alignItems: 'center',
              }}>
              {isEditing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppText raw variant="bodySmall" style={{ color: '#fff' }}>
                  {t('review.edit.title')}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <AppText
          raw
          variant="bodySmall"
          color="muted"
          className="mt-2"
          numberOfLines={expanded ? undefined : 3}
          onPress={() => setExpanded(!expanded)}
          accessibilityRole="button"
          accessibilityHint={expanded ? t('a11y.collapseReview') : t('a11y.expandReview')}>
          {review.comment}
        </AppText>
      )}

      {/* Like + comment toggle row */}
      <View className="mt-2 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => onToggleLike(review._id)}
          accessibilityRole="button"
          accessibilityLabel={review.is_liked ? t('a11y.unlikeReview') : t('a11y.likeReview')}
          accessibilityState={{ selected: !!review.is_liked }}
          className="flex-row items-center gap-1">
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

        <TouchableOpacity
          onPress={() => setCommentsOpen((v) => !v)}
          accessibilityRole="button"
          className="flex-row items-center gap-1">
          <MessageCircle size={14} color={colors.neutrals400} />
          <AppText raw variant="labelSmall" color="muted">
            {commentsOpen ? t('review.comments.toggle') : t('review.comments.toggle')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Comments section */}
      {commentsOpen && (
        <View className="mt-2 ml-2">
          {isLoadingComments ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : comments.length === 0 ? (
            <AppText raw variant="labelSmall" color="muted">
              {t('review.comments.empty')}
            </AppText>
          ) : (
            comments.map((c) => (
              <View key={c._id} className="mb-1 flex-row gap-2">
                {c.user.avatar ? (
                  <Avatar size="sm" source={{ uri: c.user.avatar }} alt={c.user.name} />
                ) : (
                  <Avatar size="sm" text={c.user.name} />
                )}
                <View className="flex-1">
                  <AppText raw variant="labelSmall" weight="medium">
                    {c.user.name}
                  </AppText>
                  <AppText raw variant="bodySmall" color="muted">
                    {c.content}
                  </AppText>
                </View>
              </View>
            ))
          )}

          {/* Comment input */}
          <View className="mt-2 flex-row items-center gap-2">
            <TextInput
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder={t('review.comments.inputPlaceholder')}
              placeholderTextColor={colors.neutrals500}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.neutrals700,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                color: colors.foreground,
                fontSize: 13,
              }}
            />
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!commentInput.trim() || isPostingComment}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor:
                  !commentInput.trim() || isPostingComment ? colors.neutrals700 : colors.primary,
              }}>
              {isPostingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppText raw variant="labelSmall" style={{ color: '#fff' }}>
                  {t('review.comments.submit')}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}
