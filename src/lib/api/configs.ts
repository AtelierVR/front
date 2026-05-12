import { fetchWellKnown } from './wellknown';

export interface InstanceConfig {
  allowUserRegistration: boolean;
  allowInstanceCreation: boolean;
  allowInstanceCreationByExternal: boolean;
  allowWorldCreation: boolean;
  allowWorldCreationByExternal: boolean;
  allowAvatarCreation: boolean;
  allowAvatarCreationByExternal: boolean;
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
