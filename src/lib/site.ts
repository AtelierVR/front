export const SITE_TITLE = 'Nox';
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_TITLE}`;

export function formatPageTitle(title: string | null): string {
  return title ? SITE_TITLE_TEMPLATE.replace('%s', title) : SITE_TITLE;
}
