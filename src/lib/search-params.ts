/**
 * Utilities for resolving Next.js 15+ async searchParams.
 *
 * Next.js 15 changed `searchParams` from `Record<string, string>` to
 * `Promise<Record<string, string | string[]>>`, where a param can be either
 * a single string or an array of strings (e.g. from repeated query params).
 *
 * Usage:
 *   const params = buildSearchParams(await searchParams);
 *   const q = params.one('q');     // "hello"
 *   const tags = params.all('tag'); // ["a", "b"]
 */
export type SearchParamsValue = string | string[] | undefined;

export interface SearchParams {
    /** Return the first value of a param as a plain string. */
    one(key: string): string;
    /** Return all values of a param as a string array. */
    all(key: string): string[];
}

/** Build a SearchParams accessor from a raw Next.js searchParams object. */
export function buildSearchParams(
    raw: Record<string, SearchParamsValue>,
): SearchParams {
    return {
        one(key: string): string {
            const v = raw[key];
            if (!v) return '';
            if (Array.isArray(v)) return v[0] ?? '';
            return v;
        },
        all(key: string): string[] {
            const v = raw[key];
            if (!v) return [];
            if (Array.isArray(v)) return v;
            return [v];
        },
    };
}
