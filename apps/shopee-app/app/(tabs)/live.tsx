import React from 'react'
import { FlatList, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Video as VideoIcon } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useLiveStreams } from '@/hooks/useLiveStreams'
import LiveStreamCard from '@/components/live/LiveStreamCard'
import { LiveStream } from '@/types/live.type'

function SkeletonCard() {
  const colors = useColors()
  return (
    <View style={{ flex: 1, margin: 6 }}>
      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutrals800 }}>
        <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.neutrals700 }} />
        <View style={{ padding: 8, gap: 6 }}>
          <View
            style={{
              height: 12,
              borderRadius: 4,
              backgroundColor: colors.neutrals700,
              width: '80%',
            }}
          />
          <View
            style={{
              height: 10,
              borderRadius: 4,
              backgroundColor: colors.neutrals700,
              width: '50%',
            }}
          />
        </View>
      </View>
    </View>
  )
}

function LoadingSkeleton() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 6 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ width: '50%' }}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  const colors = useColors()
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 16,
      }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <VideoIcon size={40} color={colors.primary} />
      </View>
      <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
        {t('live.empty')}
      </AppText>
    </View>
  )
}

export default function LiveScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { data: streams, isLoading } = useLiveStreams()

  const renderItem = ({ item }: { item: LiveStream }) => <LiveStreamCard stream={item} />

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <AppText variant="heading2" weight="semibold" style={{ color: colors.foreground }} raw>
          {t('live.title')}
        </AppText>
      </View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !streams || streams.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={streams}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 6 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}
