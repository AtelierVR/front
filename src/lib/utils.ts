import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * True when `url` is a safe link target: an absolute http(s) URL with a host and
 * no embedded credentials. Mirrors the API link validation so a stored value can
 * never be rendered as an `javascript:`/`data:` href.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !!parsed.host &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

const HIDDEN_TAG_PREFIXES = ['dft:', 'adm:'];
export function isHiddenTag(tag: string): boolean {
  return HIDDEN_TAG_PREFIXES.some((p) => tag.startsWith(p));
}

/** Order-insensitive comparison of two unique string lists. */
export function sameValues(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

