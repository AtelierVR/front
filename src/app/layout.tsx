import type { Metadata } from 'next'
import { Funnel_Display, Inter } from 'next/font/google'
import './globals.css'
import { ApiProvider } from '@/lib/api/context'
import { I18nProvider } from '@/lib/i18n/I18nProvider'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { StatusBanner } from '@/components/layout/StatusBanner'
import { WsProvider } from '@/lib/ws/context'
import { SITE_TITLE, SITE_TITLE_TEMPLATE } from '@/lib/site'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FumadocsProvider } from '@/lib/fumadocs-provider'

const funnelDisplay = Funnel_Display({
  subsets: ['latin'],
  variable: '--font-funnel-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: SITE_TITLE_TEMPLATE },
  description: 'Nox — federated VR & social platform'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${funnelDisplay.variable} ${inter.variable} font-body antialiased`}>
        <FumadocsProvider>
        <I18nProvider>
          <ApiProvider>
            <WsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <TooltipProvider>
                  <StatusBanner />
                  {children}
                </TooltipProvider>
              </ThemeProvider>
            </WsProvider>
          </ApiProvider>
        </I18nProvider>
        </FumadocsProvider>
      </body>
    </html>
  )
}
