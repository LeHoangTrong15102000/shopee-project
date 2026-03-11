import { useState, useRef, useId, useEffect, useCallback, type ElementType } from 'react';
import {
  useFloating,
  FloatingPortal,
  arrow,
  shift,
  offset,
  flip,
  useMergeRefs,
  type Placement,
} from '@floating-ui/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  renderPopover: React.ReactNode;
  className?: string;
  as?: ElementType; // custom thẻ khi user muốn một thẻ span thay vì div
  initialOpen?: boolean; // ban đầu mình có muốn mở popover hay không
  placement?: Placement;
  enableArrow?: boolean;
  role?: string;
  tabIndex?: number;
  popoverLabel?: string;
  ariaLabel?: string;
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
  const [isOpen, setIsOpen] = useState(initialOpen || false);
  const openedViaKeyboard = useRef(false);
  const justOpenedViaHover = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const popoverId = `popover-content-${id}`;
  const prefersReducedMotion = useReducedMotion();
  const arrowRef = useRef<HTMLElement>(null);
  const { x, y, refs, strategy, middlewareData } = useFloating({
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 }),
      arrow({
        element: arrowRef,
      }),
    ],
    placement: placement,
  });

  const mergedFloatingRef = useMergeRefs([refs.setFloating, floatingRef]);

  const showPopover = useCallback(() => {
    // Cancel any pending hide when mouse re-enters trigger or popup
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    justOpenedViaHover.current = true;
    setIsOpen(true);
    // Reset after a tick so the subsequent click event sees it as stale
    requestAnimationFrame(() => {
      justOpenedViaHover.current = false;
    });
  }, []);

  const hidePopover = useCallback(() => {
    // Delay hide to allow mouse to travel from trigger to popup (or vice versa)
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      hideTimeoutRef.current = null;
    }, 150);
  }, []);

  const togglePopover = useCallback(() => {
    // Skip toggle if mouseenter just opened the popover (touch device tap fires both)
    if (justOpenedViaHover.current) return;
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        // Return focus to trigger element
        if (refs.reference.current && 'focus' in refs.reference.current) {
          (refs.reference.current as HTMLElement).focus();
        }
      }
    },
    [isOpen, refs.reference],
  );

  const handleTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openedViaKeyboard.current = true;
      setIsOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Cleanup hide timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Focus first focusable element when opened via keyboard; reset ref on close
  useEffect(() => {
    if (isOpen && openedViaKeyboard.current && floatingRef.current) {
      const focusable = floatingRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable) {
        focusable.focus();
      } else {
        // Fallback for info-only dialogs (e.g., ShopeeProtectionPopupContent with tabIndex={-1})
        const fallback = floatingRef.current.querySelector<HTMLElement>('[tabindex="-1"]');
        if (fallback) fallback.focus();
      }
      openedViaKeyboard.current = false;
    }
    if (!isOpen) {
      openedViaKeyboard.current = false;
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const reference = refs.reference.current as HTMLElement | null;
      const floating = floatingRef.current;
      if (reference?.contains(target) || floating?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, refs.reference]);

  // Dùng kĩ thuật render Props, truyền vào cái props 1 dạng function component

  return (
    <Element
      className={className}
      ref={refs.setReference}
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
      onClick={togglePopover}
      onKeyDown={handleTriggerKeyDown}
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
              onMouseEnter={showPopover}
              onMouseLeave={hidePopover}
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
              {/* Invisible hover bridge — fills the gap between trigger and popup so mouse doesn't lose contact */}
              <div
                className="absolute left-0 right-0 h-3"
                style={{ top: '-12px' }}
                aria-hidden="true"
              />
              {enableArrow && (
                <span
                  ref={arrowRef}
                  className="absolute -top-[10px] z-10"
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
  );
};

export default Popover;
