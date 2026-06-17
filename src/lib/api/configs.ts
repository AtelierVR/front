import { fetchWellKnown } from './wellknown';

export interface InstanceConfig {
  allow_user_registration: boolean;
  allow_instance_creation: boolean;
  allow_instance_creation_by_external: boolean;
  allow_world_creation: boolean;
  allow_world_creation_by_external: boolean;
  allow_avatar_creation: boolean;
  allow_avatar_creation_by_external: boolean;
  regions: string[];
  allowed_image_widths: number[];
}

export async function fetchConfigs(): Promise<InstanceConfig | null> {
  const wk = await fetchWellKnown();
  if (!wk) return null;
  const configsUrl = wk.endpoints.configs;
  try {
    const res = await fetch(configsUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const envelope = await res.json() as { data?: InstanceConfig };
    return envelope.data ?? null;
  } catch {
    return null;
  }
}
