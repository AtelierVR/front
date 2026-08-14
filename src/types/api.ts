import type { NoxIdString } from './nox-identifier';
import { NoxWellKnown } from './wellknown';

// ── Release helpers ───────────────────────────────────────────────────────────

export type ApiRelease = number | { value: number; auto: boolean };

/** Extract the resolved version number from a release field. */
export function releaseVersion(r: ApiRelease): number {
    return typeof r === 'number' ? r : r.value;
}

/** Whether the release was auto-detected (latest). */
export function releaseIsAuto(r: ApiRelease): boolean {
    return typeof r === 'object' && r.auto;
}

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
    home: NoxIdString | null;
    avatar: NoxIdString | null;
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
    release: ApiRelease;
    server: string;
    owner: NoxIdString;
    contributors: NoxIdString[];
    alias: ApiAlias[];
}

export interface ApiWorldList extends ApiSearchResult<ApiWorld> {
    query: string | null;
    ids: NoxIdString[];
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
    release: ApiRelease;
    server: string;
    owner: NoxIdString;
    contributors: NoxIdString[];
    alias: ApiAlias[];
}

export interface ApiAvatarList extends ApiSearchResult<ApiAvatar> {
    query: string | null;
    ids: NoxIdString[];
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

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface ApiSessionDevice {
    user_agent: string;
    ip: string;
    last_seen: number;
}

export interface ApiSessionItem {
    id: string;
    current: boolean;
    expires_at: number;
    created_at: number;
    devices: ApiSessionDevice[];
}

export interface ApiSessionsList {
    sessions: ApiSessionItem[];
    total: number;
    limit: number;
    offset: number;
}

// ── Instance ──────────────────────────────────────────────────────────────────

export interface ApiInstanceConnection {
    method: string;
    data: string;
    region: string | null;
}

export interface ApiInstancePlayer {
    user: NoxIdString | null;
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
    owner: NoxIdString;
    world: NoxIdString;
    tags: string[];
    connection: ApiInstanceConnection | null;
    count: number;
    players: ApiInstancePlayer[];
    alias: ApiAlias[];
}

export interface ApiInstanceList extends ApiSearchResult<ApiInstance> {
    query: string | null;
    ids: NoxIdString[];
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface ApiUserSearchResult extends ApiSearchResult<ApiUser> {
    query: string | null;
    ids: NoxIdString[];
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

/** Two-way relation (mutual follow = friend). */
export interface ApiBiRelation {
    /** My follow of them (outgoing). */
    out: ApiRelation;
    /** Their follow of me (incoming). */
    in: ApiRelation;
}

export interface ApiBiRelationListResult extends ApiSearchResult<ApiBiRelation> {}

// ── Messaging (placeholder — API not yet available) ───────────────────────────

export interface ApiConversation {
    id: number;
    participants: NoxIdString[];
    last_message: ApiMessage | null;
    updated_at: number;
    created_at: number;
}

export interface ApiMessage {
    id: number;
    conversation_id: number;
    sender: NoxIdString;
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

export interface ApiServerBase {
    address: string;
    rank: number;
    last_seen: number;
    created_at: number;
}

export interface ApiServer extends ApiServerBase {
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
        bandwidth: number;
        packets?: number;
    };
    download: {
        used: number;
        bandwidth: number;
        packets?: number;
    };
    mtu?: number;
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

export interface ApiRelayRunnerPort {
    protocol: string;
    host: string;
    port: number;
}

export interface ApiRelayRunnerInfo {
    provider_id: string | null;
    status: string;
    started_at: number | null;
    meta: Record<string, string>;
    ports: ApiRelayRunnerPort[];
}

export interface ApiRelay {
    id: number;
    label: string | null;
    provider: string;
    provider_id: string | null;
    region: string | null;
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

export interface ApiRelayWorldInfo {
    master_id: number;
    server: string;
    version: number;
}

export interface ApiRelayInstance {
    id: string;       // relay-local slot
    node_id: number;  // DB/federation id
    player_count: number;
    flags: number;
    world: ApiRelayWorldInfo | string;  // object from new relay, string from legacy
    capacity: number;
    tps: number;                  // configured TPS
    threshold: number;            // configured threshold
    effective_tps: number;        // effective TPS (load balancing)
    effective_threshold: number;  // effective threshold (load balancing)
}

export interface ApiRelayPlayer {
    id: number;
    client_id: number;
    display: string;
    flags: number;
    joined_at: number;
    user: string | null;
    /** Custom TPS override (0 = use instance default). */
    custom_tps: number;
    /** Custom threshold override (0 = use instance default). */
    custom_threshold: number;
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
    /** Configured target TPS, null when relay is offline. */
    tps: number | null;
    /** Configured transform threshold, null when relay is offline. */
    threshold: number | null;
    /** Effective TPS after load balancing, null when relay is offline. */
    effective_tps: number | null;
    /** Effective threshold after load balancing, null when relay is offline. */
    effective_threshold: number | null;
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



