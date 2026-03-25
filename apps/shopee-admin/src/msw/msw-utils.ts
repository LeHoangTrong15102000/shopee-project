export const API_URL = 'https://api-ecom.duthanhduoc.com';

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    pagination: {
      page,
      limit,
      page_size: Math.ceil(items.length / limit),
    },
  };
}
