import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import classNames from 'classnames'
import Button from 'src/components/Button'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  image?: string
  className?: string
}

type SharePlatform = 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'zalo' | 'copy'

interface ShareOption {
  id: SharePlatform
  name: string
  color: string
  icon: React.ReactNode
}

const ShareButton = memo(function ShareButton({
  url,
  title,
  description: _description = '',
  image: _image = '',
  className
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareOptions: ShareOption[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      color: 'hover:bg-[#1877f2]/10 text-[#1877f2]',
      icon: (
        <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
        </svg>
      )
    },
    {
      id: 'twitter',
      name: 'Twitter',
      color: 'hover:bg-[#1da1f2]/10 text-[#1da1f2]',
      icon: (
        <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
        </svg>
      )
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      color: 'hover:bg-[#25d366]/10 text-[#25d366]',
      icon: (
        <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
        </svg>
      )
    },
    {
      id: 'telegram',
      name: 'Telegram',
      color: 'hover:bg-[#0088cc]/10 text-[#0088cc]',
      icon: (
        <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
          <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' />
        </svg>
      )
    },
    {
      id: 'zalo',
      name: 'Zalo',
      color: 'hover:bg-[#0068ff]/10 text-[#0068ff]',
      icon: (
        <svg className='h-5 w-5' viewBox='0 0 48 48' fill='currentColor'>
          <path d='M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm-5.5 25.5h-3v-11h3v11zm10 0h-3v-6.5l-4 6.5h-1v-11h3v6.5l4-6.5h1v11zm7 0h-5v-11h5c1.93 0 3.5 1.57 3.5 3.5v4c0 1.93-1.57 3.5-3.5 3.5zm0-8.5h-2v5.5h2c.55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z' />
        </svg>
      )
    },
    {
      id: 'copy',
      name: 'Copy Link',
      color: 'hover:bg-gray-100 text-gray-600',
      icon: (
        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
          />
        </svg>
      )
    }
  ]

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      const shareUrls: Record<SharePlatform, string | (() => Promise<void>)> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        zalo: `https://sp.zalo.me/share_inline?d=${encodedUrl}`,
        copy: async () => {
          await navigator.clipboard.writeText(url)
          toast.success('Đã copy link sản phẩm!', { autoClose: 2000, position: 'top-center' })
        }
      }

      const action = shareUrls[platform]
      if (typeof action === 'function') {
        await action()
      } else {
        window.open(action, '_blank', 'width=600,height=400,scrollbars=yes')
      }
      setIsOpen(false)
    },
    [encodedUrl, encodedTitle, url]
  )

  return (
    <div ref={dropdownRef} className={classNames('relative inline-block', className)}>
      {/* Share Button */}
      <Button
        animated={false}
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 rounded-xs border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700'
        ariaLabel='Chia sẻ sản phẩm'
        aria-expanded={isOpen}
      >
        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
          />
        </svg>
        <span className='hidden sm:inline'>Chia sẻ</span>
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className='absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800'
          >
            <div className='py-1'>
              {shareOptions.map((option) => (
                <Button
                  key={option.id}
                  animated={false}
                  onClick={() => handleShare(option.id)}
                  className={classNames(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    option.color
                  )}
                >
                  {option.icon}
                  <span>{option.name}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default ShareButton
