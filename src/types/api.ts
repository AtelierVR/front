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
    status: 'offline' | ('dnd' | 'stream') | 'busy' | 'online' | ('event' | 'public');
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

/**
 * Descriptor of one image attached to an entity (`IApiAsset.images`).
 *
 * `width`/`height` are the image's own dimensions, and stay `0` when the server
 * did not measure them — the image then ranks by `priority` only.
 */
export interface ApiImageObject {
    url: string;
    /** 0 = primary image; lower is better. */
    priority: number;
    width: number;
    height: number;
    alt: string | null;
}

/** One image an entity may expose: a bare URL, or a descriptor. */
export type ApiImage = ApiImageObject['url'] | ApiImageObject;

/**
 * Everything an entity may expose as its image: one image, a list of them (or a
 * mix, nullish entries included), or nothing at all. Server and provider
 * implementations differ, so consumers never assume an array — use
 * {@link imageList} to normalise it.
 */
export type ApiImageList =
    | ApiImage
    | ApiImageObject['url'][]
    | ApiImageObject[]
    | readonly (ApiImage | null | undefined)[]
    | null
    | undefined;

/**
 * Normalises an {@link ApiImageList} into a flat list of image descriptors, dropping
 * empty entries and flattening nested lists. A bare URL becomes a descriptor
 * without dimensions or `alt`.
 */
export function imageList(images: ApiImageList): ApiImageObject[] {
    const out: ApiImageObject[] = [];

    const add = (entry: ApiImageList) => {
        if (!entry) return;
        if (typeof entry === 'string') {
            out.push({ url: entry, priority: 0, width: 0, height: 0, alt: null });
            return;
        }
        // `Array.isArray` does not narrow a `readonly` array, hence the casts.
        if (Array.isArray(entry)) {
            for (const nested of entry as readonly ApiImageList[]) add(nested);
            return;
        }
        const image = entry as ApiImageObject;
        if (image.url) out.push(image);
    };

    add(images);
    return out;
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
    created_at: number;
    home: NoxIdString | null;
    avatar: NoxIdString | null;
    /**
     * Authentication methods and their status, keyed by method name:
     *   email   → "verified" | "unverified" | "disabled"  (disabled = no email set)
     *   totp    → "enabled"  | "disabled"
     *   passkey → "enabled"  | "disabled"
     */
    methods: Record<string, string>;
}

export interface ApiSession {
    token: string;
    expires: number;
    created_at: number;
    user: ApiCurrentUser;
}

// ── Asset (world, avatar, mod) ────────────────────────────────────────────────

/**
 * Fields shared by every asset exposed by the asset endpoints (`mods`, `worlds`,
 * `avatars`): what a listing, a favourite or a card needs, whatever the kind.
 */
export interface ApiAsset {
    /** Kind of the asset, matching its endpoint (`world`, `avatar`, `mod`). */
    type: string;
    id: number;
    name: string | null;
    title: string | null;
    description: string | null;
    /**
     * Images attached to the asset, in the order the server ranks them. An asset
     * has no `thumbnail` field: use {@link imageList} to normalise these.
     */
    images: ApiImageList;
    tags: string[];
    server: string;
    owner: NoxIdString;
    contributors: NoxIdString[];
    alias: ApiAlias[];
    release: ApiRelease;
    created_at: number;
    updated_at: number;
}

// ── World ─────────────────────────────────────────────────────────────────────

