import assert from 'node:assert/strict';
import { handleEnquiry, prepareEnquiry, enquiryRecipient, enquirySender, verifyTurnstile } from '../lib/enquiry-service.mjs';
import { createPointsSnapshot, createNominationSnapshot } from '../public/points-enquiry.mjs';
import { rankingPrograms } from '../public/nomination-ranking.mjs';
import { calculate } from '../public/points-rules.mjs';

const sample = { language: 'en', enquiryType: 'Employer', requestType: 'sponsorship', name: 'Website test', email: 'test@example.test', companyOccupation: 'Example business', phone: '', message: 'Test enquiry only.', website: '', verificationToken: 'unit-token' };
const secret = 'unit-test-only';
const calls = [];
const dependencies = { secret, production: true, verifyBot: async () => ({ isBot: false }), send: async (mail, options) => { calls.push({ mail, options }); return { data: { id: 'unit-test-message' }, error: null }; } };
const request = (body = sample, overrides = {}) => new Request('https://www.hiremiiglobal.com/api/enquiries', {
  method: 'POST', headers: { origin: 'https://www.hiremiiglobal.com', 'content-type': 'application/json', ...overrides.headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
assert.equal((await handleEnquiry(request(), dependencies)).status, 200);
assert.equal(calls.length, 1);
assert.equal(calls[0].mail.from, enquirySender);
assert.deepEqual(calls[0].mail.to, [enquiryRecipient]);
assert.equal(calls[0].mail.replyTo, sample.email);
assert(!calls[0].mail.html, 'User input is plain text, never executable email markup');
assert(calls[0].options.signal instanceof AbortSignal);
assert.match(calls[0].options.idempotencyKey, /^website-enquiry\/[a-f0-9]{64}$/);
await handleEnquiry(request(), dependencies);
assert.equal(calls[0].options.idempotencyKey, calls[1].options.idempotencyKey, 'Retries including lost responses reuse provider key');
assert.notEqual(prepareEnquiry({ ...sample, message: 'A different enquiry.' }, secret).idempotencyKey, calls[0].options.idempotencyKey);

const invalid = [null, [], {}, { ...sample, to: 'attacker@example.test' }, { ...sample, subject: 'injected' },
  { ...sample, language: 'fr' }, { ...sample, enquiryType: 'Unknown' }, { ...sample, requestType: '__proto__' },
  { ...sample, name: 'Name\r\nBcc: attacker@example.test' }, { ...sample, email: 'a@b.test\r\nBcc: b@c.test' },
  { ...sample, email: 'one@two@three.test' }, { ...sample, website: 'spam.test' }, { ...sample, name: '' },
  { ...sample, phone: 'x'.repeat(61) }, { ...sample, companyOccupation: 'x'.repeat(201) },
  { ...sample, message: '' }, { ...sample, message: 'x'.repeat(1501) }, { ...sample, message: 'null\x00byte' },
  { ...sample, estimatePathway: 'nsw-190', estimatedScore: 100 },
  { ...sample, requestType: 'skilled', estimatePathway: 'nsw-190', estimatedScore: 999 },
  { ...sample, nominationSnapshot: { fake: true } },
];
for (const body of invalid) assert.equal((await handleEnquiry(request(body), dependencies)).status, 400);
assert.equal((await handleEnquiry(request('{'), dependencies)).status, 400);
assert.equal((await handleEnquiry(request(sample, { headers: { origin: 'https://attacker.test' } }), dependencies)).status, 403);
assert.equal((await handleEnquiry(request(sample, { headers: { 'sec-fetch-site': 'cross-site' } }), dependencies)).status, 403);
assert.equal((await handleEnquiry(request(sample, { headers: { 'content-type': 'text/plain' } }), dependencies)).status, 415);
assert.equal((await handleEnquiry(request('x'.repeat(32769)), dependencies)).status, 413);
assert.equal(calls.length, 2, 'Rejected inputs must never reach the email provider');
for (const options of [{ secret: undefined }, { enabled: false }, { verifyBot: async () => ({ isBot: true }) }, { verifyBot: async () => { throw Error('offline'); } }]) {
  const response = await handleEnquiry(request(), { ...dependencies, ...options });
  assert([403, 503].includes(response.status));
}
assert.equal(calls.length, 2, 'Verification and configuration failures fail closed');
for (const verificationToken of ['', undefined, 'x'.repeat(2049), 'invalid token']) {
  assert.equal((await handleEnquiry(request({ ...sample, verificationToken }), dependencies)).status, 403);
}
assert.equal(prepareEnquiry({ ...sample, verificationToken: 'new-token' }, secret).idempotencyKey, calls[0].options.idempotencyKey, 'Fresh single-use challenge tokens must not defeat email deduplication');
for (const result of [{ success: false }, { success: true, hostname: 'other.test', action: 'website_enquiry' }, { success: true, hostname: 'www.hiremiiglobal.com', action: 'wrong_action' }, { success: true, hostname: 'www.hiremiiglobal.com', action: 'website_enquiry' }]) {
  const actual = await verifyTurnstile('unit-token', { secret, fetchImpl: async (url, init) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(JSON.parse(init.body).response, 'unit-token');
    return Response.json(result);
  } });
  assert.equal(actual.isBot, !(result.success === true && result.hostname === 'www.hiremiiglobal.com' && result.action === 'website_enquiry'));
}
await assert.rejects(() => verifyTurnstile('unit-token', { secret: undefined }));
await assert.rejects(() => verifyTurnstile('unit-token', { secret, fetchImpl: async () => new Response('', { status: 503 }) }));
for (const send of [async () => ({ error: { name: 'daily_quota_exceeded' } }), async () => ({ error: { name: 'validation_error', message: 'PRIVATE DATA' } }), async () => { throw Error('SECRET'); }, async () => ({ data: {} })]) {
  const response = await handleEnquiry(request(), { ...dependencies, send });
  assert([429, 503].includes(response.status));
  assert.doesNotMatch(await response.text(), /PRIVATE DATA|SECRET/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
}
for (const language of ['en', 'zh']) {
  const prepared = prepareEnquiry({ ...sample, language, message: '<script>alert(1)</script>\nLine 2' }, secret);
  assert(prepared.mail.text.includes('<script>alert(1)</script>\nLine 2'));
  assert(!('html' in prepared.mail));
}
const points = createPointsSnapshot({ state:'nsw',visa:'190',age:'25',englishMode:'level',english:'proficient',overseas:'3',australian:'1',education:'bachelor',partner:'single',study:true });
assert(points);
const score = calculate(points.answers).total;
const estimate = prepareEnquiry({ ...sample, requestType: 'skilled', estimatePathway:'nsw-190', estimatedScore:score, pointsSnapshot:points }, secret);
assert.match(estimate.mail.text, /self-assessed/);
assert.throws(() => prepareEnquiry({ ...sample, requestType:'skilled', estimatePathway:'nsw-190', estimatedScore:score + 1, pointsSnapshot:points }, secret));
const program = rankingPrograms['act-resident'];
const nomination = createNominationSnapshot({ state:'act',visa:'190',program:'act-resident',answers:Object.fromEntries(program.fields.map(field=>[field.key,'0'])),confirmed:true,context:{age:'30',englishMode:'level',english:'superior'} });
assert(nomination);
assert.match(prepareEnquiry({ ...sample, nominationSnapshot:nomination }, secret).mail.text, /Canberra Matrix/);
console.log('PASS: Enquiry API validates recipients, inputs, estimates, size, origins and bot checks; uses stable retry keys, plain text, safe failures and no-store responses. No real mail sent.');
