import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useConversation } from 'src/hooks/useConversations'
import { ROUTES } from 'src/constants/routes'

export default function ConversationDetailPage() {
  const { t } = useTranslation('conversations')
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: conversation, isLoading, isError } = useConversation(id)

  if (isLoading) return <LoadingState />
  if (isError || !conversation) return <ErrorState message={t('notFound')} />

  const messages = conversation.messages ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.title', { id: conversation._id.slice(-8) })}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.CONVERSATIONS)}
          >
            <ArrowLeft className="mr-2 size-4" />
            {t('detail.backToList')}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.messages')}</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('detail.noMessages')}</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex flex-col gap-1 rounded-lg p-3 text-sm ${
                    msg.sender_type === 'user'
                      ? 'bg-muted'
                      : 'bg-primary/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-xs">
                      {t(`senderType.${msg.sender_type}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
