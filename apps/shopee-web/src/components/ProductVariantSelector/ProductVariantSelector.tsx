import { useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ProductVariant, ProductVariantCombination } from 'src/types/variant.type';
import Button from 'src/components/Button';

// Color mapping using Tailwind design tokens - extensible via config
const COLOR_CLASS_MAP: Record<string, string> = {
  red: 'bg-red-500',
  đỏ: 'bg-red-500',
  blue: 'bg-blue-500',
  'xanh dương': 'bg-blue-500',
  green: 'bg-green-500',
  'xanh lá': 'bg-green-500',
  yellow: 'bg-yellow-500',
  vàng: 'bg-yellow-500',
  black: 'bg-gray-900',
  đen: 'bg-gray-900',
  white: 'bg-white border border-gray-300',
  trắng: 'bg-white border border-gray-300',
  pink: 'bg-pink-500',
  hồng: 'bg-pink-500',
  purple: 'bg-purple-500',
  tím: 'bg-purple-500',
  orange: 'bg-orange-500',
  cam: 'bg-orange-500',
  gray: 'bg-gray-500',
  grey: 'bg-gray-500',
  xám: 'bg-gray-500',
};

const getColorClass = (colorValue: string): string => {
  const normalized = colorValue.toLowerCase().trim();
  return COLOR_CLASS_MAP[normalized] || 'bg-gray-200 border border-gray-300';
};

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  combinations: ProductVariantCombination[];
  selectedValues: { [key: string]: string };
  onSelect: (type: string, value: string) => void;
  className?: string;
  showValidationError?: boolean;
}

export default function ProductVariantSelector({
  variants,
  combinations,
  selectedValues,
  onSelect,
  className,
  showValidationError,
}: ProductVariantSelectorProps) {
  const { t } = useTranslation('product');
  const baseId = useId();

  const getAriaLabel = (optionName: string, isSelected: boolean, isAvailable: boolean): string => {
    let label = optionName;
    if (isSelected) label += `, ${t('variant.selected')}`;
    if (!isAvailable) label += `, ${t('variant.outOfStockOption')}`;
    return label;
  };

  const availableOptions = useMemo(() => {
    const available: { [key: string]: Set<string> } = {};

    variants.forEach((variant) => {
      available[variant.type] = new Set();
    });

    combinations.forEach((combination) => {
      if (combination.quantity <= 0) return;

      const isMatchingOtherSelections = Object.entries(selectedValues).every(([type, value]) => {
        if (!combination.variant_values[type]) return true;
        return combination.variant_values[type] === value;
      });

      if (isMatchingOtherSelections) {
        Object.entries(combination.variant_values).forEach(([type, value]) => {
          if (available[type]) {
            available[type].add(value);
          }
        });
      }
    });

    return available;
  }, [variants, combinations, selectedValues]);

  const isOptionAvailable = (type: string, value: string): boolean => {
    return availableOptions[type]?.has(value) ?? false;
  };

  const isOptionSelected = (type: string, value: string): boolean => {
    return selectedValues[type] === value;
  };

  const handleOptionClick = (type: string, value: string) => {
    if (!isOptionAvailable(type, value)) return;
    onSelect(type, value);
  };

  const renderColorOption = (variant: ProductVariant, index: number) => {
    const labelId = `${baseId}-color-label-${index}`;
    return (
      <div key={variant._id} className="mb-4" role="group" aria-labelledby={labelId}>
        <div id={labelId} className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          {variant.name}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={labelId}>
          {variant.options.map((option) => {
            const isSelected = isOptionSelected(variant.type, option.value);
            const isAvailable = isOptionAvailable(variant.type, option.value);

            return (
              <div key={option.value} className="group relative">
                <Button
                  animated={false}
                  type="button"
                  role="radio"
                  onClick={() => handleOptionClick(variant.type, option.value)}
                  disabled={!isAvailable}
                  className={classNames(
                    'relative h-12 w-12 overflow-hidden rounded-sm border transition-all motion-reduce:transition-none',
                    {
                      'border-orange ring-2 ring-orange ring-offset-1': isSelected,
                      'border-gray-300 dark:border-gray-600': !isSelected && isAvailable,
                      'cursor-not-allowed border-gray-200 dark:border-gray-700': !isAvailable,
                    },
                  )}
                  aria-label={getAriaLabel(option.name, isSelected, isAvailable)}
                  aria-checked={isSelected}
                  aria-disabled={!isAvailable}
                >
                  {option.image ? (
                    <img
                      src={option.image}
                      alt=""
                      className={classNames('h-full w-full object-cover', {
                        'opacity-40': !isAvailable,
                      })}
                    />
                  ) : (
                    <div
                      className={classNames('h-full w-full', getColorClass(option.value), {
                        'opacity-40': !isAvailable,
                      })}
                      aria-hidden="true"
                    />
                  )}
                  {!isAvailable && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <div className="h-px w-full rotate-45 bg-gray-500" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute right-0 bottom-0" aria-hidden="true">
                      <svg className="h-4 w-4 text-orange" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    </div>
                  )}
                </Button>
                {/* Decorative hover hint - not a semantic tooltip */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-tooltip-bg px-2 py-1 text-xs whitespace-nowrap text-tooltip-text opacity-0 transition-opacity motion-reduce:transition-none group-hover:opacity-100"
                >
                  {option.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSizeOption = (variant: ProductVariant, index: number) => {
    const labelId = `${baseId}-size-label-${index}`;
    return (
      <div key={variant._id} className="mb-4" role="group" aria-labelledby={labelId}>
        <div id={labelId} className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          {variant.name}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={labelId}>
          {variant.options.map((option) => {
            const isSelected = isOptionSelected(variant.type, option.value);
            const isAvailable = isOptionAvailable(variant.type, option.value);

            return (
              <div key={option.value} className="group relative">
                <Button
                  animated={false}
                  type="button"
                  role="radio"
                  onClick={() => handleOptionClick(variant.type, option.value)}
                  disabled={!isAvailable}
                  className={classNames(
                    'min-h-[44px] min-w-[50px] rounded-sm border px-3 py-2 text-sm transition-all motion-reduce:transition-none',
                    {
                      'border-orange bg-orange/10 text-orange': isSelected,
                      'border-gray-300 bg-white text-gray-700 hover:border-orange dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
                        !isSelected && isAvailable,
                      'cursor-not-allowed border-gray-300 bg-gray-50 text-gray-500 line-through dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500':
                        !isAvailable,
                    },
                  )}
                  aria-label={getAriaLabel(option.name, isSelected, isAvailable)}
                  aria-checked={isSelected}
                  aria-disabled={!isAvailable}
                >
                  {option.name}
                </Button>
                {/* Decorative hover hint - not a semantic tooltip */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-sm bg-tooltip-bg px-2 py-1 text-xs whitespace-nowrap text-tooltip-text opacity-0 transition-opacity motion-reduce:transition-none group-hover:opacity-100"
                >
                  {option.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVariant = (variant: ProductVariant, index: number) => {
    if (variant.type === 'color') {
      return renderColorOption(variant, index);
    }
    return renderSizeOption(variant, index);
  };

  return (
    <div
      className={classNames('product-variant-selector', className, {
        'rounded-sm ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-800':
          showValidationError,
      })}
      aria-label={t('variant.selectVariant')}
    >
      {variants.map((variant, index) => renderVariant(variant, index))}
      {showValidationError && (
        <p className="mt-1 text-xs text-red-500" role="alert" aria-live="assertive">
          {t('variant.selectAll')}
        </p>
      )}
    </div>
  );
}
