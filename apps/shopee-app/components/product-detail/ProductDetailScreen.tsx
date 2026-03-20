import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/ToastProvider';
import { AppText, AppButton } from '@/components/ui';
import {
  useProductDetailQuery,
  useProductReviews,
  useProductQuestions,
  useWishlistStatus,
  useRelatedProducts,
  useToggleWishlist,
  useAddToCart,
  useBuyNow,
  useCreateReview,
  useToggleReviewLike,
  useAskQuestion,
  useAnswerQuestion,
  useLikeQuestion,
} from '@/hooks/useProductDetail';

import ProductDetailSkeleton from './ProductDetailSkeleton';
import ImageGallery from './ImageGallery';
import ProductInfo from './ProductInfo';
import QuantitySelector from './QuantitySelector';
import ProductDescription from './ProductDescription';
import WishlistButton from './WishlistButton';
import StickyBottomBar from './StickyBottomBar';
import ReviewSection from './ReviewSection';
import ReviewForm from './ReviewForm';
import QASection from './QASection';
import QuestionForm from './QuestionForm';
import RelatedProducts from './RelatedProducts';

interface ProductDetailScreenProps {
  productId: string;
}

export default function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showError } = useToast();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [answerTargetId, setAnswerTargetId] = useState<string | null>(null);
  const [answerContext, setAnswerContext] = useState('');

  // ─── Refs ───────────────────────────────────────────────────────────────────
  const reviewFormRef = useRef<BottomSheetModal>(null);
  const questionFormRef = useRef<BottomSheetModal>(null);
  const answerFormRef = useRef<BottomSheetModal>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────
  const productQuery = useProductDetailQuery(productId);
  const reviewsQuery = useProductReviews(productId);
  const questionsQuery = useProductQuestions(productId);
  const wishlistQuery = useWishlistStatus(productId);
  const relatedQuery = useRelatedProducts(
    productQuery.data?.data.category._id,
    productId,
  );

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const toggleWishlist = useToggleWishlist(productId);
  const addToCart = useAddToCart();
  const buyNow = useBuyNow();
  const createReview = useCreateReview(productId);
  const toggleReviewLike = useToggleReviewLike(productId);
  const askQuestion = useAskQuestion(productId);
  const answerQuestion = useAnswerQuestion(productId);
  const likeQuestion = useLikeQuestion(productId);

  const product = productQuery.data?.data;
  const isOutOfStock = product ? product.quantity <= 0 : false;

  // ─── Derived data ───────────────────────────────────────────────────────────
  const reviews = reviewsQuery.data?.pages.flatMap((p) => p.data.reviews) ?? [];
  const reviewStats = reviewsQuery.data?.pages[0]?.data.stats;
  const questions = questionsQuery.data?.pages.flatMap((p) => p.data.questions) ?? [];
  const relatedProducts = relatedQuery.data?.data.products ?? [];
  const inWishlist = wishlistQuery.data?.data.in_wishlist ?? false;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ product_id: product._id, buy_count: quantity });
  };

  const handleBuyNow = () => {
    if (!product) return;
    buyNow.mutate({ product_id: product._id, buy_count: quantity });
  };

  const handleToggleWishlist = () => {
    toggleWishlist.mutate(inWishlist);
  };

  const handleSubmitReview = (data: { rating: number; comment: string }) => {
    // TODO: purchase_id is required by backend — review creation should be gated
    // by checking if user has a completed purchase for this product.
    // For now, pass empty string; the backend will reject if no valid purchase exists.
    createReview.mutate(
      { purchase_id: '', ...data },
      { onSuccess: () => reviewFormRef.current?.dismiss() },
    );
  };

  const handleSubmitQuestion = (text: string) => {
    askQuestion.mutate(
      { product_id: productId, question: text },
      { onSuccess: () => questionFormRef.current?.dismiss() },
    );
  };

  const handleOpenAnswer = (questionId: string) => {
    const q = questions.find((q) => q._id === questionId);
    setAnswerTargetId(questionId);
    setAnswerContext(q?.question ?? '');
    answerFormRef.current?.present();
  };

  const handleSubmitAnswer = (text: string) => {
    if (!answerTargetId) return;
    answerQuestion.mutate(
      { questionId: answerTargetId, answer: text },
      { onSuccess: () => answerFormRef.current?.dismiss() },
    );
  };

  // ─── 404 redirect (must be before early returns to respect Rules of Hooks) ──
  const is404 = productQuery.isError && (productQuery.error as any)?.response?.status === 404;
  useEffect(() => {
    if (is404) {
      showError(t('PD_PRODUCT_NOT_FOUND'));
      router.back();
    }
  }, [is404]);

  // ─── Loading state ────────────────────────────────────────────────────────
  if (productQuery.isLoading) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <ChevronLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <ProductDetailSkeleton />
      </View>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────
  if (productQuery.isError || !product) {
    if (is404) return null;

    return (
      <View className="flex-1 items-center justify-center bg-background" style={{ paddingTop: insets.top }}>
        <AppText raw variant="heading4" weight="bold" className="mb-2">
          {t('PD_SERVER_ERROR')}
        </AppText>
        <AppText raw variant="bodySmall" color="muted" className="mb-4">
          {t('PD_SERVER_ERROR_DESC')}
        </AppText>
        <AppButton variant="outline" onPress={() => productQuery.refetch()}>
          {t('PD_RETRY')}
        </AppButton>
        <AppButton variant="ghost" onPress={() => router.back()} className="mt-2">
          {t('PD_GO_BACK')}
        </AppButton>
      </View>
    );
  }

  // ─── Success render ────────────────────────────────────────────────────────
  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-background">
        {/* Header overlay */}
        <View
          className="absolute left-0 right-0 z-10 flex-row items-center justify-between px-4 py-3"
          style={{ paddingTop: insets.top + 4 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="rounded-full bg-background/70 p-2"
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-row gap-2">
            <WishlistButton
              inWishlist={inWishlist}
              onToggle={handleToggleWishlist}
              loading={toggleWishlist.isPending}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <ImageGallery images={product.images.length > 0 ? product.images : [product.image]} />

          <ProductInfo product={product} />

          {isOutOfStock ? (
            <View className="mx-4 mt-3 rounded-lg p-3" style={{ backgroundColor: colors.neutrals800 }}>
              <AppText raw variant="bodySmall" weight="bold" color="error">
                {t('PD_OUT_OF_STOCK')}
              </AppText>
            </View>
          ) : (
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={product.quantity}
            />
          )}

          <View className="mt-2" style={{ height: 8, backgroundColor: colors.neutrals800 }} />

          <ProductDescription description={product.description} />

          <View style={{ height: 8, backgroundColor: colors.neutrals800 }} />

          <ReviewSection
            reviews={reviews}
            stats={reviewStats}
            hasNextPage={!!reviewsQuery.hasNextPage}
            onLoadMore={() => reviewsQuery.fetchNextPage()}
            onWriteReview={() => reviewFormRef.current?.present()}
            onToggleLike={(id) => toggleReviewLike.mutate(id)}
          />

          <View style={{ height: 8, backgroundColor: colors.neutrals800 }} />
          <QASection
            questions={questions}
            hasNextPage={!!questionsQuery.hasNextPage}
            onLoadMore={() => questionsQuery.fetchNextPage()}
            onAskQuestion={() => questionFormRef.current?.present()}
            onAnswerQuestion={handleOpenAnswer}
            onToggleLike={(id) => likeQuestion.mutate(id)}
          />

          {relatedProducts.length > 0 && (
            <>
              <View style={{ height: 8, backgroundColor: colors.neutrals800 }} />
              <RelatedProducts products={relatedProducts} />
            </>
          )}
        </ScrollView>

        <StickyBottomBar
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          disabled={isOutOfStock}
          addToCartLoading={addToCart.isPending}
          buyNowLoading={buyNow.isPending}
        />

        {/* Bottom sheets */}
        <ReviewForm
          bottomSheetRef={reviewFormRef}
          onSubmit={handleSubmitReview}
          loading={createReview.isPending}
        />
        <QuestionForm
          mode="ask"
          bottomSheetRef={questionFormRef}
          onSubmit={handleSubmitQuestion}
          loading={askQuestion.isPending}
        />
        <QuestionForm
          mode="answer"
          questionContext={answerContext}
          bottomSheetRef={answerFormRef}
          onSubmit={handleSubmitAnswer}
          loading={answerQuestion.isPending}
        />
      </View>
    </BottomSheetModalProvider>
  );
}
