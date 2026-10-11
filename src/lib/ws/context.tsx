'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { WsFrame, WsHelloPayload } from '@/hooks/useSocket';
import { useApi } from '@/lib/api/context';
import {
    dispatchCurrentUserReplace,
    dispatchCurrentUserMerge,
} from '@/lib/api/client';
import { entityStore } from '@/lib/cache/store';
import type { ApiUser, ApiWorld, ApiInstance } from '@/types/api';

// ── Types ────────────────────────────────────────────────────────────────────

type WsEventHandler = (payload: unknown) => void;

interface WsContextValue {
    /** True once the server has confirmed the connection with a `hello` frame. */
    connected: boolean;
    /** Auth mode reported by the server: guest | user | relay | null */
    authMode: 'guest' | 'user' | 'relay' | null;
    /** Subscribe to one or more named server event rooms. */
    subscribe: (events: string[]) => void;
    /** Unsubscribe from one or more named server event rooms. */
    unsubscribe: (events: string[]) => void;
    /** Send an arbitrary typed frame to the server. */
    send: (type: string, payload?: unknown) => void;
    /** Register a handler for a specific event name (room events). */
    on: (event: string, handler: WsEventHandler) => () => void;
    /** Subscribe to a single event with ref-counting (for useWsEvent). */
    subscribeEvent: (event: string) => void;
    /** Unsubscribe from a single event with ref-counting (for useWsEvent). */
    unsubscribeEvent: (event: string) => void;
}

const WsContext = createContext<WsContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function WsProvider({ children }: { children: React.ReactNode }) {
    const { wellKnown, token, isLoading } = useApi();

    // Map of event name → set of handlers (for `on()` exposé via contexte)
    const handlersRef = useRef<Map<string, Set<WsEventHandler>>>(new Map());
    // Ref-count of active useWsEvent subscriptions per event name
    const subCountRef = useRef<Map<string, number>>(new Map());

    // Don't open the socket until auth state has settled (avoids a guest
    // connection immediately followed by a reconnect with the user token).
    const wsUrl = !isLoading && wellKnown ? (wellKnown.gateway?.ws ?? null) : null;

    const { connected, authMode, send, subscribe, unsubscribe, on: wsOn } = useSocket({
        url: wsUrl,
        token: token ?? null,
    });

    // ── Wire lifecycle events into the entity cache ─────────────────────────

    useEffect(() => {
        return wsOn('connected', (hello: WsHelloPayload) => {
            if (hello.mode === 'user' && hello.user) {
                entityStore.put(`user:${hello.user.username}@${hello.user.server}`, hello.user);
                dispatchCurrentUserReplace(hello.user);
            }
        });
    }, [wsOn]);

    useEffect(() => {
        // Route every server frame to the entity cache and registered handlers.
        // Two frame shapes are accepted:
        //   - room events:     { type: 'event', payload: { name, data } }
        //   - targeted frames: { type: <name>, payload: data } (e.g. notification)
        const route = (name: string, data: unknown) => {
            if (name === 'user:update') {
                const user = data as ApiUser;
                entityStore.put(`user:${user.username}@${user.server}`, user);
                dispatchCurrentUserMerge(user);
            } else if (name === 'world:update') {
                const world = data as ApiWorld;
                entityStore.put(`world:${world.id}`, world);
            } else if (name === 'instance:update') {
                const instance = data as ApiInstance;
                entityStore.put(`instance:${instance.id}`, instance);
            }

            handlersRef.current.get(name)?.forEach((h) => h(data));
        };

        return wsOn('*', (payload) => {
            const frame = payload as WsFrame;
            if (frame.type === 'event') {
                const { name, data } = frame.payload as {
                    name: string;
                    data: unknown;
                };
                route(name, data);
                return;
            }
            route(frame.type, frame.payload);
        });
    }, [wsOn]);

    // ── Context `on` — routes named room events to registered handlers ──────

    const on = useCallback((event: string, handler: WsEventHandler): (() => void) => {
        if (!handlersRef.current.has(event)) {
            handlersRef.current.set(event, new Set());
        }
        handlersRef.current.get(event)!.add(handler);
        return () => handlersRef.current.get(event)?.delete(handler);
    }, []);

    // ── Re-subscribe all active events after (re)connect ─────────────────────
    // This handles both the initial connection (if subscribeEvent was called
    // before the socket was open) and reconnects after a server restart.

    useEffect(() => {
        if (!connected) return;
        const active = [...subCountRef.current.entries()]
            .filter(([, count]) => count > 0)
            .map(([event]) => event);
        if (active.length > 0) subscribe(active);
    }, [connected, subscribe]);

    // ── Ref-counted subscribe/unsubscribe for useWsEvent ─────────────────────

    const subscribeEvent = useCallback((event: string) => {
        const count = subCountRef.current.get(event) ?? 0;
        subCountRef.current.set(event, count + 1);
        if (count === 0) subscribe([event]);
    }, [subscribe]);

    const unsubscribeEvent = useCallback((event: string) => {
        const count = subCountRef.current.get(event) ?? 0;
        const next = Math.max(0, count - 1);
        subCountRef.current.set(event, next);
        if (next === 0) unsubscribe([event]);
    }, [unsubscribe]);

    return (
        <WsContext.Provider value={{ connected, authMode, send, subscribe, unsubscribe, on, subscribeEvent, unsubscribeEvent }}>
            {children}
        </WsContext.Provider>
    );
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Access the global native WebSocket connection.
 * Must be used inside <WsProvider>.
 */
export function useWs(): WsContextValue {
    const ctx = useContext(WsContext);
    if (!ctx) throw new Error('useWs must be used within <WsProvider>');
    return ctx;
}

/**
 * Subscribe to a server-emitted named event.
 * The subscription is active while the component is mounted.
 *
 * @example
 * useWsEvent('activity', (data) => console.log(data));
 */
export function useWsEvent(event: string, handler: WsEventHandler): void {
    const { on, subscribeEvent, unsubscribeEvent } = useWs();
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    React.useEffect(() => {
        subscribeEvent(event);
        const unsub = on(event, (payload) => handlerRef.current(payload));
        return () => {
            unsub();
            unsubscribeEvent(event);
        };
    }, [on, subscribeEvent, unsubscribeEvent, event]);
}

/**
 * Run `handler` whenever the WebSocket **re**connects, so the data on screen can be resynced.
 *
 * Only a `disconnected → connected` transition counts, and only once the socket has been seen
 * open at least once by this component:
 *  - mounting while the socket is already up (client-side navigation) never fires;
 *  - connecting for the first time after a page load never fires — the page already fetched over
 *    HTTP, and the socket being late has nothing to do with that data;
 *  - a drop (server restart, network blip, account switch) followed by a reconnect fires.
 *
 * @example
 * useWsReconnect(() => void refetch());
 */
export function useWsReconnect(handler: () => void): void {
    const { connected } = useWs();

    // Latest handler, refreshed in an effect (writing a ref during render is not allowed).
    const handlerRef = useRef(handler);
    React.useEffect(() => { handlerRef.current = handler; }, [handler]);

    /** True once this component has seen the socket open. */
    const wasUpRef = useRef(connected);
    /** True once the socket was seen closed *after* it had been open. */
    const wentDownRef = useRef(false);

    React.useEffect(() => {
        if (!connected) {
            if (wasUpRef.current) wentDownRef.current = true;
            return;
        }
        if (wasUpRef.current && wentDownRef.current) {
            wentDownRef.current = false;
            handlerRef.current();
        }
        wasUpRef.current = true;
    }, [connected]);
}

