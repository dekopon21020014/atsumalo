import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, BarChart2, Settings, Users, CheckCircle, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <section className="relative isolate overflow-hidden bg-black text-white py-32">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">Atsumalo</h1>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Simplify and streamline the scheduling of lab events and meetings.
          </p>
          <Button asChild size="lg" className="font-semibold">
            <Link href="/en/builder">Start scheduling</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Enter candidate dates and share them to quickly find the best schedule.</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <BarChart2 className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">Real-time Aggregation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Check responses in real time and see results immediately.</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Settings className="mx-auto h-12 w-12 text-black" />
              <CardTitle className="mt-4">Flexible Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Supports both recurring and one-off events with flexible configuration.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <Users className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">Invite Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Share an invitation link with all participants effortlessly.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Calendar className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">Vote on Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Participants choose the dates that work best for them.</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="mx-auto h-12 w-12 text-black" />
                <CardTitle className="mt-4">Decide the Best Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Quickly decide on the optimal schedule based on the results.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Get Started Now</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Make scheduling in your lab efficient.
        </p>
        <Button asChild size="lg">
          <Link href="/en/builder">
            Try it for free <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </main>
  )
}
