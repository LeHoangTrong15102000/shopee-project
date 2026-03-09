// Sử dụng thuật toán range 2 để tạo ra pagination cho app

import classNames from 'classnames';
import { Link, createSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import path from 'src/constant/path';
import { useProductQueryStates } from 'src/hooks/nuqs';
import { generatePageNumbers, type PageItem } from './generatePageNumbers';

// --- Shared CSS class constants ---
const DOTS_CLASS =
  'flex items-center justify-center border border-gray-200 bg-white px-2 py-2 text-sm shadow-xs md:px-3 md:py-3 md:text-base dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300';
const PAGE_BASE_CLASS =
  'flex cursor-pointer items-center justify-center min-h-[44px] min-w-[44px] px-2 py-2 text-sm transition-all duration-150 motion-reduce:transition-none md:px-4 md:py-3 md:text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange';
const PAGE_ACTIVE_CLASS = 'bg-orange text-white hover:bg-orange dark:bg-orange-500';
const PAGE_INACTIVE_CLASS =
  'border-transparent text-black/70 hover:scale-110 hover:text-orange active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:text-gray-400 dark:hover:text-orange-400';
const PREV_DISABLED_CLASS =
  'flex cursor-not-allowed items-center justify-center min-h-[44px] min-w-[44px] rounded-tl-sm rounded-bl-sm border-transparent px-2 py-2 opacity-40 transition-opacity duration-150 motion-reduce:transition-none md:px-4 md:py-3';
const PREV_ENABLED_CLASS =
  'flex cursor-pointer items-center justify-center min-h-[44px] min-w-[44px] rounded-tl-sm rounded-bl-sm border-transparent px-2 py-2 transition-all duration-150 motion-reduce:transition-none hover:bg-black/5 active:scale-95 motion-reduce:active:scale-100 md:px-4 md:py-3 dark:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange';
const NEXT_DISABLED_CLASS =
  'flex cursor-not-allowed items-center justify-center min-h-[44px] min-w-[44px] rounded-tr-sm rounded-br-sm border-transparent px-2 py-2 opacity-40 transition-opacity duration-150 motion-reduce:transition-none md:px-4 md:py-3';
const NEXT_ENABLED_CLASS =
  'flex cursor-pointer items-center justify-center min-h-[44px] min-w-[44px] rounded-tr-sm rounded-br-sm border-transparent px-2 py-2 transition-all duration-150 motion-reduce:transition-none hover:bg-black/5 active:scale-95 motion-reduce:active:scale-100 md:px-4 md:py-3 dark:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange';

const ChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-black/60 dark:text-gray-400"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-5 w-5 text-black/60 dark:text-gray-400"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// --- Props discriminated union ---
interface UrlModeProps {
  pageSize?: number;
  basePath?: string;
  currentPage?: never;
  totalPages?: never;
  onPageChange?: never;
}

interface ControlledModeProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: never;
  basePath?: never;
}

export type PaginationProps = UrlModeProps | ControlledModeProps;

// --- Internal URL mode component ---
const PaginationUrl = ({ pageSize = 20, basePath = path.home }: UrlModeProps) => {
  const { t } = useTranslation('common');
  const [filters] = useProductQueryStates();

  const filtersAsStrings = Object.fromEntries(
    Object.entries(filters)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>;

  const page = filters.page;
  const safePageSize = pageSize > 0 ? pageSize : 0;
  const safePage = Math.min(Math.max(page, 1), Math.max(safePageSize, 1));

  if (safePageSize <= 1) return null;

  const items = generatePageNumbers(safePage, safePageSize);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-center"
      role="navigation"
      aria-label={t('pagination.navLabel')}
    >
      {safePage === 1 ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={t('pagination.prev')}
          aria-disabled="true"
          className={PREV_DISABLED_CLASS}
        >
          <ChevronLeft />
        </span>
      ) : (
        <Link
          to={{
            pathname: basePath,
            search: createSearchParams({
              ...filtersAsStrings,
              page: (safePage - 1).toString(),
            }).toString(),
          }}
          className={PREV_ENABLED_CLASS}
          aria-label={t('pagination.goToPrev')}
        >
          <ChevronLeft />
        </Link>
      )}
      {items.map((item: PageItem, index: number) =>
        item.type === 'dots' ? (
          <span className={DOTS_CLASS} key={`dots-${index}`} aria-hidden="true">
            ...
          </span>
        ) : (
          <Link
            to={{
              pathname: basePath,
              search: createSearchParams({
                ...filtersAsStrings,
                page: item.number.toString(),
              }).toString(),
            }}
            aria-label={t('pagination.page', { page: item.number })}
            aria-current={item.number === safePage ? 'page' : undefined}
            className={classNames(PAGE_BASE_CLASS, {
              [PAGE_ACTIVE_CLASS]: item.number === safePage,
              [PAGE_INACTIVE_CLASS]: item.number !== safePage,
            })}
            key={item.number}
          >
            {item.number}
          </Link>
        ),
      )}
      {safePage === safePageSize ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={t('pagination.next')}
          aria-disabled="true"
          className={NEXT_DISABLED_CLASS}
        >
          <ChevronRight />
        </span>
      ) : (
        <Link
          to={{
            pathname: basePath,
            search: createSearchParams({
              ...filtersAsStrings,
              page: (safePage + 1).toString(),
            }).toString(),
          }}
          className={NEXT_ENABLED_CLASS}
          aria-label={t('pagination.goToNext')}
        >
          <ChevronRight />
        </Link>
      )}
    </nav>
  );
};

// --- Internal controlled mode component ---
const PaginationControlled = ({ currentPage, totalPages, onPageChange }: ControlledModeProps) => {
  const { t } = useTranslation('common');

  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const items = generatePageNumbers(safePage, totalPages);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-center"
      role="navigation"
      aria-label={t('pagination.navLabel')}
    >
      {safePage === 1 ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={t('pagination.prev')}
          aria-disabled="true"
          className={PREV_DISABLED_CLASS}
        >
          <ChevronLeft />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          className={PREV_ENABLED_CLASS}
          aria-label={t('pagination.goToPrev')}
        >
          <ChevronLeft />
        </button>
      )}
      {items.map((item: PageItem, index: number) =>
        item.type === 'dots' ? (
          <span className={DOTS_CLASS} key={`dots-${index}`} aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onPageChange(item.number)}
            aria-label={t('pagination.page', { page: item.number })}
            aria-current={item.number === safePage ? 'page' : undefined}
            className={classNames(PAGE_BASE_CLASS, {
              [PAGE_ACTIVE_CLASS]: item.number === safePage,
              [PAGE_INACTIVE_CLASS]: item.number !== safePage,
            })}
            key={item.number}
          >
            {item.number}
          </button>
        ),
      )}
      {safePage === totalPages ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={t('pagination.next')}
          aria-disabled="true"
          className={NEXT_DISABLED_CLASS}
        >
          <ChevronRight />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          className={NEXT_ENABLED_CLASS}
          aria-label={t('pagination.goToNext')}
        >
          <ChevronRight />
        </button>
      )}
    </nav>
  );
};

// --- Exported Pagination component ---
function isControlledMode(props: PaginationProps): props is ControlledModeProps {
  return 'onPageChange' in props && typeof props.onPageChange === 'function';
}

const Pagination = (props: PaginationProps) => {
  if (isControlledMode(props)) {
    return <PaginationControlled {...props} />;
  }
  return <PaginationUrl {...props} />;
};

export default Pagination;
