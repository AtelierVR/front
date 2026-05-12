"use client"

import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icon } from "@iconify/react"
import { useApi } from "@/lib/api/context"
import { Button } from "./ui/button"
import { useTranslation } from "react-i18next"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { currentUser, logout } = useApi()
  const { t } = useTranslation();

  const name = currentUser?.display ?? currentUser?.username ?? "Admin"
  const username = currentUser?.username ?? ""
  const initials = name.slice(0, 2).toUpperCase()
  const thumbnail = currentUser?.thumbnail ?? undefined

  return (
    <SidebarMenu>
      <SidebarMenuItem className="space-y-2">
        {!currentUser ? <>
          <Button variant="default" render={<Link href="/register" />} size="lg" className="w-full mt-2">
            {t('auth.register')}
          </Button>
          <Button variant="outline" render={<Link href="/login" />} size="lg" className="w-full">
            {t('auth.login')}
          </Button>
        </> : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={thumbnail} alt={name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-foreground/70">@{username}</span>
              </div>
              <Icon icon="material-symbols:more-vert" className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8">
                      <AvatarImage src={thumbnail} alt={name} />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">@{username}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/settings/profile" />}>
                  <Icon icon="material-symbols:account-circle" />
                  {t('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/" />}>
                  <Icon icon="material-symbols:open-in-new-rounded" />
                  {t('public_site')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <Icon icon="material-symbols:logout-rounded" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
