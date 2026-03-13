import { describe, it, expect, afterEach } from 'vitest';
import { screen, waitFor, cleanup } from '@testing-library/react';
import { renderWithRouter } from 'src/utils/testUtils';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

describe('ChangePassword', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('redirects to login when not authenticated', async () => {
    clearLS();
    renderWithRouter({ route: '/user/password' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login');
      },
      { timeout: 10000 },
    );
  });

  it('displays password form fields when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: '/user/password' });

    // Should render password change form with old/new/confirm fields
    await waitFor(
      () => {
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
      },
      { timeout: 10000 },
    );
  });
});
