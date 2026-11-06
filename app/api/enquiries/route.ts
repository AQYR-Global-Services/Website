import { Resend } from 'resend';
import { checkBotId } from 'botid/server';
import { handleEnquiry } from '@/lib/enquiry-service.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: Request) {
  const secret = process.env.RESEND_API_KEY;
  return handleEnquiry(request, {
    secret,
    // Preview builds must not generate real enquiries using the production key.
    enabled: !process.env.VERCEL || process.env.VERCEL_ENV === 'production',
    production: !!process.env.VERCEL,
    verifyBot: () => checkBotId({ advancedOptions: { checkLevel: 'basic' } }),
    send: (mail: Parameters<Resend['emails']['send']>[0], options: Parameters<Resend['emails']['send']>[1]) => new Resend(secret).emails.send(mail, options),
  });
}
