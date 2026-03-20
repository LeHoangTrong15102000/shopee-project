import React from 'react';
import { View, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { formatPrice, getDiscountPercent } from '@/utils/price';
import { Product } from '@/services/product.api';

const CARD_GAP = 8;
const CARD_PADDING = 16;
const CARD_WIDTH = (Dimensions.get('window').width - CARD_PADDING * 2 - CARD_GAP) / 2;

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const colors = useColors();
  const router = useRouter();
  const discount = getDiscountPercent(product.price, product.price_before_discount);
  const hasDiscount = discount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product._id}`)}
      accessibilityRole="button"
      accessibilityLabel={`View ${product.name}`}
      style={{ width: CARD_WIDTH }}
      className="overflow-hidden rounded-lg bg-neutrals900"
    >
      <View style={{ width: CARD_WIDTH, height: CARD_WIDTH, position: 'relative' }}>
        <Image
          source={{ uri: product.image }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {hasDiscount && (
          <View className="absolute right-0 top-0 rounded-bl-lg bg-primary px-1.5 py-0.5">
            <AppText raw variant="labelSmall" style={{ color: '#fff', fontSize: 11 }}>
              -{discount}%
            </AppText>
          </View>
        )}
      </View>

      <View className="gap-1 p-2">
        <AppText raw variant="bodySmall" numberOfLines={2} className="leading-tight">
          {product.name}
        </AppText>

        <View className="flex-row items-center gap-2">
          <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.primary }}>
            {formatPrice(product.price)}
          </AppText>
          {hasDiscount && (
            <AppText
              raw
              variant="labelSmall"
              color="muted"
              style={{ textDecorationLine: 'line-through' }}>
              {formatPrice(product.price_before_discount)}
            </AppText>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-0.5">
            <Star size={12} color={colors.warning} fill={colors.warning} />
            <AppText raw variant="labelSmall" color="muted">
              {product.rating.toFixed(1)}
            </AppText>
          </View>
          <AppText raw variant="labelSmall" color="muted">
            {product.sold > 1000
              ? `${(product.sold / 1000).toFixed(1)}k sold`
              : `${product.sold} sold`}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export { CARD_WIDTH, CARD_GAP, CARD_PADDING };