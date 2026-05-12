/** NoxIdentifier string — "type:id@server" or "id" (local shorthand) */
export type NoxIdentifier = string;

export interface ParsedNoxId {
  type: string | null;
  id: string;
  server: string;
}

/**
 * Parses "w:42@node.example.com" → { type: 'w', id: '42', server: 'node.example.com' }
 * Parses "42" (local shorthand)     → { type: null, id: '42', server: '' }
 */
export function parseNoxId(raw: string): ParsedNoxId {
  const atIdx = raw.indexOf('@');
  const server = atIdx >= 0 ? raw.slice(atIdx + 1) : '';
  const local = atIdx >= 0 ? raw.slice(0, atIdx) : raw;
  const slashIdx = local.indexOf(':');
  if (slashIdx >= 0) {
    return {
      type: local.slice(0, slashIdx),
      id: local.slice(slashIdx + 1),
      server,
    };
  }
  return { type: null, id: local, server };
}

/**
 * Builds an App Router path segment for a NoxIdentifier.
 *   noxIdToPath("w:42@node.example.com", "/w") → "/w/42@node.example.com"
 *   noxIdToPath("42", "/w")                        → "/w/42"
 */
export function noxIdToPath(raw: string, routePrefix: string): string {
  const { type, id, server } = parseNoxId(raw);
  if (!type && !server)
    return `${routePrefix}/${id}`;
  return `${routePrefix}/${encodeURIComponent(raw)}`;
}

/**
 * Formats a NoxIdentifier for display.
 *   "w:42@node.example.com"     → "42@node.example.com"
 *   "42"                        → "42"
 */
export function formatNoxId(raw: string, localAddress: string): string {
  const { id, server } = parseNoxId(raw);
  if (!server || server === '::' || server === localAddress) return id;
  return `${id}@${server}`;
}

/**
 * Converts a NoxIdentifier to a route segment string, stripping the "@server"
 * suffix when the server is local (empty, "::", or matches the instance address).
 *
 *   noxIdToSegment("42@node.example.com", "node.example.com") → "42"
 *   noxIdToSegment("42@other.com",        "node.example.com") → "42@other.com"
 *   noxIdToSegment("42@::",               "node.example.com") → "42"
 *   noxIdToSegment("42",                  "node.example.com") → "42"
 */
export function noxIdToSegment(raw: string, localAddress: string): string {
  const { id, server } = parseNoxId(raw);
  if (!server || server === '::' || server === localAddress) return id;
  return `${id}@${server}`;
}
