export default function PrivacyPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Basic Policy</h2>
        <p className="mb-2">
          This service values the protection of personal information, but communication is not encrypted.
          Do not enter confidential information.
        </p>
        <p className="mb-2">
          We are not responsible for any damages arising from the use of this service. Use at your own risk.
        </p>
        <p className="mb-2">
          Events created will be automatically deleted 3 months after creation.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information Not Collected</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>No personally identifiable information such as name, address, phone number, or email address is collected.</li>
          <li>Input content is not permanently stored.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information That May Be Collected</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access logs (IP address, user agent, access date and time).</li>
          <li>Error logs and minimal technical data for statistics.</li>
        </ul>
        <p className="mt-2">
          These are used only for service operation and quality improvement, not for identifying individuals.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Cookies and Local Storage</h2>
        <p className="mb-2">
          Cookies and local storage may be used in your browser to maintain sessions or save settings.
        </p>
        <p className="mb-2">
          You may disable them in your browser settings, but some features may not function properly.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Disclosure</h2>
        <p className="mb-2">
          Personal data will not be provided to third parties except as required by law. 
          If external analytics services are used, their scope and purpose will be clearly stated.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Retention and Deletion</h2>
        <p className="mb-2">
          Logs are retained for a limited time for troubleshooting and security purposes, then deleted when no longer needed.
          Retention periods may be revised based on operational needs.
        </p>
        <p className="mb-2">
          If a user requests deletion, we will comply as quickly as reasonably possible.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Security</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Minimum privilege design and access controls are implemented.</li>
          <li>Vulnerability management and audits are conducted continuously.</li>
        </ul>
        <p className="mt-2">
          However, complete security cannot be guaranteed. Users should also take appropriate precautions,
          such as avoiding the input of confidential information.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Use by Minors</h2>
        <p className="mb-2">
          Minors must obtain the consent of a parent or guardian before using this service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Policy Changes</h2>
        <p className="mb-2">
          This policy may be updated without prior notice. Any significant changes will be announced on this page.
        </p>
      </section>

      <section className="mb-2">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p>
          For questions, please contact the administrator. Contact details are provided within the service information section.
        </p>
      </section>
    </main>
  )
}
