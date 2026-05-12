import { ApiAlias } from "@/types/api";

export function getAlias(aliases: ApiAlias[], key: string): string | null {
  const alias = aliases.find(a => a.key === key);
  return alias ? alias.value : null;
}
