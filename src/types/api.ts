import type { NoxIdentifier } from './nox-identifier';
import { NoxWellKnown } from './wellknown';

// ── Shared sub-types ──────────────────────────────────────────────────────────

export interface ApiLink {
    label: string;
    value: string;
}

export interface ApiUserRelations {
    out: string | null;
    in: string | null;
}

export interface ApiUserPresence {
    status: 'oja' | 'ojf' | 'online' | 'busy' | 'dnd' | 'stream' | 'offline';
    text: string | null;
    /**
     * List of instance iids the user is currently in (e.g. ["42@example.com"]).
     * `null` means the viewer has no permission to see this field.
     * An empty array means the viewer can see it but the user is not in any instance.
     */
    locations: string[] | null;
}

export interface ApiAlias {
    key: string;
    value: string;
}

export interface ApiSearchResult<T> {
    total: number;
    items: T[];
    limit: number;
    offset: number;
}

// ── User public tables ────────────────────────────────────────────────────────

export interface ApiPublicTableItem {
    key: string;
    mime: string;
    hash: string;
    updated_at: number;
}

export interface ApiPublicTableList extends ApiSearchResult<ApiPublicTableItem> {}

// ── User ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
    id: number;
    username: string;
    display: string;
    bio: string | null;
    pronoun: string | null;
    server: string;
    tags: string[];
    thumbnail: string | null;
    banner: string | null;
    links: ApiLink[];
    relations: ApiUserRelations | null;
    public: string;
    followers: number;
    following: number;
    presence: ApiUserPresence;
    alias: ApiAlias[];
}

export interface ApiCurrentUser extends ApiUser {
    email: string | null;
    email_verified: boolean;
    created_at: number;
    home: NoxIdentifier | null;
    avatar: NoxIdentifier | null;
    twofa_enabled: boolean;
}

export interface ApiSession {
    token: string;
    expires: number;
    created_at: number;
    user: ApiCurrentUser;
}

// ── World ─────────────────────────────────────────────────────────────────────

export interface ApiWorld {
    id: number;
    name: string | null;
    title: string;
    description: string | null;
    thumbnail: string | null;
    tags: string[];
    capacity: number;
    release: number;
    server: string;
    owner: NoxIdentifier;
    contributors: NoxIdentifier[];
    alias: ApiAlias[];
}

export interface ApiWorldList extends ApiSearchResult<ApiWorld> {
    query: string | null;
    ids: NoxIdentifier[];
}

export interface ApiWorldAsset {
    id: number;
    version: number;
    engine: string;
    platform: string;
    is_empty: boolean;
    url: string | null;
    hash: string | null;
    size: number | null;
    mods: string[];
    features: string[];
    uploader: string | null;
}

