import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

import type { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL('https://atsumalo.vercel.app'),
  title: {
    default: "あつま郎",
    template: "%s | あつま郎"
  },
  description: "大学の研究室などで日程を調整するためのアプリケーション",
  openGraph: {
    title: "あつま郎",
    description: "大学の研究室などで日程を調整するためのアプリケーション",
    url: 'https://atsumalo.vercel.app',
    siteName: 'あつま郎',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "あつま郎",
    description: "大学の研究室などで日程を調整するためのアプリケーション",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: "v0.dev",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Header />
          {children}
          <Toaster />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
