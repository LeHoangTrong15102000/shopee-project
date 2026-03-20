import React from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { formatPrice, getDiscountPercent } from '@/utils/price';
import type { ProductDetail } from '@/apis/product-detail.api';

interface ProductInfoProps {
  product: ProductDetail;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const discount = getDiscountPercent(product.price, product.price_before_discount);
  const hasDiscount = discount > 0;

  const soldText =
    product.sold > 1000
      ? t('PD_SOLD_K', { count: (product.sold / 1000).toFixed(1) })
      : t('PD_SOLD', { count: product.sold });

  return (
    <View className="gap-2 px-4 py-3">
      {/* Price row */}
      <View className="flex-row items-center gap-2">
        <AppText raw variant="heading2" weight="bold" style={{ color: colors.primary }}>
          {formatPrice(product.price)}
        </AppText>
        {hasDiscount && (
          <>
            <AppText
              raw
              variant="bodySmall"
              color="muted"
              style={{ textDecorationLine: 'line-through' }}>
              {formatPrice(product.price_before_discount)}
            </AppText>
            <View className="rounded bg-primary/10 px-1.5 py-0.5">
              <AppText raw variant="labelSmall" style={{ color: colors.primary }}>
                -{discount}%
              </AppText>
            </View>
          </>
        )}
      </View>

      {/* Product name */}
      <AppText raw variant="body" weight="medium" numberOfLines={3}>
        {product.name}
      </AppText>

      {/* Rating, sold, stock */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Star size={14} color={colors.warning} fill={colors.warning} />
          <AppText raw variant="bodySmall" weight="medium">
            {product.rating.toFixed(1)}
          </AppText>
        </View>
        <AppText raw variant="bodySmall" color="muted">
          {soldText}
        </AppText>
        <AppText raw variant="bodySmall" color="muted">
          {t('PD_IN_STOCK', { count: product.quantity })}
        </AppText>
      </View>
    </View>
  );
}
