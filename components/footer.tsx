"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Footer() {
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const prefix = isEnglish ? "/en" : ""
  const label = isEnglish ? "Privacy Policy" : "プライバシーポリシー"

  return (
    <footer className="text-center p-4">
      © dekopon21020014
      <span className="mx-2">|</span>
      <Link href={`${prefix}/privacy`} className="underline">
        {label}
      </Link>
    </footer>
  )
}
