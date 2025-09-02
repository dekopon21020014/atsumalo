import type { ReactNode } from "react"

export const metadata = {
  title: "Atsumalo",
  description: "An application to coordinate schedules for research labs.",
}

export default function EnLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
