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
    verifyBot: async () => {
      const result = await checkBotId({ advancedOptions: { checkLevel: 'basic' } });
      if (result.isBot) console.warn('Website enquiry verification rejected', {
        reason: 'classificationReason' in result ? result.classificationReason?.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 100) : 'unavailable',
        challengePresent: request.headers.has('x-is-human'),
      });
      return result;
    },
    send: (mail: Parameters<Resend['emails']['send']>[0], options: Parameters<Resend['emails']['send']>[1]) => new Resend(secret).emails.send(mail, options),
  });
}
