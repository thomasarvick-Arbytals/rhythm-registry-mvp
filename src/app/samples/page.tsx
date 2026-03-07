import Link from 'next/link';

export default function SamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090b10] to-[#0b0d12] text-[#e9ecf5]">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Samples</h1>
            <p className="mt-3 text-[#aab1c6]">Placeholder for MVP — add sample mixes here.</p>
          </div>
          <Link className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-4 py-2 text-sm" href="/">
            Back
          </Link>
        </div>

        <div className="mt-8 rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.55)] p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
          <div className="text-sm text-[#aab1c6]">No samples yet.</div>
        </div>
      </main>
    </div>
  );
}
