"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Icon } from "@iconify/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      className="toaster group"
      icons={{
        success: (
          <Icon icon="material-symbols:check-circle-rounded" className="size-4" />
        ),
        info: (
          <Icon icon="material-symbols:info-rounded" className="size-4" />
        ),
        warning: (
          <Icon icon="material-symbols:warning-rounded" className="size-4" />
        ),
        error: (
          <Icon icon="material-symbols:cancel-rounded" className="size-4" />
        ),
        loading: (
          <Icon icon="material-symbols:progress-activity" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