export interface ApiWorldAssetList {
    limit: number;
    offset: number;
    count: number;
    total: number;
    items: ApiWorldAsset[];
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export interface ApiAvatar {
    id: number;
    name: string | null;
    title: string;
    description: string | null;
    thumbnail: string | null;
    tags: string[];
    release: number;
    server: string;
    owner: NoxIdentifier;
    contributors: NoxIdentifier[];
    alias: ApiAlias[];
}

export interface ApiAvatarList extends ApiSearchResult<ApiAvatar> {
    query: string | null;
    ids: NoxIdentifier[];
}

export interface ApiAvatarAsset {
    id: number;
    version: number;
    engine: string;
    platform: string;
    is_empty: boolean;
    url: string | null;
    hash: string | null;
    size: number | null;
    mods: string[];
    uploader: string | null;
    features: string[];
}

export interface ApiAvatarAssetList {
    limit: number;
    offset: number;
    count: number;
    total: number;
    items: ApiAvatarAsset[];
}

// ── Instance ──────────────────────────────────────────────────────────────────

export interface ApiInstanceConnection {
    method: string;
    data: string;
}

export interface ApiInstancePlayer {
    user: NoxIdentifier | null;
    display: string;
}

export interface ApiInstance {
    id: number;
    name: string | null;
    title: string;
    description: string | null;
    thumbnail: string | null;
    capacity: number;
    server: string;
    owner: NoxIdentifier;
    world: NoxIdentifier;
    tags: string[];
    connection: ApiInstanceConnection | null;
    count: number;
    players: ApiInstancePlayer[];
    alias: ApiAlias[];
}

export interface ApiInstanceList extends ApiSearchResult<ApiInstance> {
    query: string | null;
    ids: NoxIdentifier[];
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface ApiUserSearchResult extends ApiSearchResult<ApiUser> {
    query: string | null;
    ids: NoxIdentifier[];
}

// ── Relations ─────────────────────────────────────────────────────────────────

export interface ApiRelation {
    id: string;
    type: 'follow' | 'request';
    initiator: string;
    target: string;
    created_at: number;
}

export interface ApiRelationListResult extends ApiSearchResult<ApiRelation> {}

// ── Messaging (placeholder — API not yet available) ───────────────────────────

export interface ApiConversation {
    id: number;
    participants: NoxIdentifier[];
    last_message: ApiMessage | null;
    updated_at: number;
    created_at: number;
}

export interface ApiMessage {
    id: number;
    conversation_id: number;
    sender: NoxIdentifier;
    content: string;
    created_at: number;
    edited_at: number | null;
}

export interface ApiConversationList {
    total: number;
    limit: number;
    offset: number;
    items: ApiConversation[];
}

// ── Server ────────────────────────────────────────────────────────────────────

export interface ApiServer {
    address: string;
    rank: number;
    last_seen: number;
    created_at: number;
}

export interface ApiServerDetail extends ApiServer {
    well_known: NoxWellKnown | null;
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export interface ApiLogEntry {
    timestamp: number;
    level: string;
    tag: string | null;
    message: string;
}

// ── Relay ─────────────────────────────────────────────────────────────────────

export interface ApiRelaySpecs {
    processor: {
        used: number;
        cores: number
    };
    memory: {
        used: number;
        total: number
    };
    upload: {
        used: number;
        bandwidth: number
    };
    download: {
        used: number;
        bandwidth: number
    };
}

export interface ApiRelayStatus {
    instances: {
        count: number;
        limit: number;
    }
    clients: number;
    engine: string;
    version: string;
    protocol: number;
    uptime: number;
    ping: number | null;
    specs: ApiRelaySpecs | null;
}

export interface ApiRelayRunnerInfo {
    provider_id: string | null;
    status: string;
    started_at: number | null;
    meta: Record<string, string>;
}

export interface ApiRelay {
    id: number;
    label: string | null;
    provider: string;
    provider_id: string | null;
    tags: string[];
    connected: boolean;
    runner: ApiRelayRunnerInfo | null;
    created_at: string;
    status: ApiRelayStatus | null;
}

export interface ApiRelayLog {
    timestamp: number;
    level: string;
    tag: string | null;
    message: string;
}

export interface ApiRelayInstance {
    id: string;
    internal_id: number;
    player_count: number;
    flags: number;
    world: string;
    capacity: number;
}

export interface ApiRelayPlayer {
    id: number;
    client_id: number;
    display: string;
    flags: number;
    joined_at: number;
}

export interface ApiRelayClient {
    id: number;
    address: string;
    platform: string;
    engine: string;
    user: string | null;
    connected_at: number;
}

export interface ApiRelayAssignedInstance {
    id: number;
    /** Relay-internal slot (0–254), null when relay is offline. */
    internal_id: number | null;
    name: string;
    title: string | null;
    world: string;
    owner: string;
    capacity: number;
    created_at: number;
}

// ── Environment config ────────────────────────────────────────────────────────

export interface ApiConfigEntry {
    key: string;
    label: string | null;
    description: string | null;
    default: unknown;
    environment: string | null;
    override: string | null;
    forced: boolean;
    risky: boolean;
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface ApiActivityEvent {
    id: number;
    type: string;
    message: string;
    details: unknown | null;
    author: string | null;
    created_at: string;
}

export interface ApiActivityList {
    total: number;
    limit: number;
    offset: number;
    items: ApiActivityEvent[];
}
