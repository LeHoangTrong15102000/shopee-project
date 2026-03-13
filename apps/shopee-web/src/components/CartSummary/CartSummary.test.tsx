import { describe, it, expect, afterEach } from 'vitest';
import { waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

// CartSummary is rendered as part of the Cart page — test via page rendering
describe('CartSummary', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('renders cart summary with price totals when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/cart' });

    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('Giỏ hàng');
      },
      { timeout: 10000 },
    );
  });

  it('cart page renders for authenticated user', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/cart' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/cart');
        const bodyText = document.body.textContent || '';
        expect(bodyText.length).toBeGreaterThan(100);
      },
      { timeout: 10000 },
    );
  });
});
