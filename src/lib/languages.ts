import { countriesService } from './countries';

/**
 * Returns a flag image URL for a locale by resolving its CCA3 code via countriesService.
 */
export async function localeFlagUrl(cca: string): Promise<string | null> {
    const country = await countriesService.getByISO(cca);
    return country?.flags.svg || country?.flags.png || null;
}
