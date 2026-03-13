import { describe, it, expect, afterEach } from 'vitest';
import { waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

describe('Wishlist', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('redirects to login when not authenticated', async () => {
    clearLS();
    renderWithRouter({ route: '/wishlist' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login');
      },
      { timeout: 10000 },
    );
  });

  it('displays wishlist content when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/wishlist' });

    // MSW returns wishlist with "Áo thun nam cotton cao cấp"
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('Áo thun');
      },
      { timeout: 10000 },
    );
  });
});
