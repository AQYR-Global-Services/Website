// Rule snapshot: 2026-10-15. Sources and unresolved cases: docs/points-calculator-rules.md.
// Pure functions: shared by the browser and boundary tests. No personal data is stored.
import {getOccupation} from './occupation-search.mjs';
export const ruleDate = '2026-10-15';
export const vptAges = {18:265,19:282,30:286,31:270,32:256,33:240,34:226,35:210,36:196,37:180,38:166,39:150,40:136,41:106,42:76,43:46,44:16};
export const earningsPoints = [8,16,24,32,39,47,55,63,71,79,87,95,103,111,118,126,134,142,150];
export const priorityCodes = new Set(('251211 251212 251213 251214 251411 251511 251912 252411 252511 252611 252711 252712 253311 253314 253317 253318 253321 253399 253312 253313 253315 253316 253322 253323 253324 253411 253512 253511 253513 253514 253515 253516 253518 253517 253521 253912 253913 253917 253914 253915 254111 254211 254212 254311 254411 254412 254413 254414 254415 254416 254417 254418 254421 254422 254423 254424 254425 254499 411213 272311 272313 272312 272399 272511 272613 241311 241411 241511 241599 241111 233212 234412 234413 133111 232212 232214 333111 331111 331112 334111 334112 334113 334114 334115 331211 331212 331213 312113 341111 341112 342111 322211 323214 312312 333212 333411 333311 323412 322311 321211 321111').split(' '));
const isChoice = (value, choices) => choices.includes(value);
const integer = (value, min, max) => value !== '' && value != null && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
export function englishLevel(input) {
  if (input.englishMode === 'level') return isChoice(input.english, ['below','competent','proficient','superior']) ? input.english : null;
  if (!isChoice(input.englishMode, ['ielts','pte'])) return null;
  const scores = ['listening','reading','writing','speaking'].map(key => input[key]);
  const isIelts = input.englishMode === 'ielts';
  if (scores.some(value => value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < (isIelts ? 0 : 10) || Number(value) > (isIelts ? 9 : 90) || (isIelts ? Number(value) * 2 % 1 !== 0 : Number(value) % 1 !== 0))) return null;
  let bands = [[6,6,6,6],[7,7,7,7],[8,8,8,8]];
  if (!isIelts) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.testDate || '') || !Number.isFinite(Date.parse(input.testDate)) || input.testDate > new Date().toISOString().slice(0,10)) return null;
    bands = input.testDate >= '2025-08-07' ? [[47,48,51,54],[58,59,69,76],[69,70,85,88]] : [[50,50,50,50],[65,65,65,65],[79,79,79,79]];
  }
  let level = 'below';
  bands.forEach((band, index) => { if (band.every((min, i) => Number(scores[i]) >= min)) level = ['competent','proficient','superior'][index]; });
  return level;
}
export function federalAge(age) { return age < 18 || age >= 45 ? 0 : age < 25 ? 25 : age < 33 ? 30 : age < 40 ? 25 : 15; }
export function vptAge(age) { return age >= 20 && age <= 29 ? 300 : vptAges[age] ?? null; }
export function vptEarnings(value) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0 || value === '') return null;
  if (Number(value) < 80000) return 0;
  return earningsPoints[Math.min(18, Math.floor((Number(value) - 80000) / 5000))];
}
export function calculate(input) {
  const english = englishLevel(input);
  const missing = [];
  if (!isChoice(input.state, ['vic','nsw'])) missing.push('state');
  if (!isChoice(input.visa, ['189','190'])) missing.push('visa');
  if (!integer(input.age, 18, 100)) missing.push('age');
  if (!english) missing.push('english');
  const chosen = isChoice(input.state, ['vic','nsw']) && isChoice(input.visa, ['189','190']);
  const mode = !chosen ? null : input.state === 'vic' && input.visa === '190' ? 'vpt' : 'federal';
  const age = Number(input.age);
  const issues = [];
  if (integer(input.age,18,100) && age >= 45) issues.push('age-limit');
  if (english === 'below') issues.push('english-minimum');
  if (mode === 'federal' && input.specialist && !['master','phd'].includes(input.education)) issues.push('specialist-education');
  const blocked = issues.includes('age-limit') || issues.includes('english-minimum');
  if (mode === 'vpt') {
    const occupation = getOccupation(input.occupation);
    if (!isChoice(input.experience, ['0','1','2','4','6','8','9'])) missing.push('experience');
    if (!occupation) missing.push('occupation');
    else if (![1,2,3].includes(occupation.skill)) missing.push('occupation-level');
    if (!isChoice(input.vptEducation, ['other','bachelor','master','phd'])) missing.push('vptEducation');
    if (!isChoice(input.vptPartner, ['yes','no'])) missing.push('vptPartner');
    if (!isChoice(input.earningEligible, ['yes','no'])) missing.push('earnings-status');
    if (input.earningEligible === 'yes' && vptEarnings(input.salary) === null) missing.push('salary');
    if (input.vptPartner === 'yes' && !/^\d{6}$/.test(input.partnerCode || '')) missing.push('partner-code');
    // The government table says 6–7 and >8, omitting exactly 8. Never invent a value.
    if (input.experience === '8') missing.push('eight-years');
    const breakdown = {
      age: vptAge(age), english: ({below:0,competent:0,proficient:100,superior:200})[english] ?? 0,
      experience: ({0:0,1:20,2:40,4:60,6:80,9:100})[input.experience] ?? null,
      education: ({other:25,bachelor:50,master:75,phd:100})[input.vptEducation] ?? 0,
      skill: !occupation || ![1,2,3].includes(occupation.skill) ? null : occupation.skill === 1 ? 50 : 0,
      partner: input.vptPartner === 'yes' && priorityCodes.has(input.partnerCode) ? 50 : 0,
      earnings: input.earningEligible === 'yes' ? vptEarnings(input.salary) : 0,
    };
    return {mode, english, missing, issues, breakdown, nomination:0,
      total: missing.length || blocked ? null : Object.values(breakdown).reduce((sum,value)=>sum+value,0)};
  }
  if (!isChoice(input.overseas, ['0','3','5','8'])) missing.push('overseas');
  if (!isChoice(input.australian, ['0','1','3','5','8'])) missing.push('australian');
  if (!isChoice(input.education, ['other','diploma','assessed','bachelor','master','phd'])) missing.push('education');
  if (!isChoice(input.partner, ['single','skilled','english','none'])) missing.push('partner');
  const regional = !!input.regional && !!input.study;
  const specialist = !!input.specialist && ['master','phd'].includes(input.education);
  const federal = {
    age: federalAge(age), english: ({below:0,competent:0,proficient:10,superior:20})[english] ?? 0,
    employment: Math.min(20, ({0:0,3:5,5:10,8:15})[input.overseas] + ({0:0,1:5,3:10,5:15,8:20})[input.australian]) || 0,
    education: ({other:0,diploma:10,assessed:10,bachelor:15,master:15,phd:20})[input.education] ?? 0,
    partner: ({single:10,skilled:10,english:5,none:0})[input.partner] ?? 0,
    study: input.study ? 5 : 0, specialist: specialist ? 10 : 0, regional: regional ? 5 : 0,
    professional: input.professional ? 5 : 0, language: input.language ? 5 : 0,
  };
  const base = Object.values(federal).reduce((sum, value) => sum + value,0);
  const nomination = input.visa === '190' ? 5 : 0;
  return {mode,english,missing,issues,breakdown:federal,base,nomination,total: !mode || missing.length || blocked ? null : base + nomination};
}
