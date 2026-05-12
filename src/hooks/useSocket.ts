'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiCurrentUser } from '@/types/api';

export interface WsFrame {
    type: string;
    payload?: unknown;
    [key: string]: unknown;
}

/** Shape of the `hello` payload received after connection. */
export type WsHelloPayload =
    | { mode: 'guest' }
    | { mode: 'user'; user: ApiCurrentUser }
    | { mode: 'relay'; relayId: number };

/** Synthetic events emitted by the hook itself (not from server frames). */
export interface WsSyntheticEvents {
    /** Fired once when the server `hello` frame is received. */
    connected: WsHelloPayload;
    /** Fired when the socket closes (intentional or not). */
    disconnected: undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WsHandler<T = any> = (payload: T) => void;

interface UseSocketOptions {
    /** WebSocket URL, e.g. "wss://example.com/ws" */
    url: string | null;
    /**
     * User bearer token injected as `?auth=<token>` query param.
     * Pass `null` to connect as a guest (no credentials).
     */
    token: string | null | undefined;
}

interface UseSocketReturn {
    /** True once the socket is open and the `hello` frame has been received. */
    connected: boolean;
    /** Auth mode resolved by the server after handshake. */
    authMode: 'guest' | 'user' | 'relay' | null;
    /** Send a typed JSON frame to the server. */
    send: (type: string, payload?: unknown) => void;
    /** Subscribe to one or more named server event rooms. */
    subscribe: (events: string[]) => void;
    /** Unsubscribe from one or more named server event rooms. */
    unsubscribe: (events: string[]) => void;
    /**
     * Listen to a specific frame type coming from the server,
     * or to a synthetic lifecycle event:
     *   - `"connected"`    → fired on `hello` (payload: WsHelloPayload)
     *   - `"disconnected"` → fired on socket close
     *
     * Returns an unsubscribe function.
     */
    on<K extends keyof WsSyntheticEvents>(type: K, fn: WsHandler<WsSyntheticEvents[K]>): () => void;
    on(type: string, fn: WsHandler): () => void;
}

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export function useSocket({ url, token }: UseSocketOptions): UseSocketReturn {
    const [connected, setConnected] = useState(false);
    const [authMode, setAuthMode] = useState<'guest' | 'user' | 'relay' | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const attemptsRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // frame type → listener set
    const listenersRef = useRef<Map<string, Set<WsHandler>>>(new Map());

    const emit = useCallback((type: string, payload: unknown) => {
        listenersRef.current.get(type)?.forEach((fn) => fn(payload));
    }, []);

    const on = useCallback((type: string, fn: WsHandler): (() => void) => {
        if (!listenersRef.current.has(type)) listenersRef.current.set(type, new Set());
        listenersRef.current.get(type)!.add(fn);
        return () => listenersRef.current.get(type)?.delete(fn);
    }, []);

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const closeIntentionally = useCallback(() => {
        clearReconnectTimer();
        const ws = wsRef.current;
        if (ws) {
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;
            ws.onopen = null;
            ws.close();
            wsRef.current = null;
        }
        setConnected(false);
        setAuthMode(null);
    }, []);

    const connect = useCallback(() => {
        if (!url) return;

        const wsUrl = token ? `${url}?auth=${encodeURIComponent(token)}` : url;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => { attemptsRef.current = 0; };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string) as WsFrame;

                if (msg.type === 'hello') {
                    const hello = msg.payload as WsHelloPayload;
                    setAuthMode(hello.mode);
                    setConnected(true);
                    emit('connected', hello);
                }

                emit(msg.type, msg.payload);
            } catch {
                // Ignore malformed frames
            }
        };

        ws.onerror = () => { /* let onclose handle reconnect */ };

        ws.onclose = () => {
            if (wsRef.current !== ws) return;
            wsRef.current = null;
            setConnected(false);
            setAuthMode(null);
            emit('disconnected', undefined);

            const backoff = Math.min(MIN_BACKOFF_MS * 2 ** attemptsRef.current, MAX_BACKOFF_MS);
            attemptsRef.current += 1;
            reconnectTimerRef.current = setTimeout(connect, backoff);
        };
    }, [url, token, emit]);

    useEffect(() => {
        closeIntentionally();
        if (url) connect();
        return () => { closeIntentionally(); };
    }, [url, token, connect, closeIntentionally]);

    const send = useCallback((type: string, payload?: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({ type, ...(payload !== undefined ? { payload } : {}) }),
            );
        }
    }, []);

    const subscribe = useCallback((events: string[]) => { send('subscribe', { events }); }, [send]);
    const unsubscribe = useCallback((events: string[]) => { send('unsubscribe', { events }); }, [send]);

    return { connected, authMode, send, subscribe, unsubscribe, on } as UseSocketReturn;
}
