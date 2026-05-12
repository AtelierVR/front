"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavOptions } from "@/components/nav-options"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Icon } from "@iconify/react"
import { InstanceLogo } from "./layout/InstanceLogo"
import { resolveLocalized } from "@/lib/i18n/resolveLocalized"
import { useApi } from "@/lib/api/context"
import i18n from "@/lib/i18n/config"
import { useTranslation } from "react-i18next"

function source(admin: boolean = false) {
  const { t } = useTranslation();
  return {
    main: [
      {
        title: t('dashboard.title'),
        url: "/dashboard",
        icon: <Icon icon="material-symbols:dashboard-rounded" />
      },
      ...(admin ? [
        {
          title: t('admin.relays'),
          url: "/relays",
          icon: <Icon icon="material-symbols:cell-tower-rounded" />
        },
        {
          title: t('admin.activity'),
          url: "/activity",
          icon: <Icon icon="material-symbols:history-rounded" />
        },
        {
          title: t('admin.logs'),
          url: "/logs",
          icon: <Icon icon="material-symbols:terminal-rounded" />
        },
        {
          title: t('admin.environment'),
          url: "/environment",
          icon: <Icon icon="material-symbols:tune-rounded" />
        },
      ] : [])
    ],
    secondary: [
      {
        title: t('settings.title'),
        url: "/settings",
        icon: <Icon icon="material-symbols:settings-rounded" />
      }
    ]
  };
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { wellKnown, isAdmin } = useApi();
  const name = resolveLocalized(wellKnown?.metadata?.title, i18n.language) || 'Nox';

  const { main, secondary } = source(isAdmin);

  const mainWithActive = main.map(item => ({
    ...item,
    isActive: pathname === item.url
      || (item.url !== "/admin" && pathname.startsWith(item.url)),
  }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem key={name}>
            <SidebarMenuButton
              size="lg"
              tooltip={name}
              isActive={true}
              render={<Link href={"/"} />}
            >
              <InstanceLogo className="size-8" />
              <span>{name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainWithActive} />
        <NavSecondary items={secondary} className="mt-auto" />
        <NavOptions />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
