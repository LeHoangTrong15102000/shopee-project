import { useMemo } from 'react'
import classNames from 'classnames'
import { ProductVariant, ProductVariantCombination } from 'src/types/variant.type'
import Button from 'src/components/Button'

interface ProductVariantSelectorProps {
  variants: ProductVariant[]
  combinations: ProductVariantCombination[]
  selectedValues: { [key: string]: string }
  onSelect: (type: string, value: string) => void
  className?: string
}

export default function ProductVariantSelector({
  variants,
  combinations,
  selectedValues,
  onSelect,
  className
}: ProductVariantSelectorProps) {
  const availableOptions = useMemo(() => {
    const available: { [key: string]: Set<string> } = {}

    variants.forEach((variant) => {
      available[variant.type] = new Set()
    })

    combinations.forEach((combination) => {
      if (combination.quantity <= 0) return

      const isMatchingOtherSelections = Object.entries(selectedValues).every(([type, value]) => {
        if (!combination.variant_values[type]) return true
        return combination.variant_values[type] === value
      })

      if (isMatchingOtherSelections) {
        Object.entries(combination.variant_values).forEach(([type, value]) => {
          if (available[type]) {
            available[type].add(value)
          }
        })
      }
    })

    return available
  }, [variants, combinations, selectedValues])

  const isOptionAvailable = (type: string, value: string): boolean => {
    return availableOptions[type]?.has(value) ?? false
  }

  const isOptionSelected = (type: string, value: string): boolean => {
    return selectedValues[type] === value
  }

  const handleOptionClick = (type: string, value: string) => {
    if (!isOptionAvailable(type, value)) return
    onSelect(type, value)
  }

  const renderColorOption = (variant: ProductVariant) => (
    <div key={variant._id} className='mb-4'>
      <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>{variant.name}</div>
      <div className='flex flex-wrap gap-2'>
        {variant.options.map((option) => {
          const isSelected = isOptionSelected(variant.type, option.value)
          const isAvailable = isOptionAvailable(variant.type, option.value)

          return (
            <div key={option.value} className='group relative'>
              <Button
                animated={false}
                type='button'
                onClick={() => handleOptionClick(variant.type, option.value)}
                disabled={!isAvailable}
                className={classNames('relative h-11 w-11 overflow-hidden rounded-sm border-2 transition-all', {
                  'border-orange': isSelected,
                  'border-gray-300 dark:border-gray-600': !isSelected && isAvailable,
                  'cursor-not-allowed border-gray-200 opacity-50 dark:border-gray-700': !isAvailable
                })}
                aria-label={option.name}
                aria-pressed={isSelected}
              >
                {option.image ? (
                  <img src={option.image} alt={option.name} className='h-full w-full object-cover' />
                ) : (
                  <div
                    className='h-full w-full'
                    style={{ backgroundColor: option.value.toLowerCase() }}
                    aria-hidden='true'
                  />
                )}
                {isSelected && (
                  <div className='absolute right-0 bottom-0'>
                    <svg className='h-4 w-4 text-orange' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M0 11l2-2 5 5L18 3l2 2L7 18z' />
                    </svg>
                  </div>
                )}
              </Button>
              <div className='pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100'>
                {option.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderSizeOption = (variant: ProductVariant) => (
    <div key={variant._id} className='mb-4'>
      <div className='mb-2 text-sm text-gray-500 dark:text-gray-400'>{variant.name}</div>
      <div className='flex flex-wrap gap-2'>
        {variant.options.map((option) => {
          const isSelected = isOptionSelected(variant.type, option.value)
          const isAvailable = isOptionAvailable(variant.type, option.value)

          return (
            <div key={option.value} className='group relative'>
              <Button
                animated={false}
                type='button'
                onClick={() => handleOptionClick(variant.type, option.value)}
                disabled={!isAvailable}
                className={classNames('min-h-[44px] min-w-[50px] rounded-sm border px-3 py-2 text-sm transition-all', {
                  'border-orange bg-orange/10 text-orange': isSelected,
                  'border-gray-300 bg-white text-gray-700 hover:border-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
                    !isSelected && isAvailable,
                  'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600':
                    !isAvailable
                })}
                aria-label={option.name}
                aria-pressed={isSelected}
              >
                {option.name}
              </Button>
              <div className='pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100'>
                {option.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderVariant = (variant: ProductVariant) => {
    if (variant.type === 'color') {
      return renderColorOption(variant)
    }
    return renderSizeOption(variant)
  }

  return (
    <div className={classNames('product-variant-selector', className)}>
      {variants.map((variant) => renderVariant(variant))}
    </div>
  )
}
