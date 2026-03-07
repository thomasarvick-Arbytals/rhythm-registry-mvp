import Link from 'next/link';
import React from 'react';

export type NavItem = {
  href: string;
  label: string;
  code?: string;
  pill?: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function DashboardShell({
  title,
  subtitle,
  brand,
  nav,
  currentPath,
  children,
  actions,
  note,
}: {
  title: string;
  subtitle?: string;
  brand: { title: string; subtitle?: string };
  nav: NavItem[];
  currentPath: string;
  actions?: React.ReactNode;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090b10] to-[#0b0d12] text-[#e9ecf5]">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="h-full border-b border-white/10 bg-[rgba(18,22,37,.65)] p-5 backdrop-blur-md md:sticky md:top-0 md:h-screen md:overflow-auto md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-[#60a5fa] to-[#a78bfa] shadow-[0_10px_30px_rgba(0,0,0,.35)]" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold">{brand.title}</div>
              {brand.subtitle ? <div className="text-xs text-[#aab1c6]">{brand.subtitle}</div> : null}
            </div>
          </div>

          <nav className="mt-4 grid gap-2">
            {nav.map((item, idx) => {
              const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm no-underline hover:bg-[rgba(15,19,32,.75)]',
                    active && 'border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.12)]'
                  )}
                >
                  <span className="font-mono text-xs text-[#aab1c6]">{item.code ?? String(idx + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                  {item.pill ? (
                    <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[#aab1c6]">{item.pill}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {note ? <div className="mt-4 rounded-xl border border-dashed border-white/10 p-3 text-xs text-[#aab1c6]">{note}</div> : null}
        </aside>

        <main className="p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="m-0 text-lg font-semibold">{title}</h1>
              {subtitle ? <p className="mt-2 text-xs text-[#aab1c6]">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

export function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cx(
        'rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.55)] p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)]',
        className
      )}
    >
      {title ? <h2 className="mb-2 text-sm font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Btn({
  href,
  children,
  variant = 'default',
  type,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'good' | 'warn' | 'bad';
  type?: 'button' | 'submit';
  onClick?: () => void;
}) {
  const base =
    'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm text-[#e9ecf5] hover:bg-[rgba(15,19,32,.75)]';
  const variants: Record<string, string> = {
    default: '',
    primary: 'border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)]',
    good: 'border-[rgba(45,212,191,.55)] bg-[rgba(45,212,191,.12)]',
    warn: 'border-[rgba(251,191,36,.55)] bg-[rgba(251,191,36,.12)]',
    bad: 'border-[rgba(251,113,133,.55)] bg-[rgba(251,113,133,.10)]',
  };

  const cls = cx(base, variants[variant]);

  if (href) {
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} type={type ?? 'button'} onClick={onClick}>
      {children}
    </button>
  );
}

export function Badge({ variant = 'info', children }: { variant?: 'good' | 'warn' | 'bad' | 'info' | 'purple'; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    good: 'border-[rgba(45,212,191,.55)] text-[#8ff3e6]',
    warn: 'border-[rgba(251,191,36,.55)] text-[#ffe6a6]',
    bad: 'border-[rgba(251,113,133,.55)] text-[#ffc1cc]',
    info: 'border-[rgba(96,165,250,.55)] text-[#dbeafe]',
    purple: 'border-[rgba(167,139,250,.55)] text-[#e9d5ff]',
  };

  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-[#aab1c6]', styles[variant])}>{children}</span>;
}
