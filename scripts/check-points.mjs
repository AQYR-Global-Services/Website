import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {occupations} from '../public/anzsco-2013.mjs';
import {getOccupation, searchOccupations} from '../public/occupation-search.mjs';
import {calculate, englishLevel, federalAge, vptAge, vptAges, vptEarnings, earningsPoints, priorityCodes} from '../public/points-rules.mjs';
import {englishTests} from '../public/english-rules.mjs';
import {states,stateCodes,estimateLimits,regional491} from '../public/state-nomination.mjs';
import {rankingPrograms,calculateRanking} from '../public/nomination-ranking.mjs';
import {calculatorValues} from '../public/points-calculator.mjs';
import {lookupRegionalPostcode,regionalPostcodeCanProceed,regionalRanges,sharedPostcodes} from '../public/regional-postcodes.mjs';
import {geographicPostcodes} from '../public/postcode-reference.mjs';
import {rankingEnglishSelection} from '../public/nomination-ranking.mjs';
const examplePostcodes={vic:'3220',nsw:'2300',qld:'4217',wa:'6000',sa:'5000',tas:'7000',act:'2601',nt:'0800'};

for(const visa of ['189','190','491']) {
  const values=calculatorValues([
    {name:'state',type:'hidden',value:'act'},
    {name:'visa',type:'radio',value:'189',checked:visa==='189'},
    {name:'visa',type:'radio',value:'190',checked:visa==='190'},
    {name:'visa',type:'radio',value:'491',checked:visa==='491'},
    {name:'study',type:'checkbox',checked:false},
    {name:'age',type:'number',value:'30'},
    {name:'',type:'submit',value:'ignored'},
  ]);
  assert.deepEqual(values,{state:'act',visa,study:false,age:'30'});
}

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
for (const state of stateCodes) for (const visa of ['189','190','491']) {
  const result = calc({state,visa,regionalConfirmed:true,regionalPostcode:examplePostcodes[state]});
  assert.equal(result.mode,state==='vic'&&visa==='190'?'vpt':'federal');
  if(result.mode==='federal') assert.equal(result.total,visa==='491'?90:visa==='190'?80:75);
  if(visa==='491') {
    assert.equal(result.nomination,15,'491 never stacks 190 nomination points');
    assert.equal(estimateLimits[state+'-491'],145);
    assert.ok(regional491[state].url.startsWith('https://'));
    assert.equal(calc({state,visa}).total,null,'491 requires regional acknowledgement');
    assert.ok(calc({state,visa}).missing.includes('regionalConfirmed'));
    assert.equal(calc({state,visa,regionalConfirmed:'true'}).total,null,'Do not coerce false or string confirmations');
  }
}
assert.equal(stateCodes.length,8);
for (const state of stateCodes) {
  assert(states[state].url.startsWith('https://'));
  assert.equal(calc({state,visa:'189',salary:'999999',vptEducation:'phd'}).total,75,'189 has identical federal points in '+state);
  if(state!=='vic')assert.equal(calc({state,visa:'190',experience:'9',salary:'170000'}).total,80,'190 federal score and state ranking stay separate in '+state);
}
assert.equal(calc({state:'unknown'}).total,null);
const expectedRankPoints = {
  'act-resident':[[0,25,20,15,10,5],[0,15,10,0],[0,5],[0,20],[0,20,10],[0,10,5],[0,20,15,10,5],[0,15,10,5,5],[0,20,15,10,5],[0,20,15,10,5],[0,20,10],[0,5]],
  'act-overseas':[[0,20,15,10,5],[0,20],[0,15,10,0],[0,5],[0,20],[0,20,15,10],[0,15,10,5],[0,20,15,10,5],[0,20,15,10,5],[0,20,5],[0,10,10]],
  'tas-tse':[[0,1000],[0,500,300,40,30,25],[0,40,15,10],[0,15],[0,4],[0,2],[0,1],[0,1]],
  'tas-tsg':[[0,1000],[0,500,300,100,75,50,35,20,9,7,7,4],[0,250],[0,8],[0,3],[0,45,25,20],[0,35],[0,15],[0,10],[0,4,3,2],[0,3],[0,3],[0,1],[0,1],[0,1]],
  'tas-ter':[[0,1000],[0,500,300,25,20,15,8,7,5],[0,45,25,20],[0,45,25],[0,35],[0,30],[0,30],[0,23],[0,15],[0,4,3,2],[0,4],[0,3],[0,3],[0,2],[0,1],[0,1]],
};
for(const [key,config] of Object.entries(rankingPrograms)) {
  assert.deepEqual(config.fields.map(f=>f.options.map(o=>o.points)),expectedRankPoints[key],key+' official table');
  const answers=Object.fromEntries(config.fields.map(f=>[f.key,'0']));
  assert.equal(calculateRanking(key,answers,false).total,null,'Requires explicit source/evidence confirmation');
  assert.equal(calculateRanking(key,answers,true).total,0);
  const empty=calculateRanking(key,{},false);
  assert.deepEqual(empty.missing,config.fields.map(f=>f.key),key+' lists every unanswered field');
  assert.deepEqual(empty.invalid,[]);
  assert.equal(empty.confirmationRequired,true);
  const confirmOnly=calculateRanking(key,answers,false);
  assert.deepEqual(confirmOnly.missing,[],key+' explicit zero is an answer, not missing');
  assert.equal(confirmOnly.confirmationRequired,true);
  for(const f of config.fields){
    const oneMissing=calculateRanking(key,{...answers,[f.key]:''},true);
    assert.deepEqual(oneMissing.missing,[f.key],key+' identifies the exact missing field');
    assert.equal(oneMissing.confirmationRequired,false);
    const oneInvalid=calculateRanking(key,{...answers,[f.key]:'999'},true);
    assert.deepEqual(oneInvalid.invalid,[f.key],key+' distinguishes invalid input from a blank');
    assert.deepEqual(oneInvalid.missing,[]);
  }
  for(const f of config.fields)for(const [index,opt] of f.options.entries())assert.equal(calculateRanking(key,{...answers,[f.key]:String(index)},true).total,opt.points,key+' '+f.key);
  for(const invalid of ['',undefined,'-1','999','0.5','__proto__'])assert.equal(calculateRanking(key,{...answers,[config.fields[0].key]:invalid},true).total,null);
}
assert.equal(calculateRanking('unknown',{},true).total,null);
assert.equal(calculateRanking('__proto__',{},true).total,null);
const graduateZero=Object.fromEntries(rankingPrograms['tas-tsg'].fields.map(f=>[f.key,'0']));
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,phdDuration:'1',phdCommenced:'1'},true),{total:258,tier:'green'},'Both independently met PhD attributes can be claimed');
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,employment:'6',industryJob:'1'},true),{total:38,tier:'orange-plus'},'Industry attribute can coexist with a matching 3–6 month current job');
for(const employment of ['1','2','3','4','5','6','10','11']){
  const answers={...graduateZero,employment,interviews:'1'};
  const conflict=calculateRanking('tas-tsg',answers,true);
  assert.equal(conflict.total,null,'Interview evidence conflicts with each current assessment/study-related employment band');
  assert.equal(conflict.tier,null,'A conflict must not retain Green/Orange priority');
  assert.deepEqual(conflict.conflicts,[{code:'interviews-current-related-job',fields:['interviews','employment']}]);
  assert.equal(calculateRanking('tas-tsg',answers,false).conflicts.length,1,'Show conflict even before evidence confirmation');
}
assert.equal(calculateRanking('tas-tsg',{employment:'1',interviews:'1'},false).total,null,'Partial form must not bypass conflicts');
assert.equal(calculateRanking('tas-tsg',{employment:'1',interviews:'1'},false).conflicts.length,1);
const conflictAndMissing=calculateRanking('tas-tsg',{...graduateZero,employment:'1',interviews:'1',english:'',salary:''},false);
assert.deepEqual(conflictAndMissing.missing,['salary','english'],'Conflict must not hide the full missing-fields list');
assert.equal(conflictAndMissing.confirmationRequired,true);
assert.equal(conflictAndMissing.conflicts.length,1);
assert.equal(calculateRanking('tas-tsg',{...graduateZero,employment:'01',interviews:'01'},true).total,null,'Equivalent accepted option indices must not bypass conflict validation');
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,employment:'1',interviews:'0'},true),{total:500,tier:'green'},'Removing interview claim restores 500, not 501');
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,interviews:'1'},true),{total:1,tier:'orange'},'Interview claim alone remains available');
assert.equal(calculateRanking('tas-tsg',{...graduateZero,gold:'1',interviews:'1'},true).total,null,'Current related health/teaching job also conflicts');
for(const [employment,total] of [['7',21],['8',10],['9',8]])assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,employment,interviews:'1'},true),{total,tier:'orange'},'An explicitly unrelated job does not exclude interview evidence');
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,graduateOffer:'1',interviews:'1'},true),{total:36,tier:'orange-plus'},'A future graduate-program offer alone is not current employment');
assert.deepEqual(calculateRanking('tas-tsg',{...graduateZero,spouseWork:'1',interviews:'1'},true),{total:4,tier:'orange'},'Partner employment is not applicant current employment');
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
for (const [experience,points] of [['0',0],['1',20],['2',40],['4',60],['6',80],['8',100],['9',100]]) assert.equal(vpt({experience}).breakdown.experience,points);
assert.equal(vpt({experience:'8'}).total,700,'Exactly eight years uses the requested 100-point planning estimate');
assert.equal(vpt({experience:'9'}).total,700,'Legacy more-than-eight-year answers remain compatible');
assert.equal(calc({experience:'8'}).total,80,'VPT experience does not affect an EOI pathway');
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
const testEnglish = (mode,scores,date='2026-10-01',extra={}) => englishLevel({englishMode:mode,listening:String(scores[0]),reading:String(scores[1]),writing:String(scores[2]),speaking:String(scores[3]),testDate:date,testEvidence:'yes',...extra});
const englishFixtures = {
  cambridge:[[163,163,170,179],[175,179,193,194],[186,190,210,208]],
  celpip:[[7,7,7,7],[9,8,10,8],[10,10,12,10]],
  met:[[56,55,57,48],[61,63,74,59]],
  oet:[[290,310,290,330],[350,360,380,360],[390,400,420,400]],
  languagecert:[[57,60,64,70],[67,71,78,82],[80,83,89,89]],
  toefl:[[16,16,19,19],[22,22,26,24],[26,27,30,28]],
};
for (const [mode,bands] of Object.entries(englishFixtures)) {
  bands.forEach((scores,index) => {
    const expected = ['competent','proficient','superior'][index];
    assert.equal(testEnglish(mode,scores),expected,mode+' threshold '+expected);
    scores.forEach((_,i) => {
      const lower = [...scores]; lower[i] -= englishTests[mode].step;
      assert.notEqual(testEnglish(mode,lower),expected,mode+' each component required');
    });
    assert.equal(calc({englishMode:mode,listening:String(scores[0]),reading:String(scores[1]),writing:String(scores[2]),speaking:String(scores[3]),testDate:'2026-10-01',testEvidence:'yes'}).breakdown.english,[0,10,20][index]);
    assert.equal(vpt({englishMode:mode,listening:String(scores[0]),reading:String(scores[1]),writing:String(scores[2]),speaking:String(scores[3]),testDate:'2026-10-01',testEvidence:'yes'}).breakdown.english,[0,100,200][index]);
  });
  assert.equal(testEnglish(mode,[999,999,999,999]),null);
  assert.equal(testEnglish(mode,bands[0],'2026-02-30'),null);
  assert.equal(testEnglish(mode,bands[0],'2099-01-01'),null);
}
assert.equal(testEnglish('met',[80,80,80,80]),'proficient','MET must never give Superior');
for (const mode of ['celpip','met','languagecert']) assert.equal(testEnglish(mode,englishFixtures[mode][0],'2025-08-06'),null);
assert.equal(testEnglish('cambridge',[185,185,185,185],'2025-08-06'),'proficient');
assert.equal(testEnglish('cambridge',[200,200,200,200],'2024-02-12',{testEvidence:'no'}),null);
assert.equal(testEnglish('cambridge',[200,200,200,200],'2024-02-11',{testEvidence:''}),'superior');
assert.equal(testEnglish('oet',['B','B','B','B'],'2025-08-06'),'proficient');
assert.equal(testEnglish('oet',['A','A','A','A'],'2025-08-06'),'superior');
assert.equal(testEnglish('oet',['B','B','B','C+'],'2025-08-06'),'below');
assert.equal(testEnglish('oet',['A','A','A','A'],'2025-08-07'),null);
assert.equal(testEnglish('oet',[350,360,385,360]),null,'OET uses ten-point increments');
for (const date of ['2023-07-26','2024-01-01','2024-05-04']) assert.equal(testEnglish('toefl',[30,30,30,30],date),null);
assert.equal(testEnglish('toefl',[28,29,30,26],'2024-05-05'),'superior');
assert.equal(testEnglish('toefl',[28,29,30,26],'2025-08-06'),'superior');
assert.equal(testEnglish('toefl',[26,27,30,28],'2025-08-07',{testEvidence:'no'}),null);
for (const country of ['uk','usa','canada','nz','ireland']) assert.equal(englishLevel({englishMode:'passport',passportCountry:country,english:'superior'}),'competent');
assert.equal(englishLevel({englishMode:'passport',passportCountry:'australia'}),null);
assert.equal(englishLevel({englishMode:'duolingo'}),null);
for (const mode of ['__proto__','constructor','toString']) assert.equal(englishLevel({englishMode:mode}),null);
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
assert.match(html,/id="pc-english-validity"/);
assert.match(html,/English test results are valid for 3 years/);
assert.match(html,/英语成绩有效期为 3 年/);
assert.match(html,/签证获邀前 3 年内参加的考试/);
assert.doesNotMatch(html,/href="[^"]*earnings-calculator"|Open Victoria’s earnings estimator|打开维州官方收入估算器/);
const picker = await readFile(new URL('../public/occupation-picker.mjs',import.meta.url),'utf8');
assert.match(html,/role="combobox"/);
assert.match(html,/role="listbox"/);
assert.doesNotMatch(html,/name="skill"/);
assert.doesNotMatch(picker,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);
const controller = await readFile(new URL('../public/points-calculator.mjs',import.meta.url),'utf8');
assert.doesNotMatch(html+controller,/你/);
assert.doesNotMatch(controller,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|\.submit\(/);
assert.match(html,/id="points-sources"/);
assert.match(html,/<option value="8"[^>]*data-zh="8 年及以上 · \+100"/);
assert.doesNotMatch(html,/<option value="9"|withholds the VPT total|暂不显示 VPT 总分/);
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
for (const hook of ['common','federal','vpt','english-level','english-scores','test-date','passport','test-evidence','salary','partner-code','result-button']) assert(html.includes('data-pc-'+hook),'Controller hook exists: '+hook);
for (const mode of [...Object.keys(englishTests),'passport']) assert(html.includes('value="'+mode+'"'),'English evidence option: '+mode);
for(const state of stateCodes) assert(html.includes('data-pc-state="'+state+'"'),'State index entry '+state);
assert.match(html,/<input id="pc-state" name="state" type="hidden" value="vic">/);
assert.ok(!html.includes('<select id="pc-state"'),'No state dropdown remains');
assert.match(html,/id="pc-state-index"/);
assert.equal((html.match(/<button type="button" data-pc-state="/g)||[]).length,8,'All eight index entries are non-submit buttons');
assert.match(html,/<input id="pc-visa-190" type="radio" name="visa" value="190" checked>/,'Default state calculator is 190');
assert.equal((html.match(/type="radio" name="visa"/g)||[]).length,3,'Exactly three visa choices');
assert.match(html,/id="pc-regional-confirmed" name="regionalConfirmed"/);
assert.equal(calc({visa:'491',regionalPostcode:'2300',regionalConfirmed:true,study:true,regional:true,professional:true,language:true,specialist:true,education:'phd',australian:'8',overseas:'8'}).total,145);
assert.match(html,/id="pc-regional-postcode" name="regionalPostcode"/);
assert.match(html,/id="pc-postcode-check"/);
assert.ok(!html.includes('id="pc-491-state-link"'),'Replaced unusable primary links with inline postcode lookup');
assert.equal(geographicPostcodes.size,2642);
for(const [state,postcode] of Object.entries(examplePostcodes)){
  const lookup=lookupRegionalPostcode(postcode,state);
  assert.equal(regionalPostcodeCanProceed(lookup),true,state+' regional capital / centre');
  assert.equal(lookupRegionalPostcode(postcode,state==='vic'?'nsw':'vic').matchesState,false);
}
for(const [code,state] of [['2000','nsw'],['3000','vic'],['4000','qld'],['3805','vic'],['2750','nsw']]){
  const lookup=lookupRegionalPostcode(code,state);assert.equal(lookup.regional,false,code+' nonregional');
  assert.equal(calc({state,visa:'491',regionalPostcode:code,regionalConfirmed:true}).total,null);
}
for(const code of ['9999','6666','9998','9494','9797'])assert.equal(lookupRegionalPostcode(code,'wa').status,'unknown');
for(const code of ['800','08A0','12345','<img>',null,1234])assert.equal(lookupRegionalPostcode(code,'nt').regional,null);
assert.equal(lookupRegionalPostcode(' 0800 ','nt').regional,true);
for(const code of Object.keys(sharedPostcodes))assert.equal(lookupRegionalPostcode(code,sharedPostcodes[code][0]).status,'shared');
for(const code of ['2899','6798','6799'])assert.equal(lookupRegionalPostcode(code,'wa').status,'unsupported');
for(const state of Object.keys(regionalRanges))for(const [category,ranges] of Object.entries(regionalRanges[state]))for(const part of ranges.split(' ')){
  const [start,end=start]=part.split('-').map(Number);
  for(const n of [start,end]){
    const code=String(n).padStart(4,'0');
    const lookup=lookupRegionalPostcode(code,state);
    if(lookup.status==='matched'&&lookup.matchesState)assert.equal(lookup.category,Number(category),state+' inclusive boundary '+code);
  }
}
for(const postcode of ['3000','9999','2611'])assert.equal(calc({state:'vic',visa:'491',regionalPostcode:postcode,regionalConfirmed:true}).total,null);
assert.equal(calc({state:'vic',visa:'491',regionalPostcode:'2300',regionalConfirmed:true}).total,null,'Wrong selected state cannot produce a 491 total');
assert.equal(calc({visa:'491',regionalConfirmed:true}).total,null,'No postcode cannot produce 491 score');
assert.equal(calc({visa:'491',regionalPostcode:2300,regionalConfirmed:true}).total,null,'Postcodes must retain four digit string representation');
for(const program of ['act-resident','act-overseas']){
  for(const [level,index] of [['superior','1'],['proficient','2'],['competent','3'],['below','']])assert.equal(rankingEnglishSelection(program,{englishMode:'level',english:level}),index);
  assert.equal(rankingEnglishSelection(program,{englishMode:'ielts',listening:'8',reading:'8',writing:'8',speaking:'7'}),'2');
  assert.equal(rankingEnglishSelection(program,{englishMode:'pte',testDate:'2026-10-01',listening:'69',reading:'70',writing:'85',speaking:'88'}),'1');
}
for(const program of ['tas-tse','tas-tsg','tas-ter']){
  assert.equal(rankingEnglishSelection(program,{englishMode:'level',english:'proficient'}),'1');
  assert.equal(rankingEnglishSelection(program,{englishMode:'level',english:'competent'}),'0');
  assert.equal(rankingEnglishSelection(program,{englishMode:'passport',passportCountry:'uk'}),'1');
  assert.equal(rankingEnglishSelection(program,{englishMode:'pte',testDate:'2026-10-01',listening:'69',reading:'70',writing:'85',speaking:''}),'');
}
assert.ok(!html.includes('<select id="pc-visa"'),'Visa selection is not a dropdown');
assert.match(html,/aria-labelledby="pc-calculator-title"/);
assert.doesNotMatch(controller,/vptTotal|result\\.federal/);
