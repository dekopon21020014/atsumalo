export default function AboutPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">About</h1>
      <p className="mb-2">
        Lab Scheduling is an open-source project designed to help research groups coordinate events and meetings.
      </p>
      <p className="mb-2">
        The source code is available on GitHub, and contributions via issues or pull requests are welcome.
      </p>
      <p>
        <a
          href="https://github.com/dekopon21020014/lab-scheduling"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/dekopon21020014/lab-scheduling
        </a>
      </p>
    </main>
  )
}
