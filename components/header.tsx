"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/builder", label: "Builder" },
  ]
  return (
    <header className="bg-gray-100 dark:bg-gray-900 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <Link href="/">Lab Scheduling</Link>
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
        </nav>
      </div>
    </header>
  )
}
