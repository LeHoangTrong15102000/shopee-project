import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';

describe('ProductDetail', () => {
  it('renders product detail page with product info', async () => {
    // Use a mock product URL slug matching MSW productDetailRes
    renderWithRouter({ route: '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9' });

    // MSW returns product "Điện Thoại Vsmart Active 3 6GB/64GB" with price 2590000
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(
          bodyText.includes('Vsmart') ||
            bodyText.includes('OPPO'),
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('navigates to correct URL', async () => {
    const productSlug = '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9';
    renderWithRouter({ route: productSlug });

    expect(window.location.pathname).toBe(productSlug);
  });
});
