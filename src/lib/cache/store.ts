type Listener = () => void;

/**
 * Generic module-level entity cache keyed by arbitrary strings.
 *
 * Callers choose their own namespacing convention, e.g.:
 *   "user:alice"       → ApiUser
 *   "world:42"         → ApiWorld
 *   "instance:7"       → ApiInstance
 *
 * Each key has its own listener set so only affected subscribers re-render.
 */
class EntityStore {
    private _data = new Map<string, unknown>();
    private _subs = new Map<string, Set<Listener>>();

    /** Store a value under `key` and notify all subscribers for that key. */
    put(key: string, value: unknown): void {
        this._data.set(key, value);
        this._subs.get(key)?.forEach((fn) => fn());
    }

    /** Retrieve the value stored under `key`, typed as `T`. Returns `null` if absent. */
    get<T>(key: string): T | null {
        return (this._data.get(key) as T) ?? null;
    }

    /**
     * Subscribe to changes for `key`.
     * Returns an unsubscribe function — call it in a `useEffect` cleanup.
     */
    subscribe(key: string, fn: Listener): () => void {
        if (!this._subs.has(key)) this._subs.set(key, new Set());
        this._subs.get(key)!.add(fn);
        return () => this._subs.get(key)?.delete(fn);
    }
}

export const entityStore = new EntityStore();
