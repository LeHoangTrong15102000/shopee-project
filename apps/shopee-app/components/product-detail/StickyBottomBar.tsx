import React from 'react';
import { View } from 'react-native';
import { ShoppingCart, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';

interface StickyBottomBarProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  disabled?: boolean;
  addToCartLoading?: boolean;
  buyNowLoading?: boolean;
}

export default function StickyBottomBar({
  onAddToCart,
  onBuyNow,
  disabled,
  addToCartLoading,
  buyNowLoading,
}: StickyBottomBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t px-4 pt-3"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: colors.background,
        borderTopColor: colors.neutrals800,
      }}
    >
      <View className="flex-1">
        <AppButton
          variant="outline"
          onPress={onAddToCart}
          disabled={disabled}
          loading={addToCartLoading}
          icon={<ShoppingCart />}
          accessibilityRole="button"
          accessibilityLabel={t('PD_ADD_TO_CART')}
          accessibilityState={{ disabled: !!disabled }}
        >
          {t('PD_ADD_TO_CART')}
        </AppButton>
      </View>
      <View className="flex-1">
        <AppButton
          variant="primary"
          onPress={onBuyNow}
          disabled={disabled}
          loading={buyNowLoading}
          icon={<Zap />}
          accessibilityRole="button"
          accessibilityLabel={t('PD_BUY_NOW')}
          accessibilityState={{ disabled: !!disabled }}
        >
          {t('PD_BUY_NOW')}
        </AppButton>
      </View>
    </View>
  );
}
