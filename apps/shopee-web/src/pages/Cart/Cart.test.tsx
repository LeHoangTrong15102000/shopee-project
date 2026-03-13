import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

describe('Cart', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('redirects to login when not authenticated', async () => {
    clearLS();
    renderWithRouter({ route: '/cart' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login');
      },
      { timeout: 10000 },
    );
  });

  it('displays cart content when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/cart' });

    // MSW returns cart with "Điện thoại OPPO A12" product
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('Giỏ hàng');
      },
      { timeout: 10000 },
    );
  });
});
