import { DashboardShell, Card, Btn, Badge } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

function clientStatusLabel(ev: { status: string }) {
  switch (ev.status) {
    case 'AWAITING_ASSIGNMENT':
    case 'PLAYLIST_PENDING':
      return { label: 'Request Submitted', variant: 'info' as const };
    case 'ASSIGNED':
      return { label: 'DJ Accepted', variant: 'good' as const };
    case 'MIXING':
      return { label: 'In Progress', variant: 'warn' as const };
    case 'PREVIEW_READY':
      return { label: 'Awaiting Preview', variant: 'purple' as const };
    case 'PAYOUT_ELIGIBLE':
    case 'PAID_OUT':
    case 'FINAL_DELIVERED':
      return { label: 'Completed', variant: 'good' as const };
    default:
      return { label: ev.status, variant: 'info' as const };
  }
}

function getDetail(details: Array<{ key: string; value: string }>, key: string) {
  return details.find((d) => d.key === key)?.value ?? '';
}

export default async function ClientAppHome() {
  const session = await requireRole('client');

  const events = await prisma.event.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { order: true, details: true },
    take: 25,
  });

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Track your project status and review your mix when it’s ready."
      brand={{ title: 'Rhythm Registry — Client', subtitle: 'Desktop dashboard' }}
      currentPath="/app"
      nav={[
        { href: '/app', label: 'Dashboard', code: '01' },
        { href: '/app', label: 'Project Detail', code: '02', pill: 'No DJ info' },
        { href: '/app', label: 'Mix Preview', code: '03', pill: 'In-app only' },
        { href: '/app', label: 'Account', code: '04' },
      ]}
      actions={
        <>
          <Btn href="/start">New request</Btn>
          <Btn href="#changes" variant="primary">
            Request changes
          </Btn>
        </>
      }
      note={
        <>
          <div className="font-semibold text-[#e9ecf5]">Client rules</div>
          <ul className="mt-2 list-disc pl-4">
            <li>No DJ name/contact</li>
            <li>No messaging</li>
            <li>Change requests → admin approval</li>
            <li>Playback in-app only</li>
            <li>Offline allowed, no downloads</li>
            <li>Awaiting Preview auto-completes in 72h</li>
          </ul>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Job ID" className="md:col-span-3">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-xl">{events[0] ? `RR-${events[0].id.slice(0, 3).toUpperCase()}${events[0].id.slice(3, 6).toUpperCase()}` : '—'}</div>
            <div className="text-xs text-[#aab1c6]">Your current project</div>
          </div>
        </Card>
        <Card title="Projects" className="md:col-span-3">
          <div className="flex flex-col gap-1">
            <div className="font-mono text-xl">{events.length}</div>
            <div className="text-xs text-[#aab1c6]">Total submitted</div>
          </div>
        </Card>
        <Card title="Status" className="md:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Request Submitted</Badge>
            <Badge variant="good">DJ Accepted</Badge>
            <Badge variant="warn">In Progress</Badge>
            <Badge variant="purple">Awaiting Preview</Badge>
            <Badge variant="good">Completed</Badge>
          </div>
          <div className="mt-2 text-xs text-[#aab1c6]">Statuses are client-visible only.</div>
        </Card>

        <Card title="Your jobs" className="md:col-span-12">
          {events.length === 0 ? (
            <div className="text-sm text-[#aab1c6]">No projects yet. Use Start to submit a request.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                  <tr>
                    <th className="p-3">Job</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Preview</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const awaitingPreviewAt = getDetail(e.details, 'awaitingPreviewAt');
                    const autoCompleteAt = awaitingPreviewAt
                      ? new Date(new Date(awaitingPreviewAt).getTime() + 72 * 60 * 60 * 1000)
                      : null;
                    const canComplete = e.status === 'PREVIEW_READY';
                    const st = clientStatusLabel(e);

                    return (
                      <tr key={e.id} className="border-t border-white/10">
                        <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                        <td className="p-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(e.eventDate).toLocaleString()} · {e.eventType}
                        </td>
                        <td className="p-3">
                          {e.status === 'PREVIEW_READY' ? (
                            <div>
                              <div className="text-xs text-[#aab1c6]">Auto-completes:</div>
                              <div className="font-mono text-xs">{autoCompleteAt ? autoCompleteAt.toLocaleString() : '—'}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#aab1c6]">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          {canComplete ? (
                            <form action="/api/client/complete" method="post">
                              <input type="hidden" name="eventId" value={e.id} />
                              <button className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-1 text-sm hover:bg-[rgba(15,19,32,.75)]" type="submit">
                                Mark Completed
                              </button>
                            </form>
                          ) : (
                            <span className="text-xs text-[#aab1c6]">No action</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Request changes" className="md:col-span-12" >
          <div id="changes" />
          <p className="text-sm text-[#aab1c6]">Submit a change request for a job (goes to admin for approval).</p>

          {events.length > 0 ? (
            <form className="mt-3 grid gap-3 md:grid-cols-12" action="/api/client/change-request" method="post">
              <label className="md:col-span-4">
                <div className="text-xs font-semibold text-[#e9ecf5]">Job</div>
                <select className="mt-1 w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm" name="eventId">
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id.slice(0, 8).toUpperCase()} — {e.eventType} ({new Date(e.eventDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-8">
                <div className="text-xs font-semibold text-[#e9ecf5]">What needs adjusting?</div>
                <textarea
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-2 text-sm"
                  name="message"
                  rows={4}
                  placeholder="Describe the changes you want…"
                />
              </label>

              <div className="md:col-span-12">
                <button className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-4 py-2 text-sm" type="submit">
                  Submit change request
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-3 text-sm text-[#aab1c6]">No jobs available.</div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
