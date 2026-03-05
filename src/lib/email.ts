import { Resend } from 'resend';

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  return new Resend(key);
}

export async function sendTempPasswordEmail(params: {
  to: string;
  tempPassword: string;
}) {
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error('Missing RESEND_FROM');

  const resend = getResend();

  await resend.emails.send({
    from,
    to: params.to,
    subject: 'Your Rhythm Registry login details',
    text: [
      'Welcome to Rhythm Registry.',
      '',
      `Temporary password: ${params.tempPassword}`,
      '',
      'Log in and you will be prompted to change it on first login.',
    ].join('\n'),
  });
}
