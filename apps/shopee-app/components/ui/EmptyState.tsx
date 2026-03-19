import React from 'react';
import { View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: IconComponent, message, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View className="items-center justify-center gap-3 py-12">
      <IconComponent size={48} color={colors.neutrals400} />
      <AppText raw variant="bodySmall" color="muted" align="center">
        {message}
      </AppText>
      {actionLabel && onAction && (
        <AppButton size="sm" variant="primary" onPress={onAction}>
          {actionLabel}
        </AppButton>
      )}
    </View>
  );
}
