export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  // MVP: no provider. Log and return the content.
  console.log('--- MVP EMAIL ---');
  console.log('TO:', opts.to);
  console.log('SUBJECT:', opts.subject);
  console.log(opts.text);
  console.log('--- /MVP EMAIL ---');
  return { delivered: false, preview: opts };
}
