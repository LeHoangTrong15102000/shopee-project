import { useState, useRef, useId, useEffect, useCallback, type ElementType } from 'react'
import { useFloating, FloatingPortal, arrow, shift, offset, type Placement } from '@floating-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  children: React.ReactNode
  renderPopover: React.ReactNode
  className?: string
  as?: ElementType // custom thẻ khi user muốn một thẻ span thay vì div
  initialOpen?: boolean // ban đầu mình có muốn mở popover hay không
  placement?: Placement
  enableArrow?: boolean
}

const Popover = ({
  children,
  enableArrow = true, // mặc đinh sẽ cho nó là true
  className,
  renderPopover,
  as: Element = 'div',
  initialOpen,
  placement = 'bottom-end'
}: Props) => {
  const [isOpen, setIsOpen] = useState(initialOpen || false)
  const id = useId()
  const arrowRef = useRef<HTMLElement>(null)
  const { x, y, refs, strategy, middlewareData } = useFloating({
    middleware: [
      offset(6),
      shift(),
      arrow({
        element: arrowRef
      })
    ],
    placement: placement
  })

  const showPopover = () => {
    setIsOpen(true)
  }
  const hidePopover = () => {
    setIsOpen(false)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        hidePopover()
        // Return focus to trigger element
        if (refs.reference.current && 'focus' in refs.reference.current) {
          ;(refs.reference.current as HTMLElement).focus()
        }
      }
    },
    [isOpen, refs.reference]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Dùng kĩ thuật render Props, truyền vào cái props 1 dạng function component

  return (
    <Element
      className={className}
      ref={refs.setReference}
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
      aria-expanded={isOpen}
      aria-haspopup='true'
    >
      {children}
      {/* <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='h-5 w-5'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'
        />
      </svg>
      <span className='mx-1 text-sm'>Tiếng Việt</span>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='h-5 w-5'
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' />
      </svg> */}
      <FloatingPortal id={id}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                width: 'max-content',
                transformOrigin: `${middlewareData.arrow?.x}px top`, // nơi đầu khi transform
                zIndex: 50
              }}
              initial={{ opacity: 0, transform: 'scale(0)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={{ opacity: 0, transform: 'scale(0)' }}
              transition={{ duration: 0.2 }}
            >
              {enableArrow && (
                <span
                  ref={arrowRef}
                  className='absolute z-1 translate-y-[-95%] border-11 border-x-transparent border-t-transparent border-b-white dark:border-b-slate-800'
                  style={{
                    left: middlewareData.arrow?.x,
                    top: middlewareData.arrow?.y
                  }}
                ></span>
              )}
              {/* Render popover */}
              {/* <div className='relative rounded-xs border border-gray-200 bg-white shadow-md'>
                <div className='flex flex-col py-2 px-3'>
                  <button className='py-2 px-2 hover:text-orange'>Tiếng Việt</button>
                  <button className='py-2 px-2 hover:text-orange'>English</button>
                </div>
              </div> */}
              {renderPopover}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </Element>
  )
}

export default Popover
