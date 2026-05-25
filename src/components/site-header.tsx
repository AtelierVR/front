import type { ReactNode } from 'react'

export interface SiteHeaderProps {
  children?: ReactNode;
  subtitle?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
}

export function SiteHeader(props: SiteHeaderProps = {}) {
  return (
    <div className="p-4 md:p-6 flex items-center justify-between gap-4 border-b">
      <div className="flex items-center gap-2 min-w-0">
        {props.before && (
          <div className="flex items-center shrink-0">
            {props.before}
          </div>
        )}
        <div className="min-w-0">
          {props.children && (
            <h1 className="text-2xl font-semibold tracking-tight">{props.children}</h1>
          )}
          {props.subtitle && (
            <p className="text-sm text-fd-muted-foreground mt-1">{props.subtitle}</p>
          )}
        </div>
      </div>
      {props.after && (
        <div className="flex items-center gap-2 shrink-0">
          {props.after}
        </div>
      )}
    </div>
  );
}
