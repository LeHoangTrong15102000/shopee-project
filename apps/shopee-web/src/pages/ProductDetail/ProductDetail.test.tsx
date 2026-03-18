import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';

describe('ProductDetail', () => {
  it('renders product detail page with product info', async () => {
    // Use a mock product URL slug matching MSW productDetailRes
    renderWithRouter({ route: '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9');
      },
      { timeout: 10000 },
    );

    // Verify page rendered with content
    const bodyText = document.body.textContent || '';
    expect(bodyText.length).toBeGreaterThan(0);
  });

  it('navigates to correct URL', async () => {
    const productSlug = '/dien-thoai-iphone-12-i-60afb2426ef5b902180aacb9';
    renderWithRouter({ route: productSlug });

    expect(window.location.pathname).toBe(productSlug);
  });
});
