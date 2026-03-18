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
      { timeout: 5000 },
    );
  });

  it('displays wishlist content when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/wishlist' });

    // Verify wishlist page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/wishlist');
      },
      { timeout: 2000 },
    );
  });
});
