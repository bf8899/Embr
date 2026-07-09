import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Ember",
  description: "How Ember collects, uses, and protects your data.",
};

// Last substantive update — bump when the policy content changes.
const UPDATED = "9 July 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <Link href="/" className="text-sm text-ember-2 hover:text-ember-1">
        ← Ember
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-ink-faint">Last updated {UPDATED}</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-ink-dim [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_a]:text-ember-2 hover:[&_a]:text-ember-1">
        <p>
          Ember (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the video platform
          at e-mbr.uk. This policy explains what we collect, why, and your rights
          under UK data-protection law (UK GDPR and the Data Protection Act 2018).
        </p>

        <section>
          <h2>What we collect</h2>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <strong>Account data</strong> — the email, handle, and profile
              details you provide when you sign up.
            </li>
            <li>
              <strong>Content</strong> — videos, comments, and messages you post.
            </li>
            <li>
              <strong>Usage &amp; device data</strong> — pages viewed, approximate
              location (country/region, from your IP), and interaction events,
              used to run and improve the service.
            </li>
          </ul>
        </section>

        <section>
          <h2>Cookies and advertising</h2>
          <p className="mt-2">
            We use essential cookies to keep you signed in. When advertising is
            enabled, we use Google AdSense to show ads. Google and its partners
            may use cookies to serve ads based on your prior visits to this and
            other websites. You can control personalised advertising and manage
            your consent through the cookie banner shown on the site and via{" "}
            <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">
              Google&rsquo;s Ad Settings
            </a>
            . Learn more about how Google uses data at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
              policies.google.com/technologies/partner-sites
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Service providers</h2>
          <p className="mt-2">
            We share data only as needed with the providers that run Ember:
            Supabase (database and authentication), Vercel (hosting), Mux (video
            processing and delivery), and Google (advertising). Each processes
            data under its own terms and appropriate safeguards.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p className="mt-2">
            You may request access to, correction of, or deletion of your data,
            and object to certain processing. Deleting your account removes your
            profile and content. To exercise any right, contact us below. You may
            also complain to the UK Information Commissioner&rsquo;s Office (ICO).
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data:{" "}
            <a href="mailto:privacy@e-mbr.uk">privacy@e-mbr.uk</a>.
          </p>
        </section>

        <p className="text-xs text-ink-faint">
          This policy may be updated as Ember evolves; material changes will be
          reflected in the date above.
        </p>
      </div>
    </main>
  );
}
