import { describe, test, expect } from 'vitest';
import { generatePageNumbers, type PageItem } from './generatePageNumbers';

/** Helper to convert PageItem[] to a readable string like "1 ... 3 4 [5] 6 7 ... 19 20" */
const toReadable = (items: PageItem[], currentPage?: number) =>
  items
    .map((item) => {
      if (item.type === 'dots') return '...';
      if (currentPage !== undefined && item.number === currentPage) return `[${item.number}]`;
      return String(item.number);
    })
    .join(' ');

/** Helper to extract just page numbers (no dots) */
const pageNumbers = (items: PageItem[]) =>
  items
    .filter((i): i is Extract<PageItem, { type: 'page' }> => i.type === 'page')
    .map((i) => i.number);

describe('generatePageNumbers', () => {
  describe('First page (page 1, totalPages 20)', () => {
    test('should return correct sequence', () => {
      const items = generatePageNumbers(1, 20);
      expect(toReadable(items, 1)).toBe('[1] 2 3 ... 19 20');
    });
  });

  describe('Middle page (page 5, totalPages 20)', () => {
    test('should return correct sequence with dots after', () => {
      const items = generatePageNumbers(5, 20);
      // Page 5 is at boundary (RANGE*2+1=5), so only dotAfter applies
      expect(toReadable(items, 5)).toBe('1 2 3 4 [5] 6 7 ... 19 20');
    });
  });

  describe('Near-end page (page 18, totalPages 20)', () => {
    test('should return correct sequence', () => {
      const items = generatePageNumbers(18, 20);
      expect(toReadable(items, 18)).toBe('1 2 ... 16 17 [18] 19 20');
    });
  });

  describe('Last page (page 20, totalPages 20)', () => {
    test('should return correct sequence', () => {
      const items = generatePageNumbers(20, 20);
      expect(toReadable(items, 20)).toBe('1 2 ... 18 19 [20]');
    });
  });

  describe('Small page count (3 pages)', () => {
    test('should return all pages with no dots', () => {
      const items = generatePageNumbers(1, 3);
      expect(pageNumbers(items)).toEqual([1, 2, 3]);
      expect(items.every((i) => i.type === 'page')).toBe(true);
    });
  });

  describe('Single page', () => {
    test('should return single page item', () => {
      const items = generatePageNumbers(1, 1);
      expect(items).toEqual([{ type: 'page', number: 1 }]);
    });
  });

  describe('Zero pages', () => {
    test('should return empty array', () => {
      const items = generatePageNumbers(1, 0);
      expect(items).toEqual([]);
    });
  });

  describe('Negative totalPages', () => {
    test('should return empty array', () => {
      const items = generatePageNumbers(1, -5);
      expect(items).toEqual([]);
    });
  });

  describe('currentPage out of bounds (above)', () => {
    test('should clamp to last page', () => {
      const items = generatePageNumbers(25, 20);
      const lastPageItems = generatePageNumbers(20, 20);
      expect(toReadable(items)).toBe(toReadable(lastPageItems));
    });
  });

  describe('currentPage out of bounds (below zero)', () => {
    test('should clamp to first page', () => {
      const items = generatePageNumbers(-1, 20);
      const firstPageItems = generatePageNumbers(1, 20);
      expect(toReadable(items)).toBe(toReadable(firstPageItems));
    });
  });

  describe('currentPage zero', () => {
    test('should clamp to first page', () => {
      const items = generatePageNumbers(0, 20);
      const firstPageItems = generatePageNumbers(1, 20);
      expect(toReadable(items)).toBe(toReadable(firstPageItems));
    });
  });

  describe('All items are either page or dots', () => {
    test('should only contain valid PageItem types', () => {
      const items = generatePageNumbers(10, 20);
      items.forEach((item) => {
        expect(['page', 'dots']).toContain(item.type);
      });
    });
  });

  describe('No consecutive dots', () => {
    test('should never have two dots items in a row', () => {
      for (let page = 1; page <= 20; page++) {
        const items = generatePageNumbers(page, 20);
        for (let i = 1; i < items.length; i++) {
          if (items[i].type === 'dots') {
            expect(items[i - 1].type).not.toBe('dots');
          }
        }
      }
    });
  });
});
