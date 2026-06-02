import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowLeft, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import shopChatApi from 'src/apis/shop-chat.api'
import type { ShopConversation } from 'src/types/shop-chat.types'
import { ROUTES } from 'src/constants/routes'

export default function ShopChatDetailPage() {
  const { t } = useTranslation('shop-chat')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Conversation metadata may be passed via navigation state from the list page
  const convFromState = (location.state as { conversation?: ShopConversation } | null)?.conversation

  // Fallback: fetch conversation metadata when navigated directly via URL
  const { data: convFromFetch, isLoading: isConvLoading } = useQuery({
    queryKey: ['admin-shop-conversation', id],
    queryFn: () => shopChatApi.getConversationById(id!).then((r) => r.data.data),
    enabled: !!id && !convFromState,
  })

  const conv = convFromState ?? convFromFetch

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-shop-messages', id],
    queryFn: () =>
      shopChatApi.getConversationMessages(id!, undefined, 100).then((r) => r.data.data),
    enabled: !!id,
  })

  const isLoading = isMessagesLoading || (!convFromState && isConvLoading)

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={t('detail.error')} onRetry={refetch} />

  const messages = messagesData?.messages ?? []

  function getShopName(): string {
    if (!conv) return '—'
    if (typeof conv.shopId === 'object') return conv.shopId.name
    return String(conv.shopId).slice(-8)
  }

  function getUserName(): string {
    if (!conv) return '—'
    if (typeof conv.userId === 'object') {
      return conv.userId.name || conv.userId.email
    }
    return String(conv.userId).slice(-8)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.title', { id: id?.slice(-8) ?? '' })}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SHOP_CHAT)}>
            <ArrowLeft className="mr-2 size-4" />
            {t('detail.backToList')}
          </Button>
        }
      />

      {/* Metadata */}
      <div className="grid gap-3 sm:grid-cols-4 text-sm">
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.shop')}</p>
          <p className="font-medium">{getShopName()}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.user')}</p>
          <p className="font-medium">{getUserName()}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.messageCount')}</p>
          <p className="font-medium">{conv?.message_count ?? messages.length}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.status')}</p>
          <div>
            {conv?.flagged ? (
              <Badge variant="destructive" className="gap-1 text-xs">
                <Flag className="size-3" aria-hidden="true" />
                {t('flagged')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {t('detail.normal')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {conv?.flag_reason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="font-medium text-destructive">{t('detail.flagReason')}: </span>
          <span>{conv?.flag_reason}</span>
        </div>
      )}

      {/* Message thread */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.messages')}</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('noMessages')}</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isShop = msg.senderType === 'shop'
                return (
                  <div key={msg._id} className={`flex ${isShop ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        isShop
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isShop ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
