"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()
  const isEnglish = pathname.startsWith("/en")
  const prefix = isEnglish ? "/en" : ""
  const navItems = [
    { href: prefix || "/", label: "Home" },
    { href: `${prefix}/builder`, label: "Builder" },
    { href: `${prefix}/about`, label: "About" },
  ]
  const langHref = isEnglish
    ? pathname.replace(/^\/en/, "") || "/"
    : `/en${pathname === "/" ? "" : pathname}`
  const langLabel = isEnglish ? "Japanese" : "English"
  return (
    <header className="bg-gray-100 dark:bg-gray-900 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <Link href={prefix || "/"}>Lab Scheduling</Link>
        </h1>
        <nav className="space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "font-semibold underline" : ""}
            >
              {item.label}
            </Link>
          ))}
          <Link href={langHref}>{langLabel}</Link>
        </nav>
      </div>
    </header>
  )
}
