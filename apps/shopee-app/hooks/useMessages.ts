import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getMessages } from '@/apis/chat.api'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/types/chat.type'

export function useMessages(conversationId: string) {
  const messageBuffer = useChatStore((state) => state.messageBuffer[conversationId] ?? [])

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
  })

  // Merge react-query history with in-memory socket buffer, deduplicated by _id
  const messages = useMemo(() => {
    const historical: Message[] = query.data?.pages.flatMap((p) => p.data) ?? []
    const allById = new Map<string, Message>()
    for (const m of historical) allById.set(m._id, m)
    for (const m of messageBuffer) allById.set(m._id, m)
    return Array.from(allById.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [query.data, messageBuffer])

  return { ...query, messages }
}
