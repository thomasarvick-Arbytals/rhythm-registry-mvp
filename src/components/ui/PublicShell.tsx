import Link from 'next/link';
import React from 'react';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export function PublicShell({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#090b10] to-[#0b0d12] text-[#e9ecf5]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#aab1c6] hover:text-[#e9ecf5]">
          <span className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-[#60a5fa] to-[#a78bfa] shadow-[0_10px_30px_rgba(0,0,0,.35)]" aria-hidden="true" />
          <span className="font-semibold text-[#e9ecf5]">Rhythm Registry</span>
        </Link>

        <div className={cx('mt-8 rounded-[14px] border border-white/10 bg-[rgba(18,22,37,.55)] p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)]', className)}>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-[#aab1c6]">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-sm text-[#aab1c6]">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-1">{children}</div>
      {hint ? <div className="mt-1 text-xs text-[#aab1c6]">{hint}</div> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm text-[#e9ecf5] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,.6)]',
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm text-[#e9ecf5] focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,.6)]',
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-3 text-sm text-[#e9ecf5] placeholder:text-[#667085] focus:outline-none focus:ring-2 focus:ring-[rgba(96,165,250,.6)]',
        props.className
      )}
    />
  );
}

export function PrimaryButton({
  children,
  disabled,
  type,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'submit'}
      disabled={disabled}
      className="w-full rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-4 py-3 text-sm font-medium text-[#e9ecf5] hover:bg-[rgba(96,165,250,.22)] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Notice({ variant = 'error', children }: { variant?: 'error' | 'info'; children: React.ReactNode }) {
  const cls =
    variant === 'error'
      ? 'border-[rgba(251,113,133,.55)] bg-[rgba(251,113,133,.10)] text-[#ffc1cc]'
      : 'border-[rgba(96,165,250,.55)] bg-[rgba(96,165,250,.12)] text-[#dbeafe]';
  return <div className={cx('rounded-xl border p-3 text-sm', cls)}>{children}</div>;
}
