import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold">Rhythm Registry</div>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="hover:underline" href="/samples">Samples</Link>
          <Link className="hover:underline" href="/start">Start</Link>
          <Link className="hover:underline" href="/login">Login</Link>
        </nav>
      </header>

      <section className="mt-14">
        <h1 className="text-4xl font-semibold tracking-tight">Your story. Your soundtrack. Mixed to perfection.</h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          A managed marketplace for event soundtracks — you tell us your vibe, we deliver a polished mix with smooth transitions.
          Secure delivery, quality checked, and one revision included.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded bg-black px-5 py-3 text-white" href="/start">
            Start Your Event
          </Link>
          <Link className="rounded border px-5 py-3" href="/samples">
            Listen to samples
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          { title: 'Weddings', desc: 'From ceremony to reception — energy that flows.' },
          { title: 'Birthdays', desc: 'Your favourites, professionally blended.' },
          { title: 'Corporate', desc: 'Clean transitions, consistent vibe.' },
        ].map((c) => (
          <div key={c.title} className="rounded-lg border p-5">
            <div className="font-semibold">{c.title}</div>
            <div className="mt-2 text-sm text-neutral-600">{c.desc}</div>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-4">
          {[
            ['Choose your tracks', 'Create a Spotify playlist and share it.'],
            ['We mix your music', 'Pro DJs craft transitions & energy flow.'],
            ['Review the preview', 'Request one structured revision.'],
            ['Final delivery', 'Download and play in your portal.'],
          ].map(([t, d]) => (
            <li key={t} className="rounded-lg border p-4">
              <div className="font-medium">{t}</div>
              <div className="mt-1 text-sm text-neutral-600">{d}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {[
            ['2-Hour Mix', '$380'],
            ['3-Hour Mix', '$540'],
            ['4-Hour Mix', '$640'],
            ['5-Hour Mix', '$700'],
            ['6-Hour Mix', '$720'],
          ].map(([t, p]) => (
            <div key={t} className="rounded-lg border p-4">
              <div className="font-medium">{t}</div>
              <div className="mt-1 text-2xl font-semibold">{p}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-neutral-600">Rush delivery add-on: +$200</div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded border p-4">
            <div className="font-medium">How many songs do I need?</div>
            <div className="mt-1 text-sm text-neutral-600">We recommend ~50 songs per hour, but send what you can — we can fill gaps.</div>
          </div>
          <div className="rounded border p-4">
            <div className="font-medium">Do I talk to the producer?</div>
            <div className="mt-1 text-sm text-neutral-600">No. Rhythm Registry is managed — revisions are handled through structured forms.</div>
          </div>
          <div className="rounded border p-4">
            <div className="font-medium">Is the producer public?</div>
            <div className="mt-1 text-sm text-neutral-600">No. Producers are private and never shown to clients.</div>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t pt-8 text-sm text-neutral-500">
        <div>© {new Date().getFullYear()} Rhythm Registry</div>
      </footer>
    </main>
  );
}
