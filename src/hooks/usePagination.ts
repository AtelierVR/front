'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function usePagination(): PaginationParams {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get('p') ?? DEFAULT_PAGE));
  const limit = Math.max(1, Number(searchParams.get('l') ?? DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  function updateParam(key: string, value: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, String(value));
    router.push(`${pathname}?${params.toString()}`);
  }

  return {
    page,
    limit,
    offset,
    setPage: (p) => updateParam('p', p),
    setLimit: (l) => updateParam('l', l),
  };
}
