import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="container mx-auto py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Lab Scheduling</h1>
      <p className="text-lg text-muted-foreground mb-8">
        研究室のイベントやミーティングの日程調整をスムーズに行えるWebアプリです。
      </p>
      <Button asChild>
        <Link href="/builder">日程調整を始める</Link>
      </Button>
      <section className="mt-16 grid gap-8 md:grid-cols-3 text-left">
        <div>
          <h2 className="text-xl font-semibold mb-2">簡単操作</h2>
          <p>候補日を入力して参加者と共有するだけで、最適な日程を見つけられます。</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">リアルタイム集計</h2>
          <p>回答状況をリアルタイムで確認し、即座に結果を把握できます。</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">柔軟な設定</h2>
          <p>繰り返しイベントや単発イベントなど、さまざまな形式に対応しています。</p>
        </div>
      </section>
    </main>
  )
}
