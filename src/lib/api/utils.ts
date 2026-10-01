import { ApiAlias } from "@/types/api";
import { stripNoxType } from "@/types/nox-identifier";

export function getAlias(aliases: ApiAlias[], key: string): string | null {
  const alias = aliases.find(a => a.key === key);
  return alias ? alias.value : null;
}

/**
 * Normalise an identifier used in an API path.
 *
 * API routes are already typed by resource (`/avatars/:id`), so a `type:` prefix
 * (`a:42@host`) is useless there — it is stripped before building the URL.
 */
export function idParam(id: number | string): string {
  return typeof id === 'number' ? String(id) : stripNoxType(id);
}
