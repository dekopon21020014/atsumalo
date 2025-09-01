export default function AboutPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">About</h1>

      <section className="mb-6">
        <p className="mb-2">
          This project is an open-source tool designed to simplify event coordination for laboratories and small groups.
          It supports both one-time events and recurring meetings.
        </p>
        <p className="mb-2">
          The repository is available on GitHub, and contributions via issues or pull requests are welcome.
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
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Purpose</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Reduce back-and-forth coordination by providing simple candidate options and summaries.</li>
          <li>Enable lightweight usage without setup or account creation.</li>
          <li>Offer open source code that can be extended for local environments.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Key Features</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Create candidates for one-time or recurring events.</li>
          <li>Share URLs to collect availability and view aggregated results.</li>
          <li>Minimal input fields for participants.</li>
          <li>Automatic deletion of events after 3 months.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Retention and Deletion</h2>
        <p className="mb-2">
          Events are automatically deleted 3 months after creation. Access logs required for operation are only retained temporarily.
        </p>
        <p className="mb-2">
          For details, see the{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Security and Limitations</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Communication is not encrypted, so do not enter confidential information.</li>
          <li>We are not responsible for any damages arising from use of this service.</li>
          <li>Access may be restricted in cases of abuse or unauthorized use.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Technology Stack</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>React / TypeScript</li>
          <li>Tailwind CSS</li>
          <li>Designed with a lightweight backend and simple persistence layer in mind.</li>
        </ul>
        <p className="text-sm text-gray-600 mt-1">
          See the README and source code in the repository for implementation details.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How to Contribute</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Open an issue for proposals or bug reports.</li>
          <li>Fork the repository, create a branch, and commit your changes.</li>
          <li>Create a pull request with background and test instructions.</li>
        </ol>
        <p className="text-sm text-gray-600 mt-1">
          Even small fixes are welcome. Follow contribution templates if available.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">License</h2>
        <p className="mb-2">
          Refer to the LICENSE file in the repository. Dependencies follow their respective licenses.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact and Credits</h2>
        <p className="mb-2">
          Contact information is available in the repository. Feedback from users is always welcome.
        </p>
        <p className="text-sm text-gray-600">
          This project grows with contributions from the community. Thanks to all testers and contributors.
        </p>
      </section>
    </main>
  )
}
