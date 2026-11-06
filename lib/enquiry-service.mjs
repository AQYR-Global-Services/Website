import { createHmac } from 'node:crypto';
import { parsePointsSnapshot, parseNominationSnapshot, formatPointsEnquiry, formatNominationEnquiry } from '../public/points-enquiry.mjs';

export const enquiryRecipient = 'info@hiremiiglobal.com';
export const enquirySender = 'AQYR Website <website@auth.hiremiiglobal.com>';
const audiences = {
  Employer: ['Employer', '企业'],
  'Skilled professional': ['Skilled professional', '专业人才'],
  'Individual visa enquiry': ['Individual visa enquiry', '个人签证咨询'],
  Other: ['Other', '其他'],
};
const services = {
  hiring: ['Hiring and talent', '招聘与人才对接'],
  'employer-connection': ['Employer connections', '寻找雇主机会'],
  sponsorship: ['482 / 186 sponsorship', '482 / 186 雇主担保'],
  'labour-agreement': ['Labour agreement', '企业劳工协议'],
  'visitor-student': ['Visitor / student visa', '旅游 / 学生签证'],
  skilled: ['Skilled migration', '技术移民'],
  'partner-family': ['Partner / family visa', '配偶 / 家庭签证'],
  complex: ['A complex case', '复杂个案'], other: ['Other visa / enquiry', '其他签证 / 咨询'],
};
const allowedFields = new Set(['language', 'enquiryType', 'requestType', 'name', 'companyOccupation', 'email', 'phone', 'message', 'website', 'estimatePathway', 'estimatedScore', 'pointsSnapshot', 'nominationSnapshot', 'verificationToken']);
const singleLine = (value, limit, required = false) => {
  if (typeof value !== 'string' || value.length > limit || /[\x00-\x1f\x7f]/.test(value)) throw Error('invalid');
  value = value.trim();
  if (required && !value) throw Error('invalid');
  return value;
};

export function prepareEnquiry(input, secret) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !allowedFields.has(key))) throw Error('invalid');
  if (!['en', 'zh'].includes(input.language) || !Object.hasOwn(audiences, input.enquiryType) || !Object.hasOwn(services, input.requestType)) throw Error('invalid');
  const name = singleLine(input.name, 100, true);
  const email = singleLine(input.email, 254, true);
  if (!/^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]+$/.test(email)) throw Error('invalid');
  const company = singleLine(input.companyOccupation ?? '', 200);
  const phone = singleLine(input.phone ?? '', 60);
  if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 1500 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.message)) throw Error('invalid');
  const message = input.message.replace(/\r\n?/g, '\n').trim();
  if (typeof input.website !== 'string' || input.website) throw Error('invalid');
  const zh = input.language === 'zh', lang = zh ? 1 : 0;
  const rows = [
    [zh ? '咨询身份' : 'Enquiry type', audiences[input.enquiryType][lang]],
    [zh ? '咨询需求' : 'What you need', services[input.requestType][lang]],
    [zh ? '姓名' : 'Name', name], [zh ? '公司 / 职业' : 'Company / occupation', company || '—'],
    [zh ? '邮箱' : 'Email', email], [zh ? '电话' : 'Phone', phone || '—'],
    [zh ? '需求说明' : 'Enquiry details', message],
  ];
  const hasEstimate = input.estimatePathway != null || input.estimatedScore != null || input.pointsSnapshot != null;
  if (hasEstimate) {
    const path = input.estimatePathway;
    const score = input.estimatedScore;
    if (input.requestType !== 'skilled' || !/^(vic|nsw|qld|wa|sa|tas|act|nt)-(189|190|491)$/.test(path || '') ||
      !Number.isInteger(score) || score < 0 || score > (['vic-190', 'vic-491'].includes(path) ? 950 : path.endsWith('-189') ? 130 : path.endsWith('-190') ? 135 : 145)) throw Error('invalid');
    let detail = `${path.toUpperCase()} · ${score}`;
    if (input.pointsSnapshot != null) {
      const snapshot = parsePointsSnapshot(JSON.stringify(input.pointsSnapshot), path, String(score));
      if (!snapshot) throw Error('invalid');
      detail = formatPointsEnquiry(snapshot, input.language);
    } else if (/-190$|-491$/.test(path) && !path.startsWith('vic-')) {
      detail += zh ? '（含有条件州提名加分，待核对）' : ' (includes conditional nomination points, subject to review)';
    }
    rows.push([zh ? '预估分数（客户自评，待团队核对）' : 'Estimated points (self-assessed, subject to review)', detail]);
  }
  if (input.nominationSnapshot != null) {
    const snapshot = parseNominationSnapshot(JSON.stringify(input.nominationSnapshot));
    if (!snapshot) throw Error('invalid');
    rows.push([zh ? '州提名／ROI 自评附件' : 'State nomination / ROI assessment', formatNominationEnquiry(snapshot, input.language)]);
  }
  const mail = {
    from: enquirySender, to: [enquiryRecipient], replyTo: email,
    subject: zh ? '[AQYR] 网站咨询' : '[AQYR] Website enquiry',
    text: rows.map(([label, value]) => `${label}: ${value}`).join('\n\n') + '\n\nhttps://www.hiremiiglobal.com/' + (zh ? 'zh/contact' : 'contact'),
  };
  // Resend keeps this key for 24 hours. Identical retries, including after a lost response,
  // reuse exactly the same provider payload; no client-controlled recipient or random key.
  const idempotencyKey = 'website-enquiry/' + createHmac('sha256', secret).update(JSON.stringify(mail)).digest('hex');
  return { mail, idempotencyKey };
}

