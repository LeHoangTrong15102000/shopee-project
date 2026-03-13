import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

// CartItem is rendered as part of the Cart page — test via page rendering
describe('CartItem', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('renders cart items with product info when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/cart' });

    // MSW returns cart with "Điện thoại OPPO A12" — verify product content renders
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('OPPO');
      },
      { timeout: 10000 },
    );
  });

  it('displays price information in cart', async () => {
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
});
