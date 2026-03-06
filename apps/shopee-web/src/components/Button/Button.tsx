import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import { Link } from 'react-router'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'icon' | 'text'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type ButtonShape = 'default' | 'rounded' | 'pill'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-orange text-white hover:bg-orange/90',
  secondary:
    'bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700',
  outline: 'border border-orange text-orange bg-transparent hover:bg-orange/5',
  icon: 'rounded-full p-2 bg-transparent',
  text: 'bg-transparent'
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-3 py-1 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

const shapeClasses: Record<ButtonShape, string> = {
  default: 'rounded-sm',
  rounded: 'rounded-md',
  pill: 'rounded-full'
}

const focusClasses: Record<ButtonVariant, string> = {
  primary: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange',
  danger: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange',
  outline: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange',
  secondary:
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:focus-visible:outline-gray-500',
  ghost:
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:focus-visible:outline-gray-500',
  icon: 'focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
  text: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:focus-visible:outline-gray-500'
}

interface BaseButtonProps {
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
  ariaLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  animated?: boolean
}

interface ButtonAsButton extends BaseButtonProps, ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button'
  to?: never
}

interface ButtonAsLink extends BaseButtonProps {
  as: 'link'
  to: string
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

type ButtonProps = ButtonAsButton | ButtonAsLink

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const { className, isLoading, children, ariaLabel, variant, size, shape, animated = true, ...rest } = props

  const getClassName = (addHoverTransition = false) => {
    const classes: string[] = ['outline-hidden focus:outline-hidden']
    // Per-variant focus classes, or default orange outline
    if (variant) {
      classes.push(focusClasses[variant])
    } else {
      classes.push('focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange')
    }
    if (variant) {
      classes.push(variantClasses[variant])
    }
    if (size) {
      classes.push(sizeClasses[size])
    }
    if (shape) {
      classes.push(shapeClasses[shape])
    }
    if (className) {
      classes.push(className)
    }
    const isDisabledState = ('disabled' in rest && rest.disabled) || isLoading
    if (isDisabledState) {
      classes.push('cursor-not-allowed opacity-70')
    }
    if (addHoverTransition) {
      classes.push('transition-all duration-150')
      if (!isDisabledState) {
        classes.push('hover:scale-[1.02] active:scale-[0.98]')
      }
    }
    return classes.join(' ').trim()
  }

  // Render as Link when as='link'
  if (props.as === 'link') {
    const { to, ...linkRest } = rest as ButtonAsLink
    return (
      <Link
        to={to}
        className={getClassName(animated)}
        data-testid='link'
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...linkRest}
      >
        {isLoading && (
          <svg
            aria-hidden='true'
            className='mr-2 h-4 w-4 animate-spin fill-white text-gray-200'
            viewBox='0 0 100 101'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
              fill='currentColor'
            />
            <path
              d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
              fill='currentFill'
            />
          </svg>
        )}
        {children}
      </Link>
    )
  }

  // Render as button (default)
  const { disabled, ...buttonRest } = rest as ButtonAsButton
  const isDisabled = disabled || isLoading

  return (
    <button
      type='button'
      className={getClassName(animated)}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...buttonRest}
    >
      {isLoading && (
        <svg
          aria-hidden='true'
          className='mr-2 h-4 w-4 animate-spin fill-white text-gray-200'
          viewBox='0 0 100 101'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
            fill='currentColor'
          />
          <path
            d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
            fill='currentFill'
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
