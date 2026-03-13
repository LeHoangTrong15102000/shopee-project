import { useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ProductVariant, ProductVariantCombination } from 'src/types/variant.type';
import Button from 'src/components/Button';

// Color mapping with gradient styles for a more vibrant look
const COLOR_GRADIENT_MAP: Record<string, string> = {
  red: 'bg-gradient-to-br from-red-400 to-red-600',
  đỏ: 'bg-gradient-to-br from-red-400 to-red-600',
  blue: 'bg-gradient-to-br from-blue-400 to-blue-600',
  'xanh dương': 'bg-gradient-to-br from-blue-400 to-blue-600',
  green: 'bg-gradient-to-br from-green-400 to-green-600',
  'xanh lá': 'bg-gradient-to-br from-green-400 to-green-600',
  yellow: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
  vàng: 'bg-gradient-to-br from-yellow-300 to-yellow-500',
  black: 'bg-gradient-to-br from-gray-700 to-gray-900',
  đen: 'bg-gradient-to-br from-gray-700 to-gray-900',
  white: 'bg-gradient-to-br from-gray-50 to-gray-200',
  trắng: 'bg-gradient-to-br from-gray-50 to-gray-200',
  pink: 'bg-gradient-to-br from-pink-300 to-pink-500',
  hồng: 'bg-gradient-to-br from-pink-300 to-pink-500',
  purple: 'bg-gradient-to-br from-purple-400 to-purple-600',
  tím: 'bg-gradient-to-br from-purple-400 to-purple-600',
  orange: 'bg-gradient-to-br from-orange-400 to-orange-600',
  cam: 'bg-gradient-to-br from-orange-400 to-orange-600',
  gray: 'bg-gradient-to-br from-gray-400 to-gray-600',
  grey: 'bg-gradient-to-br from-gray-400 to-gray-600',
  xám: 'bg-gradient-to-br from-gray-400 to-gray-600',
};

const getColorClass = (colorValue: string): string => {
  const normalized = colorValue.toLowerCase().trim();
  return COLOR_GRADIENT_MAP[normalized] || 'bg-gradient-to-br from-gray-200 to-gray-400';
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

  const getAriaLabel = (optionName: string, isSelected: boolean): string => {
    let label = optionName;
    if (isSelected) label += `, ${t('variant.selected')}`;
    return label;
  };

  const availableOptions = useMemo(() => {
    const available: { [key: string]: Set<string> } = {};

    variants.forEach((variant) => {
      available[variant.type] = new Set();
    });

    // For each variant type, calculate available options based on OTHER type selections only
    variants.forEach((variant) => {
      const currentType = variant.type;

      combinations.forEach((combination) => {
        if (combination.quantity <= 0) return;

        // Check if this combination matches selections of OTHER types (not current type)
        const isMatchingOtherSelections = Object.entries(selectedValues).every(([type, value]) => {
          // Skip checking the current type - we want to see all options for it
          if (type === currentType) return true;
          if (!combination.variant_values[type]) return true;
          return combination.variant_values[type] === value;
        });

        if (isMatchingOtherSelections && combination.variant_values[currentType]) {
          available[currentType].add(combination.variant_values[currentType]);
        }
      });
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

            return (
              <div key={option.value} className="group relative">
                <Button
                  animated={false}
                  type="button"
                  role="radio"
                  onClick={() => handleOptionClick(variant.type, option.value)}
                  className={classNames(
                    'relative h-8 w-10 overflow-hidden rounded-md transition-all duration-200 motion-reduce:transition-none',
                    {
                      'scale-110 shadow-lg shadow-orange/30': isSelected,
                      'hover:scale-105 hover:shadow-md': !isSelected,
                    },
                  )}
                  aria-label={getAriaLabel(option.name, isSelected)}
                  aria-checked={isSelected}
                >
                  {/* Outer border container */}
                  <div
                    className={classNames(
                      'absolute inset-0 rounded-md transition-all duration-200',
                      {
                        'bg-gradient-to-r from-orange via-orange-400 to-orange p-[2px]': isSelected,
                        'bg-gray-300 dark:bg-gray-600 p-[1px] group-hover:bg-orange/50':
                          !isSelected,
                      },
                    )}
                  >
                    {/* Inner color content */}
                    <div className="h-full w-full rounded-[5px] overflow-hidden">
                      {option.image ? (
                        <img src={option.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className={classNames('h-full w-full', getColorClass(option.value))}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                  {/* Selected checkmark indicator */}
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange text-white shadow-sm">
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </Button>
                {/* Decorative hover hint - not a semantic tooltip */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity motion-reduce:transition-none group-hover:opacity-100"
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
                  aria-label={getAriaLabel(option.name, isSelected)}
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
