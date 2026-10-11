/**
 * WebSocket event names — mirror of the node's `src/events/websocket-frames.ts`.
 *
 * Same convention on both sides (`domain.action`). The node publishes a domain event and a single
 * bridge forwards it, so the string a page subscribes to is exactly the string the service emitted.
 *
 * ## Naming: the three tiers
 *
 * | Channel    | Naming        | Where it is defined |
 * | ---------- | ------------- | ------------------- |
 * | in-process | `<Type>Event` | `node/src/events/domain-events.ts` — never leaves the server |
 * | WebSocket  | `ApiWs<Type>` | here + the node's `websocket-frames.ts` — **sanitised** subset |
 * | REST       | `Api<Type>`   | `src/types/api.ts` — sanitised request/response body |
 *
 * A frame is not the internal event: the node builds a narrower object on purpose, so fields that
 * are only meaningful server-side (a client connection address, a provider id, TPS overrides) are
 * simply absent here. That is why a few `ApiWs` payloads are *not* the same shape as their
 * `Api` counterpart — see `ApiWsRelayClientConnected`, which is flattened.
 *
 * Keep in sync with `node/src/events/websocket-frames.ts` when adding a frame.
 */
import type { ApiRelaySpecs } from '@/types/api';

export const WsEvents = {
    INSTANCE_CREATED: 'instance.created',
    INSTANCE_UPDATED: 'instance.updated',
    INSTANCE_REMOVED: 'instance.removed',
    INSTANCE_LIFECYCLE: 'instance.lifecycle',

    RELAY_CREATED: 'relay.created',
    RELAY_UPDATED: 'relay.updated',
    RELAY_REMOVED: 'relay.removed',
    RELAY_STATUS: 'relay.status',
    RELAY_LIFECYCLE: 'relay.lifecycle',
    RELAY_LOGS: 'relay.logs',
    RELAY_SPECS: 'relay.specs',

    RELAY_INSTANCE_ASSIGNED: 'relay.instance.assigned',
    RELAY_INSTANCE_UNASSIGNED: 'relay.instance.unassigned',
    RELAY_INSTANCE_SETTINGS: 'relay.instance.settings',

    RELAY_CLIENT_CONNECTED: 'relay.client.connected',
    RELAY_CLIENT_DISCONNECTED: 'relay.client.disconnected',
    RELAY_CLIENT_AUTHENTIFIED: 'relay.client.authentified',
    RELAY_PLAYER_JOIN: 'relay.player.join',
    RELAY_PLAYER_LEAVE: 'relay.player.leave',
    NOTIFICATION: 'notification',
} as const;

// ── Payloads ─────────────────────────────────────────────────────────────────
// Mirrors of the node's `ApiWs<…>` interfaces. Only the fields the server actually sends are
// declared: a handler reading anything else is reading something the node does not transmit.

/** Client-safe view of a client connection (flattened, no address/platform). */
export interface ApiWsRelayClientConnected {
    relay_id: number;
    id: number;
    engine: string;
    user: string | null;
    connected_at: number;
    time: number;
}

export interface ApiWsRelayClientDisconnected {
    relay_id: number;
    id: number;
    type: string;
    time: number;
}

export interface ApiWsRelayClientAuthentified {
    relay_id: number;
    client_id: number;
    user: string;
    time: number;
}

/** Client-safe view of a player joining (flattened, no flags). */
export interface ApiWsRelayPlayerJoin {
    relay_id: number;
    client_id: number;
    player_id: number;
    display: string;
    internal_id: number;
    joined_at: number;
    time: number;
}

export interface ApiWsRelayPlayerLeave {
    relay_id: number;
    player_id: number;
    internal_id: number;
    type: string;
    time: number;
}

export interface ApiWsRelayLog {
    time: number;
    level: string;
    message: string;
    tag: string | null;
}

export interface ApiWsRelaySpecs {
    relay_id: number;
    details: ApiRelaySpecs;
    time: number;
}

export interface ApiWsRelayStatus {
    relay_id: number;
    status: 'connected' | 'disconnected' | 'ready' | 'up' | 'down';
    time: number;
}

export interface ApiWsRelayLifecycle {
    relay_id: number;
    time: number;
}

export interface ApiWsRelayCreated {
    relay_id: number;
    provider: string;
    time: number;
}

export interface ApiWsRelayRemoved {
    relay_id: number;
    time: number;
}

export interface ApiWsRelayInstanceAssignment {
    relay_id: number;
    instance_id: number;
    action: 'assigned' | 'unassigned' | 'deleted';
    time: number;
}

export interface ApiWsRelayInstanceSettings {
    relay_id: number;
    internal_id: number;
    tps: number;
    threshold: number;
    time: number;
}

export interface ApiWsInstanceCreated {
    instance_id: number;
    time: number;
}

export interface ApiWsInstanceUpdated {
    instance_id: number;
    fields: string[];
    time: number;
}

export interface ApiWsInstanceRemoved {
    instance_id: number;
    reason: string;
    time: number;
}

/** Cleanup state moved (grace → scheduled removal, or the reverse). */
export interface ApiWsInstanceLifecycle {
    instance_id: number;
    relay_id: number | null;
    lifecycle: 'grace' | 'removal';
    time: number;
}

/** A notification pushed to its recipient's clients. `type` carries the kind. */
export interface ApiWsNotification<T = any> {
    type: string;
    key: string | null;
    from: string | null;
    data: T | null;
}
