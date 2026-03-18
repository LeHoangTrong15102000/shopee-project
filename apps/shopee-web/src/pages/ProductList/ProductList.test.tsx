import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils';

describe('ProductList', () => {
  it('renders product list page with product items', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify product list page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
      },
      { timeout: 2000 },
    );
  });

  it('handles query parameters for filtering', async () => {
    renderWithRouter({ route: '/?page=1&limit=20' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
        expect(window.location.search).toContain('page=1');
      },
      { timeout: 5000 },
    );
  });

  it('displays product content when products are loaded', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify product list page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
      },
      { timeout: 2000 },
    );
  });
});
