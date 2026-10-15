import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {occupations} from '../public/anzsco-2013.mjs';
import {getOccupation, searchOccupations} from '../public/occupation-search.mjs';
import {calculate, englishLevel, federalAge, vptAge, vptAges, vptEarnings, earningsPoints, priorityCodes} from '../public/points-rules.mjs';

const base = {state:'nsw',visa:'190',age:'29',englishMode:'level',english:'superior',overseas:'0',australian:'0',education:'bachelor',partner:'single'};
const calc = (extra={}) => calculate({...base,...extra});
const vptBase = {state:'vic',visa:'190',age:'29',englishMode:'level',english:'superior',vptEducation:'bachelor',vptPartner:'no',occupation:'261313',experience:'0',earningEligible:'no'};
const vpt = (extra={})=>calculate({...vptBase,...extra});
assert.equal(calc().base,75);
assert.equal(calc().total,80);
assert.equal(vpt().total,600);
assert.equal(vpt().nomination,0);
assert.equal(vpt().mode,'vpt');
assert.equal(vpt().missing.length,0,'VPT does not require federal-only fields');
for (const state of ['vic','nsw']) for (const visa of ['189','190']) {
  const result = calc({state,visa});
  assert.equal(result.mode,state==='vic'&&visa==='190'?'vpt':'federal');
  if(result.mode==='federal') assert.equal(result.total,visa==='190'?80:75);
}
assert.equal(vpt({overseas:'8',australian:'8',education:'phd',partner:'skilled',study:true,regional:true,specialist:true,professional:true,language:true}).total,600,'Federal answers never affect VPT');
assert.equal(calc({vptEducation:'phd',vptPartner:'yes',skill:'1',experience:'9',earningEligible:'yes',salary:'170000',partnerCode:'254499'}).total,80,'VPT answers never affect federal points');
for (const [age,points] of [[18,25],[24,25],[25,30],[32,30],[33,25],[39,25],[40,15],[44,15],[45,0]]) assert.equal(federalAge(age),points);
for (let age=20; age<=29; age++) assert.equal(vptAge(age),300);
for (const [age,points] of Object.entries(vptAges)) assert.equal(vptAge(Number(age)),points);
for (const age of ['', '17','29.5','-2','NaN','45']) {assert.equal(calc({age}).total,null); assert.equal(vpt({age}).total,null);}
assert.equal(calc({english:'below'}).total,null);
assert.equal(vpt({english:'below'}).total,null);
for (const key of ['state','visa','age','english','overseas','australian','education','partner']) assert.equal(calc({[key]:''}).total,null,key+' required for federal');
for (const key of ['state','visa','age','english','vptEducation','vptPartner','occupation','experience','earningEligible']) assert.equal(vpt({[key]:''}).total,null,key+' required for VPT');
for (const [overseas,op] of [['0',0],['3',5],['5',10],['8',15]]) for (const [australian,ap] of [['0',0],['1',5],['3',10],['5',15],['8',20]]) assert.equal(calc({overseas,australian}).breakdown.employment,Math.min(20,op+ap));
for (const [education,fp] of [['other',0],['diploma',10],['assessed',10],['bachelor',15],['master',15],['phd',20]]) assert.equal(calc({education}).breakdown.education,fp);
for (const [vptEducation,vp] of [['other',25],['bachelor',50],['master',75],['phd',100]]) assert.equal(vpt({vptEducation}).breakdown.education,vp);
assert.equal(calc({regional:true,study:false}).breakdown.regional,0);
assert.equal(calc({regional:true,study:true}).breakdown.regional,5);
assert.equal(calc({specialist:true,education:'bachelor'}).breakdown.specialist,0);
assert.equal(calc({specialist:true,education:'master'}).breakdown.specialist,10);
assert.equal(calc({study:true,regional:true,professional:true,language:true,specialist:true,education:'phd',australian:'8',overseas:'8'}).total,135);
for (const [experience,points] of [['0',0],['1',20],['2',40],['4',60],['6',80],['9',100]]) assert.equal(vpt({experience}).breakdown.experience,points);
assert.equal(vpt({experience:'8'}).total,null);
assert(vpt({experience:'8'}).missing.includes('eight-years'));
assert.equal(calc({experience:'8'}).total,80,'VPT ambiguity does not affect a federal pathway');
assert.equal(vptEarnings(79999.99),0);
assert.equal(vptEarnings(0),0);
assert.equal(vptEarnings(''),null);
assert.equal(vptEarnings(-1),null);
assert.equal(vptEarnings('abc'),null);
for (let i=0;i<earningsPoints.length;i++) {
  assert.equal(vptEarnings(80000+i*5000),earningsPoints[i]);
  assert.equal(vptEarnings(84999.99+i*5000),earningsPoints[i]);
}
assert.equal(vptEarnings(1000000),150);
assert.equal(vpt({earningEligible:'no',salary:'170000'}).breakdown.earnings,0);
assert.equal(vpt({earningEligible:'yes',salary:''}).total,null);
assert.equal(vpt({vptPartner:'no',partnerCode:'254499'}).breakdown.partner,0);
assert.equal(vpt({vptPartner:'yes',partnerCode:'254499'}).breakdown.partner,50);
assert.equal(vpt({vptPartner:'yes',partnerCode:'261313'}).breakdown.partner,0);
assert.equal(vpt({vptPartner:'yes',partnerCode:'25449'}).total,null);
assert.equal(vpt({vptPartner:'yes',partnerCode:'999999'}).total,null,'Unrecognised partner occupations do not produce a completed estimate');
assert.equal(priorityCodes.size,101);
assert.equal(vpt({experience:'9',vptEducation:'phd',vptPartner:'yes',partnerCode:'254499',earningEligible:'yes',salary:'170000'}).total,950);
const english = (mode,scores,date='2026-10-01') => englishLevel({englishMode:mode,listening:String(scores[0]),reading:String(scores[1]),writing:String(scores[2]),speaking:String(scores[3]),testDate:date});
for (const [scores,level] of [[[6,6,6,6],'competent'],[[7,7,7,7],'proficient'],[[8,8,8,8],'superior'],[[9,9,9,5.5],'below']]) assert.equal(english('ielts',scores),level);
assert.equal(english('ielts',[9,9,9,9.1]),null);
assert.equal(english('ielts',[7,7,7,6.7]),null);
for (const [scores,level] of [[[47,48,51,54],'competent'],[[58,59,69,76],'proficient'],[[69,70,85,88],'superior'],[[65,65,65,65],'competent'],[[90,90,90,53],'below']]) assert.equal(english('pte',scores),level);
for (const [score,level] of [[50,'competent'],[65,'proficient'],[79,'superior']]) assert.equal(english('pte',[score,score,score,score],'2025-08-06'),level);
assert.equal(english('pte',[65,65,65,65],'2025-08-07'),'competent');
assert.equal(english('pte',[90,90,90,90],''),null);
assert.equal(english('pte',[90,90,90,90],'2099-01-01'),null);
assert.equal(english('pte',[90,90,90,91]),null);
assert.equal(english('pte',[90,90,90,88.5]),null);
assert.equal(englishLevel({englishMode:'ielts',listening:'8',reading:'8',writing:'8',speaking:''}),null);
assert.equal(occupations.length,1023);
assert.equal(new Set(occupations.map(row=>row.code)).size,1023);
assert.equal(occupations.reduce((sum,row)=>sum+row.aliases.length,0),2213);
for(const row of occupations) {
  assert.match(row.code,/^\d{6}$/);
  assert([1,2,3,4,5].includes(row.skill));
  assert(row.title.length>0);
}
for(const [query,code,skill] of [['261313','261313',1],['２６１３１３','261313',1],['Software Engineer','261313',1],['Software Architect','261313',1],['软件工程师','261313',1],['幼教','241111',1],['Chef','351311',2],['Cook','351411',3]]) {
  const result=searchOccupations(query).matches[0];
  assert.equal(result?.code,code,query);
  assert.equal(result?.skill,skill,query);
}
for(const query of ['护士','会计']) assert(searchOccupations(query).total>1,query+' requires explicit selection');
for(const query of ['zzzzzzzz','', 'a']) assert.equal(searchOccupations(query).total,0);
assert.equal(getOccupation('999999'),null);
assert.equal(vpt({occupation:'351311',skill:'1'}).breakdown.skill,0,'Manual skill cannot override the official record');
assert.equal(vpt({occupation:'351411'}).breakdown.skill,0);
assert.equal(vpt({occupation:'999999',skill:'1'}).total,null);
assert.equal(vpt({occupation:'423111'}).total,null,'Skill levels outside 1–3 withhold the VPT total');
assert.equal(vpt({experience:'2',earningEligible:'yes',salary:'100000'}).total,679);
const html = await readFile(new URL('../content/points-calculator.html',import.meta.url),'utf8');
const picker = await readFile(new URL('../public/occupation-picker.mjs',import.meta.url),'utf8');
assert.match(html,/role="combobox"/);
assert.match(html,/role="listbox"/);
assert.doesNotMatch(html,/name="skill"/);
assert.doesNotMatch(picker,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);
const controller = await readFile(new URL('../public/points-calculator.mjs',import.meta.url),'utf8');
assert.doesNotMatch(html+controller,/你/);
assert.doesNotMatch(controller,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|\.submit\(/);
assert.match(html,/id="points-sources"/);
assert.match(html,/2026–27/);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique field / section IDs for accessible labels');
console.log('PASS: isolated pathway calculators, VPT without federal answers, no score leakage, boundary tables, 950 maximum, English thresholds, invalid inputs, privacy and bilingual copy.');

assert.match(html,/data-pc-common hidden/);
assert.match(html,/data-pc-federal hidden/);
assert.match(html,/data-pc-reference="vpt"/);
assert.match(html,/name="vptEducation"/);
assert.match(html,/<\/html>\s*$/);
const formMarkup = html.match(/<form\b[\s\S]*?<\/form>/)?.[0] || '';
for (const name of ['age','englishMode','english','vptEducation','vptPartner','experience','occupation','partnerCode','earningEligible','salary','overseas','australian','education','partner']) assert(formMarkup.includes('name="'+name+'"'),name+' belongs to the calculator form');
for (const hook of ['common','federal','vpt','english-level','english-scores','pte-date','salary','partner-code','result-button']) assert(html.includes('data-pc-'+hook),'Controller hook exists: '+hook);
assert.doesNotMatch(controller,/vptTotal|result\\.federal/);
