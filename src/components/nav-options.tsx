"use client"

import * as React from "react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"

export function NavOptions({
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-1 w-full">
              <LanguageSwitcher
                className="flex-1 flex"
                trigger={{
                  className: "flex-1 flex",
                }}
              />
              <ThemeToggle
                className="flex-1 flex"
                trigger={{
                  className: "flex-1 flex",
                }}
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
