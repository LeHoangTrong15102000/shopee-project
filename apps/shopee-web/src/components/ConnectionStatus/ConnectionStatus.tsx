import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AppContext } from 'src/contexts/app.context'
import useSocket from 'src/hooks/useSocket'
import Button from 'src/components/Button'

export default function ConnectionStatus() {
  const { t } = useTranslation('common')
  const { isAuthenticated } = useContext(AppContext)
  const { connectionStatus, connect } = useSocket()

  if (!isAuthenticated) {
    return null
  }

  if (connectionStatus === 'connected') {
    return null
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className='fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-yellow-100 py-2 text-sm text-yellow-800'>
        <span className='relative flex h-3 w-3'>
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75'></span>
          <span className='relative inline-flex h-3 w-3 rounded-full bg-yellow-500'></span>
        </span>
        <span>{t('status.connecting')}</span>
      </div>
    )
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className='fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-red-100 py-2 text-sm text-red-800'>
        <span className='relative flex h-3 w-3'>
          <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500'></span>
        </span>
        <span>{t('status.disconnected')}</span>
        <Button variant='danger' size='sm' animated={false} onClick={() => connect()} className='ml-2 rounded-sm'>
          {t('connection.reconnect')}
        </Button>
      </div>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <div className='fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 bg-red-100 py-2 text-sm text-red-800'>
        <span className='relative flex h-3 w-3'>
          <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500'></span>
        </span>
        <span>{t('connection.error')}</span>
        <Button variant='danger' size='sm' animated={false} onClick={() => connect()} className='ml-2 rounded-sm'>
          {t('button.retry')}
        </Button>
      </div>
    )
  }

  return null
}
