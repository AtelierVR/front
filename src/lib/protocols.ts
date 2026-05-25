export interface Protocol {
    icon: string;
    label: string;
}

export interface Protocols {
    [key: string]: Protocol | ((key: string) => Protocol);
    default: Protocol | ((key: string) => Protocol);
}

export const PROTOCOLS: Protocols = {
    quic: { label: 'protocols.quic', icon: 'material-symbols:bolt-rounded' },
    tcp:  { label: 'protocols.tcp',  icon: 'material-symbols:cable-rounded' },
    udp:  { label: 'protocols.udp',  icon: 'material-symbols:stream-rounded' },
    ws:   { label: 'protocols.ws',   icon: 'material-symbols:swap-horiz-rounded' },
    wss:  { label: 'protocols.wss',  icon: 'material-symbols:lock-rounded' },
    default: (key: string) => ({
        icon: 'material-symbols:lan',
        label: `protocols.${key}`,
    }),
};

export function getProtocol(key: string): Protocol {
    const entry = PROTOCOLS[key.toLowerCase()] ?? PROTOCOLS.default;
    return typeof entry === 'function' ? entry(key.toLowerCase()) : entry;
}
