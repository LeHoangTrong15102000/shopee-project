import React, { useState } from 'react'
import { View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Plus } from 'lucide-react-native'
import { useColors } from '@/hooks/useColors'
import EmptyState from '@/components/ui/EmptyState'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import {
  useAiConversations,
  useCreateConversation,
  useDeleteConversation,
} from '@/hooks/useAiConversations'
import ConversationListItem from '@/components/ai-chat/ConversationListItem'

function ConversationSkeletonList() {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ gap: 8 }}>
          <SkeletonLoader width="60%" height={16} borderRadius={4} />
          <SkeletonLoader width="90%" height={13} borderRadius={4} />
          <SkeletonLoader width={80} height={11} borderRadius={4} />
        </View>
      ))}
    </View>
  )
}

export default function AiChatListScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const [creatingMessage] = useState('Hello')

  const { data: conversations, isLoading, refetch, isRefetching } = useAiConversations()
  const createConversation = useCreateConversation()
  const deleteConversation = useDeleteConversation()

  const handleNewChat = () => {
    createConversation.mutate(
      { message: creatingMessage },
      {
        onSuccess: (data) => {
          router.push(`/ai-chat/${data._id}`)
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    Alert.alert(t('aiChat.list.deleteAction'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => deleteConversation.mutate(id),
      },
    ])
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('aiChat.header.title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleNewChat}
              disabled={createConversation.isPending}
              accessibilityRole="button"
              accessibilityLabel={t('aiChat.header.newChat')}
              style={{ marginRight: 4 }}>
              {createConversation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Plus size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {isLoading ? (
          <ConversationSkeletonList />
        ) : (
          <FlatList
            data={conversations ?? []}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ConversationListItem
                conversation={item}
                onPress={() => router.push(`/ai-chat/${item._id}`)}
                onDelete={() => handleDelete(item._id)}
              />
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.neutrals800 }}
              />
            )}
            onRefresh={refetch}
            refreshing={isRefetching}
            ListEmptyComponent={
              <EmptyState
                icon={MessageSquare}
                message={t('aiChat.list.emptyTitle')}
                actionLabel={t('aiChat.header.newChat')}
                onAction={handleNewChat}
              />
            }
          />
        )}
      </SafeAreaView>
    </>
  )
}
