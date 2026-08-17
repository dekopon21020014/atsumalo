import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Atsumalo",
  description: "An application to coordinate schedules for research labs.",
}

export default function EnLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
