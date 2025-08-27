import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-gray-100 dark:bg-gray-900 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <Link href="/">Lab Scheduling</Link>
        </h1>
        <nav className="space-x-4">
          <Link href="/events">Events</Link>
        </nav>
      </div>
    </header>
  )
}
