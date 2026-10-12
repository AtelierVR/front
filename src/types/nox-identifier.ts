/**
 * Generic Nox identifier parser.
 *
 * Full format:  [<type>:]<id>[?<key>=<value>[&<key>=<value>]][@<server>]
 *
 * Known types:
 *   u  — User   (id = int32 | username)
 *   w  — World  (id = int32, query: v=<ushort> for asset version)
 *   i  — Instance (id = int32 | shortname, query: w=<base64 world>, p=<base64 password>)
 *   a  — Avatar (id = int32)
 *   m  — Mod    (id = int32)
 */

export type NoxIdentifierType = 'u' | 'w' | 'i' | 'a' | 'm';

export type NoxQuery = Record<string, string>;

export class NoxIdentifier {
  public static readonly LOCALSERVER = '::';

  /** Maximum length of a serialized identifier (mirrors the node validator). */
  public static readonly MAX_LENGTH = 256;

  /** Charset for the id part: numeric id, username or asset shortname. */
  private static readonly ID_RE = /^[a-zA-Z0-9_.-]+$/;
  /** Charset for the `@server` part (hostname or the `::` local marker). */
  private static readonly SERVER_RE = /^[a-zA-Z0-9.:-]+$/;
  /** Charset for query keys. */
  private static readonly QUERY_KEY_RE = /^[a-zA-Z0-9_-]+$/;
  /** Charset for query values (base64 payloads use `+`, `/` and `=`). */
  private static readonly QUERY_VALUE_RE = /^[a-zA-Z0-9_.+/=-]+$/;

  readonly type: NoxIdentifierType | null;
  /** Raw string id: may be numeric string or alphanumeric name */
  readonly id: string;
  /** Remote server address, undefined means local */
  readonly server: string | undefined;
  readonly query: NoxQuery;

  static type(type: NoxIdentifierType | null, identifier: NoxIdentifier) {
    return new NoxIdentifier(type, identifier.id, identifier.server, identifier.query);
  }

  constructor(
    type: NoxIdentifierType | null,
    id: string,
    server?: string,
    query?: NoxQuery,
  ) {
    this.type = type;
    this.id = id;
    this.server = server;
    this.query = query ?? {};
  }

  /**
   * True when this identifier is well-formed: non-empty id, hostname-like server
   * (when present) and URL-safe query keys/values, within the length limit. A
   * numeric id must be in the uint32 range, and never 0.
   *
   * {@link NoxIdentifier.parse} is tolerant (an unknown type prefix is kept in the
   * id), so raw input must be checked with this before being stored or linked.
   */
  isValid(): boolean {
    if (!this.id || this.id.length > NoxIdentifier.MAX_LENGTH) return false;
    if (!NoxIdentifier.ID_RE.test(this.id)) return false;
    // Numeric ids are uint32: `0` is the "invalid" sentinel and anything beyond
    // the range cannot exist.
    if (/^\d+$/.test(this.id)) {
      const value = Number(this.id);
      if (value < 1 || value > 0xffffffff) return false;
    }
    if (this.server !== undefined && !NoxIdentifier.SERVER_RE.test(this.server))
      return false;
    for (const [key, value] of Object.entries(this.query)) {
      if (!NoxIdentifier.QUERY_KEY_RE.test(key)) return false;
      if (value !== '' && !NoxIdentifier.QUERY_VALUE_RE.test(value)) return false;
    }
    return this.toString().length <= NoxIdentifier.MAX_LENGTH;
  }

  /**
   * True when this identifier may be used as the given kind: it carries no type
   * at all (a bare id is usable by every kind), or exactly that one.
   *
   * The parser deliberately keeps any single-letter prefix — it has no hardcoded
   * list of kinds — so a caller that expects one (the key of an asset kind from
   * the instance config, the `u` of a profile route…) checks it with this.
   */
  compatible(type: string | null): boolean {
    return this.type === null || type === null || this.type === type;
  }

  /**
   * Parse a raw identifier string.
   * Tolerant: unknown type prefixes are kept as part of the id.
   */
  static parse(raw: string): NoxIdentifier {
    // 1. Extract @server suffix (last @ token that looks like a hostname)
    let server: string | undefined;
    const atIdx = raw.lastIndexOf('@');
    if (atIdx !== -1 && atIdx < raw.length - 1) {
      server = raw.slice(atIdx + 1);
      raw = raw.slice(0, atIdx);
    }

    // 2. Extract query string
    const query: NoxQuery = {};
    const qIdx = raw.indexOf('?');
    if (qIdx !== -1) {
      const qs = raw.slice(qIdx + 1);
      raw = raw.slice(0, qIdx);
      for (const pair of qs.split('&')) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1) {
          query[pair] = '';
        } else {
          query[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
        }
      }
    }

