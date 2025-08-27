"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
  ]
  return (
    <header className="bg-black/80 backdrop-blur border-b border-gray-800">
      <div className="container mx-auto flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold tracking-tight">
          <Link href="/" className="text-white">
            Lab Scheduling
          </Link>
        </h1>
        <nav className="space-x-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-gray-300 hover:text-white transition-colors ${
                pathname === item.href ? "text-white underline" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
