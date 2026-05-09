import React from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Eye } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { LiveStream } from '@/types/live.type'

interface LiveStreamCardProps {
  stream: LiveStream
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  const router = useRouter()
  const colors = useColors()

  return (
    <Pressable
      onPress={() => router.push(`/live/${stream.id}`)}
      style={{ flex: 1, margin: 6 }}
      accessibilityRole="button"
      accessibilityLabel={`${stream.title} - ${stream.streamerName}`}>
      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutrals800 }}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: stream.thumbnailUrl }}
            style={{ width: '100%', aspectRatio: 4 / 3 }}
            contentFit="cover"
          />
          {stream.isLive && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#EF4444',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
              <AppText variant="caption" weight="bold" style={{ color: '#FFFFFF' }} raw>
                LIVE
              </AppText>
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              gap: 4,
            }}>
            <Eye size={12} color="#FFFFFF" />
            <AppText variant="caption" style={{ color: '#FFFFFF' }} raw>
              {stream.viewerCount.toLocaleString()}
            </AppText>
          </View>
        </View>
        <View style={{ padding: 8, gap: 4 }}>
          <AppText variant="caption" weight="semibold" numberOfLines={2} style={{ color: colors.foreground }}>
            {stream.title}
          </AppText>
          <AppText variant="caption" style={{ color: colors.neutrals100 }} numberOfLines={1}>
            {stream.streamerName}
          </AppText>
        </View>
      </View>
    </Pressable>
  )
}