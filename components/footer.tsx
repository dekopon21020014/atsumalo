"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Footer() {
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const prefix = isEnglish ? "/en" : ""
  const privacyLabel = isEnglish ? "Privacy Policy" : "プライバシーポリシー"
  const aboutLabel = isEnglish ? "About" : "このサイトについて"

  return (
    <footer className="text-center p-4">
      © dekopon21020014
      <span className="mx-2">|</span>
      <Link href={`${prefix}/privacy`} className="underline">
        {privacyLabel}
      </Link>
      <span className="mx-2">|</span>
      <Link href={`${prefix}/about`} className="underline">
        {aboutLabel}
      </Link>
    </footer>
  )
}
