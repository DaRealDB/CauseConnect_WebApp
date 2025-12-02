import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "CauseConnect - Connect with Causes That Matter",
  description:
    "A charity-driven social platform where users can discover, support, and engage with causes that make a difference.",
  generator: "v0.app",
  icons: {
    icon: "/causeconnect-icon.svg",
    shortcut: "/causeconnect-icon.svg",
    apple: "/causeconnect-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <Providers>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  )
}
