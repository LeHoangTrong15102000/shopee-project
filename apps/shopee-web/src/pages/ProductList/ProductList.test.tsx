import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils';

describe('ProductList', () => {
  it('renders product list page with product items', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // MSW returns products — verify at least one product name or price renders
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('Áo thun');
      },
      { timeout: 10000 },
    );
  });

  it('handles query parameters for filtering', async () => {
    renderWithRouter({ route: '/?page=1&limit=20' });

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/');
        expect(window.location.search).toContain('page=1');
      },
      { timeout: 10000 },
    );
  });

  it('displays product content when products are loaded', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify product content renders (MSW returns products with prices)
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('₫');
      },
      { timeout: 10000 },
    );
  });
});