export interface ApiWorld extends ApiAsset {
    /** Always set on a world. */
    title: string;
    capacity: number;
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

export interface ApiAvatar extends ApiAsset {
    /** Always set on an avatar. */
    title: string;
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

// ── Mod ───────────────────────────────────────────────────────────────────────

/** Mods expose the plain {@link ApiAsset} shape. */
export type ApiMod = ApiAsset;

export interface ApiModList extends ApiSearchResult<ApiMod> {
    query: string | null;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface ApiSessionDevice {
    /** `null` when the client sent no User-Agent (or an empty one). */
    user_agent: string | null;
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

/**
 * Cleanup state of an instance, or null when there is nothing to report (automatic cleanup disabled,
 * or the instance cannot be evaluated — e.g. its relay is offline).
 */
export type ApiInstanceLifecycle =
    | { type: 'persistent' }
    /** `key` is the grace reason (label under `admin.instance_grace_<key>`), `expires` the deadline. */
    | { type: 'grace'; key: 'created' | 'assigned' | 'startup'; expires: number }
    /** Scheduled removal at `at` (epoch ms). */
    | { type: 'removal'; at: number };

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
    lifecycle: ApiInstanceLifecycle | null;
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

/**
 * Cleanup state of a relay, or null when there is nothing to report (provider not managed by the
 * node, auto-management disabled, or the relay hosting instances — a busy relay is never removed).
 */
export type ApiRelayLifecycle =
    | { type: 'persistent' }
    /** `key` is the grace reason (label under `admin.relay_grace_<key>`), `expires` the deadline. */
    | { type: 'grace'; key: 'startup' | 'disconnect'; expires: number }
    /** Scheduled removal at `at` (epoch ms). */
    | { type: 'removal'; at: number };

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
    lifecycle: ApiRelayLifecycle | null;
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
    /** Cleanup state from the instance reaper, or null when there is nothing to report. */
    lifecycle: ApiInstanceLifecycle | null;
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




// ── Releases (asset API) ──────────────────────────────────────────────────────

export type ApiReleaseChannel = 'stable' | 'candidate' | 'nightly';

/** Steps of a running process (upload, analysis…). */
export interface ApiProcessProgress {
    current: number;
    total: number;
}

/** Detailed process status, returned for resources that are not complete yet. */
export interface ApiProcessStatus {
    status: string;
    progress: ApiProcessProgress | null;
    message: string | null;
}

/** Shorthand status string (`"completed"`), or the detailed object. */
export type ApiProcessState = string | ApiProcessStatus;

/**
 * Upload rules enforced server-side on the files of an asset kind, published by
 * `GET /configs` (`assets[].rules`): attribute keys every file must declare, and
 * attribute key groups that must stay unique across a release.
 */
export interface ApiUploadRules {
    /** Attribute keys every file of the release must declare. */
    required?: string[];
    /** Attribute key groups whose combination must stay unique across the release. */
    unique?: string[][];
}

/** One asset kind published by `GET /configs` (`assets`). */
export interface ApiConfigAsset {
    /** Asset type, as used by the asset payloads (`avatar`, `world`, `mod`). */
    type: string;
    /** Nox identifier type letter (`a`, `w`, `m`). */
    key: string;
    /** Route segment of the asset endpoints (`avatars`, `worlds`, `mods`). */
    endpoint: string;
    /** Rules enforced on the files of this kind; `{}` when it accepts anything. */
    rules: ApiUploadRules;
}

/** One published release of an asset (`GET /{endpoint}/{id}/releases`). */
export interface ApiReleaseItem {
    id: number;
    /** Version slug, unique within the asset (e.g. `v1.0.2`). */
    name: string;
    title: string | null;
    /** Markdown changelog. */
    changelog: string | null;
    channel: ApiReleaseChannel;
    alias: ApiAlias[];
    status: ApiProcessState;
    /** Epoch ms; missing on servers older than the changelog support. */
    created_at?: number;
    expires_at?: number;
    refetch_at?: number;
}

export interface ApiReleaseList {
    query: string | null;
    limit: number;
    offset: number;
    total: number;
    items: ApiReleaseItem[];
}

/** One file of a release (`GET …/releases/{releaseRef}/files`). */
export interface ApiReleaseFile {
    id: number;
    name: string | null;
    url: string | { proxified: string; original: string };
    size: number;
    mime: string;
    hashs: string[];
    uploader: string | number;
    status: ApiProcessState;
    attributes: ApiAlias[];
    analysis: Record<string, unknown> | null;
    created_at: number;
    updated_at: number;
    signature: string | null;
    expires_at?: number;
    refetch_at?: number;
}

export interface ApiReleaseFileList {
    query: string | null;
    limit: number;
    offset: number;
    total: number;
    items: ApiReleaseFile[];
}
