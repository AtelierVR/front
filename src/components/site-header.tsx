import type { ReactNode } from 'react'
import { SidebarTrigger } from "@/components/ui/sidebar"

export interface SiteHeaderProps {
  children?: ReactNode;
  subtitle?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
}

export function SiteHeader(props: SiteHeaderProps = {}) {
  return <header className="relative flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
    <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 py-2 sticky top-0 z-10 bg-background">
      <SidebarTrigger className="-ml-1" />
      {props.before && <div className="flex items-center gap-2">
        {props.before}
      </div>}

      {(props.children || props.subtitle) && <div className="flex flex-row min-w-0 gap-1 lg:gap-3 items-center">
        {props.children && <h1 className="text-base font-medium leading-tight truncate">{props.children}</h1>}
        {props.subtitle && <div className="text-xs text-muted-foreground leading-tight truncate flex items-center gap-2">
          {props.subtitle}
        </div>}
      </div>}

      {props.after && <div className="ml-auto flex items-center gap-2">
        {props.after}
      </div>}
    </div>
  </header>;
}
