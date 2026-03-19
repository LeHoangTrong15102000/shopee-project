import React from 'react';
import { View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { AppText, AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function InlineError({ message, onRetry }: InlineErrorProps) {
  const colors = useColors();

  return (
    <View className="items-center justify-center gap-3 py-8">
      <AlertCircle size={32} color={colors.error} />
      <AppText raw variant="bodySmall" color="muted" align="center">
        {message}
      </AppText>
      {onRetry && (
        <AppButton size="sm" variant="outline" onPress={onRetry}>
          RETRY
        </AppButton>
      )}
    </View>
  );
}
