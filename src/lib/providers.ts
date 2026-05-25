export interface Provider {
    icon: string;
    label: string;
}

export interface Providers {
    [key: string]: Provider | ((key: string) => Provider);
    default: Provider | ((key: string) => Provider);
}

export const PROVIDERS: Providers = {
    docker: {
        icon: 'logos:docker-icon',
        label: 'providers.docker',
    },
    external: {
        icon: 'material-symbols:open-in-new-rounded',
        label: 'providers.external',
    },
    default: (key: string) => ({
        icon: 'material-symbols:cloud-rounded',
        label: `providers.${key}`,
    }),
};

export function getProvider(key: string): Provider {
    const entry = PROVIDERS[key] ?? PROVIDERS.default;
    return typeof entry === 'function' ? entry(key) : entry;
}
