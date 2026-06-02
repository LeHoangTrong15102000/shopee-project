import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Badge } from 'src/components/ui/badge'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { ConfirmDialog } from 'src/components/shared/ConfirmDialog'
import { useConversation, useDeleteConversation } from 'src/hooks/useConversations'
import { ROUTES } from 'src/constants/routes'

export default function ConversationDetailPage() {
  const { t } = useTranslation('conversations')
  const { id } = useParams()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: conversation, isLoading, isError } = useConversation(id)
  const deleteMut = useDeleteConversation(() => {
    setDeleteOpen(false)
    navigate(ROUTES.CONVERSATIONS)
  })

  if (isLoading) return <LoadingState />
  if (isError || !conversation) return <ErrorState message={t('notFound')} />

  const messages = conversation.messages ?? []

  const user = conversation.user
  const userName = typeof user === 'object' ? user.name || user.email : String(user).slice(-8)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('detail.title', { id: conversation._id.slice(-8) })}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.CONVERSATIONS)}>
              <ArrowLeft className="mr-2 size-4" />
              {t('detail.backToList')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 size-4" />
              {t('actions.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4 text-sm">
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.metadata.user')}</p>
          <p className="font-medium">{userName}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.metadata.messageCount')}</p>
          <p className="font-medium">{conversation.message_count ?? messages.length}</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.metadata.createdAt')}</p>
          <p className="font-medium">
            {format(new Date(conversation.createdAt), 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-muted-foreground">{t('detail.metadata.lastActivity')}</p>
          <p className="font-medium">
            {conversation.lastActivity
              ? format(new Date(conversation.lastActivity), 'MMM d, yyyy HH:mm')
              : '—'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('detail.messages')}</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('detail.noMessages')}</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={msg._id ?? i}
                  className={`flex flex-col gap-1 rounded-lg p-3 text-sm ${
                    msg.sender_type === 'user' ? 'bg-muted' : 'bg-primary/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize text-xs">
                      {t(`senderType.${msg.sender_type}`, { defaultValue: msg.sender_type })}
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('toast.deleteTitle')}
        description={t('toast.deleteDescription')}
        onConfirm={() => id && deleteMut.mutate(id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
