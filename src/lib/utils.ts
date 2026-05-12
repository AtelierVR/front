import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

const HIDDEN_TAG_PREFIXES = ['dft:', 'sys:'];
export function isHiddenTag(tag: string): boolean {
  return HIDDEN_TAG_PREFIXES.some((p) => tag.startsWith(p));
}

