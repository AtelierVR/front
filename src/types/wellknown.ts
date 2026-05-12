export interface NoxSoftware {
  name: string;
  version: string;
}

export interface NoxGateway {
  web: string;
  ws: string;
  api: string;
}

export interface NoxEndpoints {
  wellknown: string;
  webfinger: string;
  nodeinfo: string;
  configs: string;
}

export interface NoxVersions {
  node: string;
  terms: string;
  privacy: string;
  rules: string;
}

export type NoxSocials = Record<string, string | string[]>;

/** A field that is either a plain string or a locale\u2192string map. */
export type NoxLocalizedString = string | Record<string, string>;

export interface NoxMetadata {
  title: NoxLocalizedString;
  description: NoxLocalizedString | null;
  icon: string | Record<string, string> | null;
  contact: string | null;
  socials: NoxSocials;
}

export interface NoxWellKnown {
  id: string;
  software: NoxSoftware;
  status: 'online' | 'maintenance' | 'degraded';
  started: number;
  public: string;
  address: string;
  port: number;
  gateway: NoxGateway;
  endpoints: NoxEndpoints;
  versions: NoxVersions;
  metadata: NoxMetadata;
  features: string[];
  capabilities: string[];
  maintenance: string | null;
}