    // 3. Extract type prefix (single letter + colon). Any prefix is kept: the
    //    parser has no list of kinds, callers assert the one they expect with
    //    `compatible()`.
    let type: NoxIdentifierType | null = null;
    const colonIdx = raw.indexOf(':');
    if (colonIdx === 1) {
      const prefix = raw[0];
      if (/^[a-z]$/.test(prefix)) {
        type = prefix as NoxIdentifierType;
        raw = raw.slice(2);
      }
    }

    return new NoxIdentifier(type, raw, server, query);
  }

  /** Returns the id as a positive integer, or null if it is not a pure integer. */
  get numericId(): number | null {
    if (!/^\d+$/.test(this.id)) return null;
    const n = parseInt(this.id, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /** True when no server is specified, or it matches the local address. */
  isLocal(localAddress?: string): boolean {
    return this.server === undefined
      || this.server === ''
      || (localAddress !== undefined && this.server === NoxIdentifier.LOCALSERVER)
      || (localAddress !== undefined && this.server === localAddress);
  }

  /**
   * Semantic equality check against another NoxIdentifier or raw string.
   * Compares type, id, and server. If either side has no type, type is not compared.
   * Server comparison is tolerant: undefined, '', and '::' are all treated as "local".
   */
  match(other: NoxIdentifier | string): boolean {
    const b = typeof other === 'string' ? NoxIdentifier.parse(other) : other;

    // Id must match
    if (this.id !== b.id) return false;

    // If both have a type, they must match
    if (this.type !== null && b.type !== null && this.type !== b.type) return false;

    // Server: both local, or exact match
    const aLocal = !this.server || this.server === '' || this.server === NoxIdentifier.LOCALSERVER;
    const bLocal = !b.server || b.server === '' || b.server === NoxIdentifier.LOCALSERVER;
    if (aLocal && bLocal) return true;
    if (aLocal !== bLocal) return false;
    return this.server === b.server;
  }

  toString(fallbackServer: string | null = NoxIdentifier.LOCALSERVER): string {
    let s = '';
    if (this.type) s += `${this.type}:`;
    s += this.id;
    const qs = Object.entries(this.query)
      .map(([k, v]) => (v ? `${k}=${v}` : k))
      .join('&');
    if (qs) s += `?${qs}`;
    if (this.server && this.server !== NoxIdentifier.LOCALSERVER)
      s += `@${this.server}`;
    else if (fallbackServer)
      s += `@${fallbackServer}`;
    return s;
  }
}

// ── Legacy re-exports (backwards compat) ────────────────────────────────────

export { NoxIdentifier as NoxId };

/** Plain string form of a NoxIdentifier — used in API response types. */
export type NoxIdString = string;

export interface ParsedNoxId {
  type: string | null;
  id: string;
  server: string;
}

export function parseNoxId(raw: string): ParsedNoxId {
  const parsed = NoxIdentifier.parse(raw);
  return { type: parsed.type, id: parsed.id, server: parsed.server ?? '' };
}

export function noxIdToPath(raw: string, routePrefix: string): string {
  const parsed = NoxIdentifier.parse(raw);
  if (!parsed.server || parsed.server === NoxIdentifier.LOCALSERVER)
    return `${routePrefix}/${encodeURIComponent(parsed.id)}`;
  return `${routePrefix}/${encodeURIComponent(`${parsed.id}@${parsed.server}`)}`;
}

export function formatNoxId(raw: string, localAddress: string): string {
  const parsed = NoxIdentifier.parse(raw);
  if (!parsed.server || parsed.server === '::' || parsed.server === localAddress) return parsed.id;
  return `${parsed.id}@${parsed.server}`;
}

export function noxIdToSegment(raw: string, localAddress: string): string {
  const parsed = NoxIdentifier.parse(raw);
  if (!parsed.server || parsed.server === '::' || parsed.server === localAddress) return parsed.id;
  return `${parsed.id}@${parsed.server}`;
}

/**
 * Drop the `type:` prefix of an identifier string.
 *
 * `"a:42@host"` → `"42@host"`, `"u:hactazia"` → `"hactazia"`.
 * Strings without a type prefix are returned unchanged.
 */
export function stripNoxType(raw: string): string {
  const parsed = NoxIdentifier.parse(raw);
  if (parsed.type === null) return raw;
  // Re-serialise without the type, and without the `@::` local fallback so the
  // value stays as close as possible to what was received.
  return new NoxIdentifier(null, parsed.id, parsed.server, parsed.query).toString(null);
}

/**
 * Convert an ApiRelayWorldInfo object or legacy string to a NoxIdentifier string.
 * Example: `{ master_id: 1, server: "hactazia.fr", version: 42 }` → `"1@hactazia.fr"`
 */
export function worldInfoToString(world: { master_id: number; server: string; version?: number } | string): string {
    if (typeof world === 'string') return world;
    return `${world.master_id}@${world.server}`;
}
