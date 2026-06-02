import React from 'react'
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { MessageCircle } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useConversations } from '@/hooks/useConversations'
import ConversationItem from '@/components/chat/ConversationItem'
import EmptyState from '@/components/ui/EmptyState'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function ChatListScreen() {
  const colors = useColors()
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations()

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Tin nhắn',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={conversations ?? []}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <ConversationItem conversation={item} />}
            ItemSeparatorComponent={() => (
              <View className="mx-4 h-px" style={{ backgroundColor: colors.neutrals800 }} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState icon={MessageCircle} message="Chưa có cuộc trò chuyện nào" />
            }
          />
        )}
      </SafeAreaView>
    </>
  )
}