const json = (body, status, extra = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });

export async function verifyTurnstile(token, { secret, fetchImpl = fetch }) {
  if (!secret) throw Error('unavailable');
  const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('unavailable');
  const result = await response.json();
  return { isBot: !(result.success === true && result.hostname === 'www.hiremiiglobal.com' && result.action === 'website_enquiry') };
}

export async function handleEnquiry(request, { secret, send, verifyBot, production = false, enabled = true }) {
  const origin = request.headers.get('origin');
  const expected = production ? 'https://www.hiremiiglobal.com' : new URL(request.url).origin;
  if (origin !== expected || request.headers.get('sec-fetch-site') === 'cross-site') return json({ code: 'forbidden' }, 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json({ code: 'invalid' }, 415);
  // Enforce on streamed bytes as well: Content-Length alone is client controlled.
  const reader = request.body?.getReader();
  if (!reader) return json({ code: 'invalid' }, 400);
  let bytes = 0, chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32768) { await reader.cancel(); return json({ code: 'too_large' }, 413); }
      chunks.push(value);
    }
  } catch { return json({ code: 'invalid' }, 400); }
  let prepared, input;
  try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); prepared = prepareEnquiry(input, secret || 'unconfigured'); }
  catch { return json({ code: 'invalid' }, 400); }
  if (!enabled || !secret) return json({ code: 'unavailable' }, 503);
  if (typeof input.verificationToken !== 'string' || !input.verificationToken || input.verificationToken.length > 2048 || /\s|[\x00-\x1f\x7f]/.test(input.verificationToken)) return json({ code: 'verification' }, 403);
  try {
    if ((await verifyBot(input.verificationToken)).isBot) return json({ code: 'verification' }, 403);
  } catch { return json({ code: 'verification' }, 503); }
  try {
    const result = await send(prepared.mail, { idempotencyKey: prepared.idempotencyKey, signal: AbortSignal.timeout(12000) });
    if (result.error || !result.data?.id) {
      const limited = ['rate_limit_exceeded', 'daily_quota_exceeded', 'monthly_quota_exceeded'].includes(result.error?.name);
      return json({ code: limited ? 'busy' : 'unavailable' }, limited ? 429 : 503, limited ? { 'Retry-After': '60' } : {});
    }
    return json({ ok: true }, 200);
  } catch { return json({ code: 'unavailable' }, 503); }
}
