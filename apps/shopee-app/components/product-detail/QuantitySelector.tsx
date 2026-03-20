import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  value,
  onChange,
  max,
  disabled,
}: QuantitySelectorProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const isMin = value <= 1;
  const isMax = value >= max;

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <AppText raw variant="body" weight="medium">
        {t('PD_IN_STOCK', { count: max })}
      </AppText>
      <View className="ml-auto flex-row items-center">
        <TouchableOpacity
          onPress={() => !isMin && !disabled && onChange(value - 1)}
          disabled={isMin || disabled}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          accessibilityState={{ disabled: isMin || disabled }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className="items-center justify-center rounded-l-lg"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.neutrals800,
            opacity: isMin || disabled ? 0.4 : 1,
          }}>
          <Minus size={16} color={colors.foreground} />
        </TouchableOpacity>
        <View
          className="items-center justify-center"
          accessibilityRole="text"
          accessibilityLabel={`Quantity: ${value}`}
          style={{
            width: 48,
            height: 36,
            backgroundColor: colors.neutrals800,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.neutrals700,
          }}>
          <AppText raw variant="body" weight="medium">
            {value}
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => !isMax && !disabled && onChange(value + 1)}
          disabled={isMax || disabled}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          accessibilityState={{ disabled: isMax || disabled }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className="items-center justify-center rounded-r-lg"
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.neutrals800,
            opacity: isMax || disabled ? 0.4 : 1,
          }}>
          <Plus size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
