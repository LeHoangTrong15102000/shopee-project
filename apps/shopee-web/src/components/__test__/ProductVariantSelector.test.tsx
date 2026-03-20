import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import ProductVariantSelector from '../ProductVariantSelector/ProductVariantSelector';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

describe('ProductVariantSelector', () => {
  const mockVariants = [
    {
      _id: '1',
      type: 'color',
      name: 'Color',
      options: [
        { value: 'red', name: 'Red', image: '' },
        { value: 'blue', name: 'Blue', image: '' },
      ],
    },
    {
      _id: '2',
      type: 'size',
      name: 'Size',
      options: [
        { value: 'S', name: 'Small', image: '' },
        { value: 'M', name: 'Medium', image: '' },
      ],
    },
  ];

  const mockCombinations = [
    {
      _id: '1',
      variant_values: { color: 'red', size: 'S' },
      price: 100000,
      quantity: 10,
    },
    {
      _id: '2',
      variant_values: { color: 'blue', size: 'M' },
      price: 100000,
      quantity: 5,
    },
  ];

  const mockOnSelect = vi.fn();

  it('renders variant selector', () => {
    const { container } = render(
      <ProductVariantSelector
        variants={mockVariants}
        combinations={mockCombinations}
        selectedValues={{}}
        onSelect={mockOnSelect}
      />,
    );

    expect(container.querySelectorAll('[role="radio"]').length).toBeGreaterThan(0);
  });

  it('displays color options', () => {
    const { container } = render(
      <ProductVariantSelector
        variants={mockVariants}
        combinations={mockCombinations}
        selectedValues={{}}
        onSelect={mockOnSelect}
      />,
    );

    const colorButtons = container.querySelectorAll('[role="radio"]');
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it('shows validation error when showValidationError is true', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        combinations={mockCombinations}
        selectedValues={{}}
        onSelect={mockOnSelect}
        showValidationError={true}
      />,
    );

    const errorMessage = document.querySelector('[role="alert"]');
    expect(errorMessage).toBeInTheDocument();
  });
});
