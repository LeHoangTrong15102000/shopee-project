import React, { useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';

interface WishlistButtonProps {
  inWishlist: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export default function WishlistButton({ inWishlist, onToggle, loading }: WishlistButtonProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const lastTapRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={inWishlist ? t('PD_REMOVE_FROM_WISHLIST') : t('PD_ADD_TO_WISHLIST')}
      accessibilityState={{ selected: inWishlist }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="items-center justify-center rounded-full bg-background/70 p-2">
      <Heart
        size={22}
        color={inWishlist ? colors.primary : colors.foreground}
        fill={inWishlist ? colors.primary : 'transparent'}
      />
    </TouchableOpacity>
  );
}
