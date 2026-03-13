import { screen, waitFor, cleanup } from '@testing-library/react';
import path from 'src/constant/path';
import { renderWithRouter } from 'src/utils/testUtils';
import { describe, expect, it, afterEach } from 'vitest';
import { setAccessTokenToLS, clearLS } from 'src/utils/auth';
import { access_token } from 'src/msw/auth.msw';

describe('Profile', () => {
  afterEach(() => {
    cleanup();
    clearLS();
  });

  it('redirects to login when not authenticated', async () => {
    clearLS();
    renderWithRouter({ route: path.profile });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login');
      },
      { timeout: 3000 },
    );
  });

  it('displays user profile form when authenticated', async () => {
    setAccessTokenToLS(access_token);
    renderWithRouter({ route: path.profile });

    // MSW returns user "Lê Hoàng Trọng" with email "langtupro0456@gmail.com"
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(
          bodyText.includes('Lê Hoàng Trọng') ||
            bodyText.includes('langtupro0456'),
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });
});
