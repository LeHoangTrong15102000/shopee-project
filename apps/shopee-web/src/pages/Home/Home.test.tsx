import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithRouter, waitForPageLoad } from 'src/utils/testUtils';

describe('Home', () => {
  it('renders home page with product content', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // Verify real content renders — MSW returns products with category "Áo thun"
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(bodyText).toContain('Áo thun');
      },
      { timeout: 10000 },
    );
  });

  it('loads categories from MSW handler', async () => {
    renderWithRouter({ route: '/' });

    await waitForPageLoad('/');

    // MSW additionalMocks returns categories: Điện thoại, Laptop
    await waitFor(
      () => {
        const bodyText = document.body.textContent || '';
        expect(
          bodyText.includes('Điện thoại') || bodyText.includes('Laptop'),
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('loads at root path', async () => {
    renderWithRouter({ route: '/' });
    expect(window.location.pathname).toBe('/');
  });
});
