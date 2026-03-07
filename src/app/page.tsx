import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090b10] to-[#0b0d12] text-[#e9ecf5]">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-[#60a5fa] to-[#a78bfa] shadow-[0_10px_30px_rgba(0,0,0,.35)]" />
            <div>
              <div className="text-sm font-semibold">Rhythm Registry</div>
              <div className="text-xs text-[#aab1c6]">Managed event soundtrack workflow</div>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-[#aab1c6]">
            <Link className="hover:text-[#e9ecf5]" href="/samples">
              Samples
            </Link>
            <Link className="hover:text-[#e9ecf5]" href="/start">
              Start
            </Link>
            <Link className="hover:text-[#e9ecf5]" href="/login">
              Login
            </Link>
          </nav>
        </header>

        <section className="mt-14 rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.55)] p-8 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
          <h1 className="text-4xl font-semibold tracking-tight">Your story. Your soundtrack. Mixed to perfection.</h1>
          <p className="mt-4 max-w-2xl text-[#aab1c6]">
            A managed marketplace for event soundtracks — you tell us your vibe, we deliver a polished mix with smooth transitions.
            Secure delivery, quality checked, and one revision included.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-5 py-3 text-sm" href="/start">
              Start Your Event
            </Link>
            <Link className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-5 py-3 text-sm" href="/samples">
              Listen to samples
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Weddings', desc: 'From ceremony to reception — energy that flows.' },
            { title: 'Birthdays', desc: 'Your favourites, professionally blended.' },
            { title: 'Corporate', desc: 'Clean transitions, consistent vibe.' },
          ].map((c) => (
            <div key={c.title} className="rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.35)] p-5">
              <div className="font-semibold">{c.title}</div>
              <div className="mt-2 text-sm text-[#aab1c6]">{c.desc}</div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-4">
            {[
              ['Choose your tracks', 'Create a Spotify playlist and share it.'],
              ['We mix your music', 'Pro DJs craft transitions & energy flow.'],
              ['Review the preview', 'Request one structured revision.'],
              ['Final delivery', 'Download and play in your portal.'],
            ].map(([t, d]) => (
              <li key={t} className="rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.35)] p-4">
                <div className="font-medium">{t}</div>
                <div className="mt-1 text-sm text-[#aab1c6]">{d}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Pricing</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            {[
              ['2-Hour Mix', '$380'],
              ['3-Hour Mix', '$540'],
              ['4-Hour Mix', '$640'],
              ['5-Hour Mix', '$700'],
              ['6-Hour Mix', '$720'],
            ].map(([t, p]) => (
              <div key={t} className="rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.35)] p-4">
                <div className="text-sm text-[#aab1c6]">{t}</div>
                <div className="mt-1 font-mono text-2xl">{p}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-[#aab1c6]">Rush delivery add-on: +$200</div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-3">
            {[
              ['How many songs do I need?', 'We recommend ~50 songs per hour, but send what you can — we can fill gaps.'],
              ['Do I talk to the producer?', 'No. Rhythm Registry is managed — revisions are handled through structured forms.'],
              ['Is the producer public?', 'No. Producers are private and never shown to clients.'],
            ].map(([q, a]) => (
              <div key={q} className="rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.35)] p-4">
                <div className="font-medium">{q}</div>
                <div className="mt-1 text-sm text-[#aab1c6]">{a}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-[#aab1c6]">
          <div>© {new Date().getFullYear()} Rhythm Registry</div>
        </footer>
      </main>
    </div>
  );
}
