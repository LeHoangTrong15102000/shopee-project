import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  IconHeart,
  IconCurrencyDollar,
  IconTag,
  IconChartBar,
  IconBell,
  IconTarget,
  IconFolder,
  IconCube,
  IconShoppingCart,
  IconLightning,
  IconStar,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconFire,
  IconSparkles,
  IconTrophy,
  IconClipboard,
  IconMagnifyingGlass,
  IconShoppingBag,
  getCategoryIcon,
  categoryIconComponents,
} from '../WishlistIcons';

describe('WishlistIcons', () => {
  const icons = [
    { name: 'IconHeart', Component: IconHeart },
    { name: 'IconCurrencyDollar', Component: IconCurrencyDollar },
    { name: 'IconTag', Component: IconTag },
    { name: 'IconChartBar', Component: IconChartBar },
    { name: 'IconBell', Component: IconBell },
    { name: 'IconTarget', Component: IconTarget },
    { name: 'IconFolder', Component: IconFolder },
    { name: 'IconCube', Component: IconCube },
    { name: 'IconShoppingCart', Component: IconShoppingCart },
    { name: 'IconLightning', Component: IconLightning },
    { name: 'IconStar', Component: IconStar },
    { name: 'IconTrendingUp', Component: IconTrendingUp },
    { name: 'IconTrendingDown', Component: IconTrendingDown },
    { name: 'IconClock', Component: IconClock },
    { name: 'IconFire', Component: IconFire },
    { name: 'IconSparkles', Component: IconSparkles },
    { name: 'IconTrophy', Component: IconTrophy },
    { name: 'IconClipboard', Component: IconClipboard },
    { name: 'IconMagnifyingGlass', Component: IconMagnifyingGlass },
    { name: 'IconShoppingBag', Component: IconShoppingBag },
  ];

  icons.forEach(({ name, Component }) => {
    it(`renders ${name} as svg`, () => {
      const { container } = render(<Component />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it(`${name} accepts custom className`, () => {
      const { container } = render(<Component className="w-8 h-8" />);
      expect(container.querySelector('svg')).toHaveClass('w-8 h-8');
    });
  });

  describe('getCategoryIcon', () => {
    it('returns icon by category _id', () => {
      const Icon = getCategoryIcon({ _id: 'cat-1', name: 'Thời trang nam' });
      expect(Icon).toBe(IconShoppingBag);
    });

    it('falls back to name when _id not found', () => {
      const Icon = getCategoryIcon({ _id: 'unknown-id', name: 'Đồng hồ' });
      expect(Icon).toBe(IconClock);
    });

    it('returns IconCube as default for unknown category object', () => {
      const Icon = getCategoryIcon({ _id: 'unknown', name: 'Unknown' });
      expect(Icon).toBe(IconCube);
    });

    it('returns icon by string name', () => {
      const Icon = getCategoryIcon('Electronics');
      expect(Icon).toBe(IconLightning);
    });

    it('returns IconCube for unknown string', () => {
      const Icon = getCategoryIcon('NonExistent');
      expect(Icon).toBe(IconCube);
    });

    it('returns icon for Vietnamese name', () => {
      const Icon = getCategoryIcon('Làm đẹp');
      expect(Icon).toBe(IconStar);
    });
  });

  describe('categoryIconComponents', () => {
    it('has entries for category IDs', () => {
      expect(categoryIconComponents['cat-1']).toBeDefined();
      expect(categoryIconComponents['cat-10']).toBeDefined();
    });

    it('has entries for English names', () => {
      expect(categoryIconComponents['Electronics']).toBeDefined();
      expect(categoryIconComponents['Beauty']).toBeDefined();
    });
  });
});
