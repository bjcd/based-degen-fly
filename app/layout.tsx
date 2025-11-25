import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Web3Provider } from "@/components/providers/Web3Provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fly.thebaseddegens.xyz"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Based Degen Sky",
  description: "Fly through obstacles",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/miniapp-icon-large.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/miniapp-icon-large.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Based Degen Sky",
    description: "Fly through obstacles",
    type: "website",
    images: [
      {
        url: `${siteUrl}/miniapp-icon-large.png`,
        width: 1200,
        height: 630,
        alt: "Based Degen Sky",
      },
    ],
  },
  other: {
    // CRITICAL: Single JSON meta tag for Farcaster miniapp embed
    // Format must include button object with action for validation to pass
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${siteUrl}/miniapp-icon-large.png`,
      button: {
        title: "PLAY NOW",
        action: {
          type: "launch_frame", // Use "launch_frame" for backward compatibility
          name: "Based Degen Sky",
          url: siteUrl,
          splashImageUrl: `${siteUrl}/miniapp-icon-large.png`,
          splashBackgroundColor: "#7c3aed",
        },
      },
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Web3Provider>
          {children}
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
