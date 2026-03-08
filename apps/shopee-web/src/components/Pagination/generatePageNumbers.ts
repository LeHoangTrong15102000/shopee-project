export type PageItem = { type: 'page'; number: number } | { type: 'dots' };

const RANGE = 2;

/**
 * Generates an array of PageItem objects representing the pagination sequence
 * using the RANGE 2 algorithm with intelligent ellipsis placement.
 *
 * Examples (range=2, totalPages=20):
 * - page 1:  [1] 2 3 ... 19 20
 * - page 5:  1 2 3 4 [5] 6 7 ... 19 20
 * - page 18: 1 2 ... 16 17 [18] 19 20
 * - page 20: 1 2 ... 18 19 [20]
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  range: number = RANGE,
): PageItem[] {
  if (totalPages <= 0) return [];

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const items: PageItem[] = [];
  let dotBefore = false;
  let dotAfter = false;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;

    // The original algorithm uses three branches based on where safePage is:
    // 1) Near the start (safePage <= range*2+1): dots only after
    // 2) In the middle: dots before AND after
    // 3) Near the end (safePage >= totalPages - range*2): dots only before
    // Pages that match a dot condition are skipped (not added as page items).

    let isDot = false;

    if (
      safePage <= range * 2 + 1 &&
      pageNumber > safePage + range &&
      pageNumber < totalPages - range + 1
    ) {
      if (!dotAfter) {
        dotAfter = true;
        items.push({ type: 'dots' });
      }
      isDot = true;
    } else if (safePage > range * 2 + 1 && safePage < totalPages - range * 2) {
      if (pageNumber < safePage - range && pageNumber > range) {
        if (!dotBefore) {
          dotBefore = true;
          items.push({ type: 'dots' });
        }
        isDot = true;
      } else if (pageNumber > safePage + range && pageNumber < totalPages - range + 1) {
        if (!dotAfter) {
          dotAfter = true;
          items.push({ type: 'dots' });
        }
        isDot = true;
      }
    } else if (
      safePage >= totalPages - range * 2 &&
      pageNumber > range &&
      pageNumber < safePage - range
    ) {
      if (!dotBefore) {
        dotBefore = true;
        items.push({ type: 'dots' });
      }
      isDot = true;
    }

    if (!isDot) {
      items.push({ type: 'page', number: pageNumber });
    }
  }

  return items;
}

