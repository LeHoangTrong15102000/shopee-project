import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from 'src/hooks/useFocusTrap';
import { useReducedMotion } from 'src/hooks/useReducedMotion';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  ariaLabelledBy?: string;
}

const BaseModal = ({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabelledBy,
}: BaseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  useFocusTrap({ isOpen, containerRef: modalRef, onClose: closeOnEscape ? onClose : undefined });

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) onClose();
  }, [closeOnBackdrop, onClose]);

  const animationDuration = reducedMotion ? 0 : 0.2;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: animationDuration }}
            className={`fixed inset-0 z-50 bg-black/50 ${overlayClassName}`}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <div className="pointer-events-none fixed inset-0 z-51 flex items-center justify-center">
            <motion.div
              ref={modalRef}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: animationDuration }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ariaLabelledBy}
              className={`pointer-events-auto mx-4 w-full rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 ${className || 'max-w-md'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BaseModal;
