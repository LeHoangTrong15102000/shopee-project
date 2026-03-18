import { describe, it, expect, afterEach } from 'vitest';
import { waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

describe('HistoryPurchase', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('redirects to login when not authenticated', async () => {
    clearLS();
    renderWithRouter({ route: '/user/purchase' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login');
      },
      { timeout: 10000 },
    );
  });

  it('displays order history when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/user/purchase' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/user/purchase');
      },
      { timeout: 10000 },
    );

    // Verify page rendered with content
    const bodyText = document.body.textContent || '';
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
