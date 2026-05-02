import { useState, useRef, useId, useEffect, type ElementType } from 'react'
import {
  useFloating,
  useFloatingRootContext,
  useHover,
  useClick,
  useDismiss,
  useInteractions,
  safePolygon,
  FloatingPortal,
  arrow,
  shift,
  offset,
  flip,
  useMergeRefs,
  autoUpdate,
  type Placement,
  type OpenChangeReason,
} from '@floating-ui/react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  renderPopover: React.ReactNode
  className?: string
  as?: ElementType // custom thẻ khi user muốn một thẻ span thay vì div
  initialOpen?: boolean // ban đầu mình có muốn mở popover hay không
  placement?: Placement
  enableArrow?: boolean
  role?: string
  tabIndex?: number
  popoverLabel?: string
  ariaLabel?: string
}

const Popover = ({
  children,
  enableArrow = true, // mặc đinh sẽ cho nó là true
  className,
  renderPopover,
  as: Element = 'div',
  initialOpen,
  placement = 'bottom-end',
  role: triggerRole,
  tabIndex: triggerTabIndex,
  popoverLabel,
  ariaLabel,
}: Props) => {
  const [isOpen, setIsOpen] = useState(initialOpen || false)
  const openedViaKeyboard = useRef(false)
  const returnFocusOnClose = useRef(false)
  const floatingRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const popoverId = `popover-content-${id}`
  const prefersReducedMotion = useReducedMotion()
  const arrowRef = useRef<HTMLElement>(null)

  // Manage reference and floating elements as state for useFloatingRootContext
  const [referenceEl, setReferenceEl] = useState<Element | null>(null)
  const [floatingEl, setFloatingEl] = useState<HTMLElement | null>(null)

  const handleOpenChange = (open: boolean, event?: Event, reason?: OpenChangeReason) => {
    // Detect keyboard-triggered opens: useClick fires 'click' reason for keyboard events
    if (open && reason === 'click' && event instanceof KeyboardEvent) {
      openedViaKeyboard.current = true
    }
    // Return focus to trigger when dismissed via Escape key
    if (!open && reason === 'escape-key') {
      returnFocusOnClose.current = true
    }
    setIsOpen(open)
  }

  const rootContext = useFloatingRootContext({
    open: isOpen,
    onOpenChange: handleOpenChange,
    elements: { reference: referenceEl, floating: floatingEl },
  })

  const { x, y, refs, strategy, middlewareData, context } = useFloating({
    rootContext,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
      }),
    ],
    placement: placement,
    whileElementsMounted: autoUpdate,
  })

  // Built-in hover interaction — safePolygon handles the gap between trigger and popup
  const hover = useHover(context, {
    delay: { open: 0, close: 150 },
    handleClose: safePolygon({ blockPointerEvents: false }),
  })

  // Handle click and keyboard (Enter/Space) opens — ignoreMouse so hover keeps priority for mouse,
  // but keyboard (Enter/Space) and touch taps still open the popover
  const click = useClick(context)

  // Built-in dismiss — handles click-outside (mousedown) and Escape key
  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss])

  // Merge refs: floating-ui's setFloating + our local floatingRef for focus management
  const mergedFloatingRef = useMergeRefs([
    refs.setFloating,
    floatingRef,
    (el: HTMLElement | null) => setFloatingEl(el),
  ])

  // Merge refs: floating-ui's setReference + our state setter for useFloatingRootContext
  const mergedReferenceRef = useMergeRefs([
    refs.setReference,
    (el: Element | null) => setReferenceEl(el),
  ])

  // Focus first focusable element when opened via keyboard; return focus on Escape close
  useEffect(() => {
    if (isOpen && openedViaKeyboard.current && floatingRef.current) {
      const focusable = floatingRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable) {
        focusable.focus()
      } else {
        // Fallback for info-only dialogs (e.g., ShopeeProtectionPopupContent with tabIndex={-1})
        const fallback = floatingRef.current.querySelector<HTMLElement>('[tabindex="-1"]')
        if (fallback) fallback.focus()
      }
      openedViaKeyboard.current = false
    }
    if (!isOpen) {
      openedViaKeyboard.current = false
      // Return focus to reference element when dismissed via Escape
      if (returnFocusOnClose.current) {
        returnFocusOnClose.current = false
        const referenceNode = refs.reference.current
        if (referenceNode && 'focus' in referenceNode) {
          ;(referenceNode as HTMLElement).focus()
        }
      }
    }
  }, [isOpen, refs.reference])

  // Dùng kĩ thuật render Props, truyền vào cái props 1 dạng function component

  return (
    <Element
      className={className}
      ref={mergedReferenceRef}
      {...getReferenceProps()}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls={isOpen ? popoverId : undefined}
      {...(triggerRole ? { role: triggerRole } : {})}
      {...(triggerTabIndex !== undefined ? { tabIndex: triggerTabIndex } : {})}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
    >
      {children}
      <FloatingPortal id={id}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={mergedFloatingRef}
              id={popoverId}
              role="dialog"
              aria-label={popoverLabel}
              {...getFloatingProps()}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                width: 'max-content',
                transformOrigin: `${middlewareData.arrow?.x}px top`,
                zIndex: 50,
              }}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            >
              {enableArrow && (
                <span
                  ref={arrowRef}
                  className="absolute -top-[9px] z-10"
                  style={{
                    left: middlewareData.arrow?.x,
                  }}
                >
                  {/* Outer triangle (border effect) */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 border-[11px] border-x-transparent border-t-transparent border-b-gray-200 dark:border-b-slate-600"
                    style={{ top: '-11px' }}
                    aria-hidden="true"
                  />
                  {/* Inner triangle (white fill) */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 border-[10px] border-x-transparent border-t-transparent border-b-white dark:border-b-slate-800"
                    style={{ top: '-9px' }}
                    aria-hidden="true"
                  />
                </span>
              )}
              {renderPopover}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </Element>
  )
}

export default Popover
