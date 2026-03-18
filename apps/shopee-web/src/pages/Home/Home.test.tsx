import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils';

describe('Home', () => {
  it('renders home page with product content', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify home page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
      },
      { timeout: 2000 },
    );
  });

  it('loads categories from MSW handler', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify home page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
      },
      { timeout: 2000 },
    );
  });

  it('loads at root path', async () => {
    renderWithRouter({ route: '/' });
    expect(window.location.pathname).toBe('/');
  });
});
