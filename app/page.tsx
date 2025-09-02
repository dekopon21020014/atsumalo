import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, BarChart2, Settings, Users, CheckCircle, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <section className="relative isolate overflow-hidden bg-black text-white py-32">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">あつま郎</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            研究室のイベントやミーティングの日程調整をもっとシンプルに、スマートに。
          </p>
          <Button asChild size="lg" className="font-semibold">
            <Link href="/builder">日程調整を始める</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto py-20">
        <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">簡単操作</CardTitle>
            </CardHeader>
            <CardContent>
              <p>候補日を入力して参加者と共有するだけで、最適な日程を見つけられます。</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <BarChart2 className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">リアルタイム集計</CardTitle>
            </CardHeader>
            <CardContent>
              <p>回答状況をリアルタイムで確認し、即座に結果を把握できます。</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Settings className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">柔軟な設定</CardTitle>
            </CardHeader>
            <CardContent>
              <p>繰り返しイベントや単発イベントなど、さまざまな形式に対応しています。</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">使い方</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <Users className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">参加者を招待</CardTitle>
              </CardHeader>
              <CardContent>
                <p>イベントの参加者に簡単に招待リンクを共有できます。</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Calendar className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">候補日を投票</CardTitle>
              </CardHeader>
              <CardContent>
                <p>参加者は自分の都合の良い日程を選択して投票します。</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">ベストな日程を決定</CardTitle>
              </CardHeader>
              <CardContent>
                <p>集計された結果から最適な日程をすぐに決定できます。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">今すぐはじめましょう</h2>
        <p className="text-lg text-muted-foreground mb-8">
          あなたの研究室のスケジュール調整を効率的に。
        </p>
        <Button asChild size="lg">
          <Link href="/builder">
            無料で試す <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </main>
  )
}

