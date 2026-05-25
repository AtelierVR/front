export interface Info {
  icon: string;
  label: string;
  color: string;
}

export const PLATFORMS: Record<string, Info> = {
  windows: { icon: 'mdi:microsoft-windows', label: 'platform.windows', color: '#0079D5' },
  linux: { icon: 'mdi:linux', label: 'platform.linux', color: '#F7C530' },
  macos: { icon: 'simple-icons:macos', label: 'platform.macos', color: '#A2AAAD' },
  android: { icon: 'mdi:android', label: 'platform.android', color: '#2FD77F' },
  ios: { icon: 'mdi:apple-ios', label: 'platform.ios', color: '#A2AAAD' },
  visionos: { icon: 'tabler:device-vision-pro', label: 'platform.visionos', color: '#BA50B1' },
};

export const ENGINES: Record<string, Info> = {
  unity: { icon: 'mdi:unity', label: 'engine.unity', color: '#959595' },
  ue4: { icon: 'mdi:unreal-engine', label: 'engine.ue4', color: '#5E5E5E' },
  ue5: { icon: 'mdi:unreal-engine', label: 'engine.ue5', color: '#5E5E5E' },
  godot: { icon: 'mdi:godot-engine', label: 'engine.godot', color: '#478CBF' },
  custom: { icon: 'mdi:cog', label: 'engine.custom', color: '#888888' },
};

export function formatSize(bytes: number): string {
  const units = ['o', 'ko', 'Mo', 'Go', 'To', 'Po'];
  let index = 0;

  while (bytes >= 1000 && index < units.length - 1) {
    bytes /= 1000;
    index++;
  }
  
  return `${bytes.toFixed(1)} ${units[index]}`;
}