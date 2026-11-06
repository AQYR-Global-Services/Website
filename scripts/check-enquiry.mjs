import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parse} from 'parse5';
import * as pointsEnquiry from '../public/points-enquiry.mjs';
import {calculate} from '../public/points-rules.mjs';
import {stateCodes} from '../public/state-nomination.mjs';
import {rankingPrograms,calculateRanking} from '../public/nomination-ranking.mjs';
import {nominationPathways} from '../public/nomination-pathways.mjs';
const examplePostcodes={vic:'3220',nsw:'2300',qld:'4217',wa:'6000',sa:'5000',tas:'7000',act:'2601',nt:'0800'};

// Exercise the actual contact handler without opening an email app or sending a message.
const script = await readFile(new URL('../public/script.js',import.meta.url),'utf8');
const html = await readFile(new URL('../content/contact.html',import.meta.url),'utf8');
const handler = script.slice(script.indexOf('  if (form) {'),script.indexOf('  // Do not re-hide'))
  .replace(/import\(location\.pathname\.endsWith\('\.html'\) \? '\.\/public\/points-enquiry\.mjs\?v=[^']+' : '\/points-enquiry\.mjs\?v=[^']+'\)/,'Promise.resolve(pointsEnquiry)');
async function setup(hash='',lang='en',options={}) {
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key,{value:'',checked:false,disabled:false,hidden:false,textContent:'',dataset:{},events:{},focus(){this.focused=true;},select(){this.selected=true;},addEventListener(event,fn){this.events[event]=fn;}});
    return nodes.get(key);
  };
  for (const match of html.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const field = node('[name="'+match[1]+'"]');
    field.options = [...match[2].matchAll(/<option value="([^"]*)" data-en="([^"]*)" data-zh="([^"]*)"/g)].map(([,value,en,zh])=>({value,dataset:{en,zh}}));
    Object.defineProperty(field,'selectedOptions',{get(){return this.options.filter(option=>option.value===this.value);}});
  }
  const form = {querySelector:node,events:{},addEventListener(event,fn){this.events[event]=fn;},reportValidity(){return options.valid !== false;}};
  const location = {search:options.search ?? '?service=skilled&audience=individual',hash,pathname:'/contact',href:''};
  class FormData {
    get(name) {
      const field=node('[name="'+name+'"]');
      if(field.disabled || name==='includeEstimate' && !field.checked) return null;
      return name==='includeEstimate'?'yes':field.value;
    }
  }
  const clipboard={writes:[],async writeText(text){if(options.clipboardDenied)throw Error('Denied');this.writes.push(text);}};
  const context = {form,root:{dataset:{lang}},location,window:{location},navigator:{clipboard},URLSearchParams,FormData,pointsEnquiry,Promise,MutationObserver:class{observe(){}},
    history:{state:null,replaceState(_state,_title,url){location.hash=new URL(url,'https://example.test').hash;}},
    document:{querySelector(){return {scrollIntoView(){}};}},requestAnimationFrame(fn){fn();}};
  vm.runInNewContext(handler,context);
  await new Promise(resolve=>setImmediate(resolve));
  for(const [name,value] of Object.entries({name:'Test visitor',email:'test@example.test',message:'Please review my estimate.'})) node('[name="'+name+'"]').value=value;
  return {node,location,form,clipboard,async submit(action='email'){location.href='';await form.events.submit({preventDefault(){},submitter:{value:action}});return location.href ? new URL(location.href).searchParams.get('body') : null;}};
}
for(const lang of ['en','zh']) {
  const preview=await setup('',lang);
  assert.equal(await preview.submit('preview'),null,'Preview must not open an email app');
  assert(!preview.node('#enquiry-draft').hidden);
  assert.match(preview.node('#enquiry-draft-text').value,/info@hiremiiglobal.com/);
  assert.match(preview.node('#enquiry-draft-text').value,/Test visitor/);
  await preview.node('#enquiry-copy').events.click();
  assert.equal(preview.clipboard.writes[0],preview.node('#enquiry-draft-text').value);
  preview.form.events.input();
  assert(preview.node('#enquiry-draft').hidden);
  assert(preview.node('#enquiry-copy').disabled);
  assert.equal(preview.node('#enquiry-draft-text').value,'','Edited form must not leave a stale copyable draft');
}
const deniedCopy=await setup('','en',{clipboardDenied:true});
await deniedCopy.submit('preview');await deniedCopy.node('#enquiry-copy').events.click();
assert(deniedCopy.node('#enquiry-draft-text').selected,'Clipboard denial must leave a manually copyable draft');
const invalidForm=await setup('','en',{valid:false});
assert.equal(await invalidForm.submit('preview'),null);
assert(invalidForm.node('#enquiry-draft').hidden,'Invalid form must not generate a draft');
for(const [search,expected] of [['?service=visitor-student&audience=individual','Individual visa enquiry'],['?service=partner-family&audience=individual','Individual visa enquiry'],['?service=sponsorship&audience=employer','Employer'],['?service=sponsorship&audience=individual','Skilled professional']]) {
  assert.equal((await setup('','en',{search})).node('[name="enquiryType"]').value,expected);
}
// Use the actual HTML links, including entity decoding, rather than testing only hand-built query strings.
for(const [page,expected] of [['employer-sponsorship','Employer'],['sponsored-visas','Skilled professional'],['labour-agreements','Employer']]) {
  const source=await readFile(new URL('../content/'+page+'.html',import.meta.url),'utf8');
  const links=[];
  function walk(n){if(n.tagName==='a'){const href=n.attrs.find(a=>a.name==='href')?.value;if(href?.startsWith('/contact?'))links.push(new URL(href,'https://example.test'));}for(const child of n.childNodes||[])walk(child);}
  walk(parse(source));assert(links.length,page);
  for(const link of links){
    assert([...link.searchParams.keys()].every(key=>['service','audience'].includes(key)),'HTML-encoded parameters must not become query keys');
    assert.equal((await setup('','en',{search:link.search})).node('[name="enquiryType"]').value,expected,page);
  }
}
const plain=await setup();
assert(!plain.node('[name="includeEstimate"]').checked);
assert.doesNotMatch(await plain.submit(),/Estimated points/);
for(const lang of ['en','zh']) {
  const chosen=await setup('#enquiry?pathway=vic-190&score=679',lang);
  assert(chosen.node('[name="includeEstimate"]').checked);
  assert.equal(chosen.node('[name="estimatedScore"]').value,'679');
  assert.equal(chosen.location.hash,'#enquiry');
  const body=await chosen.submit();
  assert.match(body,/VPT: 679/);
  assert.match(body,lang==='zh'?/客户自评/:/self-assessed/);
  assert.doesNotMatch(body,/salary|occupationQuery|listening/);
  chosen.node('[name="estimatedScore"]').value='650';
  assert.match(await chosen.submit(),/VPT: 650/);
  chosen.node('[name="includeEstimate"]').checked=false;
  chosen.node('[name="includeEstimate"]').events.change();
  assert.doesNotMatch(await chosen.submit(),/679|650|Estimated points|客户自评/);
}
const nsw=await setup('#enquiry?pathway=nsw-190&score=80');
assert.match(await nsw.submit(),/conditional \+5 nomination points.*80/);
nsw.node('[name="requestType"]').value='hiring';
nsw.node('[name="requestType"]').events.change();
assert.doesNotMatch(await nsw.submit(),/Estimated points/);
for(const hash of ['#enquiry?pathway=vic-190&score=951','#enquiry?pathway=nsw-189&score=131','#enquiry?pathway=nsw-190&score=80.5','#enquiry?pathway=unknown&score=80','#enquiry?pathway=vic-190&score=']) {
  assert(!(await setup(hash)).node('[name="includeEstimate"]').checked,hash);
}

const vpt = {state:'vic',visa:'190',age:'29',englishMode:'level',english:'superior',occupation:'261313',experience:'2',vptEducation:'bachelor',vptPartner:'no',earningEligible:'yes',salary:'100000'};
const vic491={...vpt,visa:'491',regionalPostcode:'3220',regionalConfirmed:true};
const eoi = {state:'nsw',visa:'190',age:'25',englishMode:'level',english:'proficient',overseas:'3',australian:'1',education:'bachelor',partner:'single',study:true};
function fragment(answers) {
  return '#enquiry?'+new URLSearchParams({pathway:answers.state+'-'+answers.visa,score:String(calculate(answers).total),details:JSON.stringify(pointsEnquiry.createPointsSnapshot(answers))});
}
const editedImport=await setup(fragment(vpt));
const pendingPreview=editedImport.submit('preview');editedImport.form.events.input();await pendingPreview;
assert(editedImport.node('#enquiry-draft').hidden,'Editing during an awaited score import must cancel the pending draft');
const extraEnglish = [
  {...eoi,englishMode:'cambridge',listening:'175',reading:'179',writing:'193',speaking:'194',testDate:'2026-10-01'},
  {...eoi,englishMode:'toefl',listening:'22',reading:'22',writing:'26',speaking:'24',testDate:'2026-10-01',testEvidence:'yes'},
  {...eoi,englishMode:'oet',listening:'B',reading:'B',writing:'B',speaking:'B',testDate:'2025-08-06'},
  {...eoi,englishMode:'passport',passportCountry:'uk'},
];
for(const lang of ['en','zh']) for (const answers of [vpt,vic491,{...vpt,experience:'8'},{...vpt,experience:'9'},...stateCodes.flatMap(state=>['189','190','491'].filter(visa=>state!=='vic'||visa==='189').map(visa=>({...eoi,state,visa,...(visa==='491'?{regionalConfirmed:true,regionalPostcode:examplePostcodes[state]}:{})}))),...extraEnglish]) {
  const imported=await setup(fragment(answers),lang);
  assert(imported.node('[name="estimatedScore"]').readOnly);
  assert(imported.node('[name="estimatePathway"]').disabled);
  assert(!imported.node('#enquiry-points-detail').hidden);
  assert.equal(imported.location.hash,'#enquiry');
  const body=await imported.submit();
  assert.match(body,lang==='zh'?/客户自评/:/self-assessed/);
  assert(body.includes(pointsEnquiry.formatPointsEnquiry(pointsEnquiry.createPointsSnapshot(answers),lang)));
  assert.doesNotMatch(body,/occupationQuery|partnerOccupationQuery|undefined|NaN/);
  imported.node('[name="includeEstimate"]').checked=false;
  imported.node('[name="includeEstimate"]').events.change();
  assert.doesNotMatch(await imported.submit(),/Answers and points|各项填写与得分|Rule version|规则版本/);
}
for (const answers of extraEnglish) {
  const snapshot=pointsEnquiry.createPointsSnapshot(answers);
  assert(snapshot,'English evidence survives enquiry serialisation');
  assert.equal(calculate(snapshot.answers).total,calculate(answers).total);
  const body=pointsEnquiry.formatPointsEnquiry(snapshot);
  if(answers.englishMode==='passport')assert.match(body,/Passport exemption.*United Kingdom/);
  else assert(body.includes(answers.testDate));
  assert.doesNotMatch(body,/undefined|NaN/);
}
const capped=pointsEnquiry.createPointsSnapshot({...eoi,overseas:'8',australian:'8'});
const eightYears=pointsEnquiry.createPointsSnapshot({...vpt,experience:'8'});
assert.equal(calculate(eightYears.answers).total,739);
assert.match(pointsEnquiry.formatPointsEnquiry(eightYears,'zh'),/提名职业工作经验: 8 年及以上（估算） — 100 分/);
assert.match(pointsEnquiry.formatPointsEnquiry(eightYears),/Nominated occupation experience: 8 years or more \(planning estimate\) — 100 points/);
assert.equal(pointsEnquiry.pointsEnquiryRows(capped).find(row=>row.key==='overseas').points,15);
assert.equal(pointsEnquiry.pointsEnquiryRows(capped).find(row=>row.key==='australian').points,20);
assert.equal(pointsEnquiry.pointsEnquiryRows(capped).find(row=>row.key==='employment').points,20);
for(const answers of [vpt,eoi]) {
  const snapshot=pointsEnquiry.createPointsSnapshot({...answers,name:'DO NOT COPY',occupationQuery:'DO NOT COPY'});
  assert(!JSON.stringify(snapshot).includes('DO NOT COPY'));
  const rows=pointsEnquiry.pointsEnquiryRows(snapshot);
  assert.equal(rows.filter(row=>row.additive).reduce((sum,row)=>sum+row.points,0),calculate(answers).total);
}
const detailNsw=await setup(fragment(eoi));
assert.match(await detailNsw.submit(),/Conditional state nomination: Only if state nomination is granted — 5 points/);
detailNsw.node('[name="requestType"]').value='hiring';
detailNsw.node('[name="requestType"]').events.change();
assert.doesNotMatch(await detailNsw.submit(),/Estimated points|Answers and points/);
const invalid=await setup(fragment(vpt).replace('score=679','score=680'));
assert.equal(await invalid.submit(),null,'A mismatched breakdown must not silently send only a total');
assert.equal(pointsEnquiry.parsePointsSnapshot('{invalid','vic-190',679),null);
assert.equal(pointsEnquiry.parsePointsSnapshot('x'.repeat(4097),'vic-190',679),null);
assert.equal(pointsEnquiry.createPointsSnapshot({...eoi,study:'true'}),null);
assert.equal(pointsEnquiry.createPointsSnapshot({...vpt,age:'29\nInjected text'}),null);
for(const [program,config]of Object.entries({...nominationPathways,...rankingPrograms})){
  const source={state:config.state,visa:config.visa||'190',program,answers:Object.fromEntries((config.fields||[]).map(f=>[f.key,'0'])),confirmed:true,context:{age:'',englishMode:'level',english:'superior',...(config.visa==='491'?{regionalPostcode:examplePostcodes[config.state],regionalConfirmed:true}:{})}};
  const snapshot=pointsEnquiry.createNominationSnapshot({...source,name:'DO NOT COPY',context:{...source.context,name:'DO NOT COPY'}});
  assert(snapshot,program);
  assert(!JSON.stringify(snapshot).includes('DO NOT COPY'));
  for(const lang of ['en','zh']){
    const formatted=pointsEnquiry.formatNominationEnquiry(snapshot,lang);
    assert(!/undefined|NaN/.test(formatted));
    assert(formatted.includes(lang==='zh'?'未填写':'Not supplied'),'Missing age stays explicit in ROI-only consultation');
    const suffix='#enquiry?'+new URLSearchParams({nomination:JSON.stringify(snapshot)});
    const roiOnly=await setup(suffix,lang);
    assert(!roiOnly.node('[name="includeEstimate"]').checked);
    assert(roiOnly.node('[name="includeNomination"]').checked);
    assert((await roiOnly.submit()).includes(formatted),'ROI-only email without completed EOI');
    roiOnly.node('[name="includeNomination"]').checked=false;
    roiOnly.node('[name="includeNomination"]').events.change();
    assert(!(await roiOnly.submit()).includes(formatted),'ROI opt-out removes all state answers');
  }
}
const roi=pointsEnquiry.createNominationSnapshot({state:'act',visa:'190',program:'act-resident',answers:Object.fromEntries(rankingPrograms['act-resident'].fields.map(f=>[f.key,'0'])),confirmed:true,context:{age:'30',englishMode:'level',english:'superior'}});
assert.equal(roi.answers.english,'1','State English is re-derived from supplied evidence');
for(const lang of ['en','zh']){
  const both=await setup(fragment({...eoi,state:'act'})+'&'+new URLSearchParams({nomination:JSON.stringify(roi)}),lang);
  const body=await both.submit();
  assert(body.includes('Canberra Matrix: 15'));
  assert(body.includes(pointsEnquiry.formatPointsEnquiry(pointsEnquiry.createPointsSnapshot({...eoi,state:'act'}),lang)));
  both.node('[name="includeEstimate"]').checked=false;both.node('[name="includeEstimate"]').events.change();
  assert((await both.submit()).includes('Canberra Matrix: 15'),'Independent EOI opt-out keeps ROI');
  both.node('[name="requestType"]').value='hiring';both.node('[name="requestType"]').events.change();
  assert((await both.submit()).includes('Canberra Matrix: 15'),'Changing enquiry topic does not silently discard a selected ROI attachment');
}
const unfinished=pointsEnquiry.createNominationSnapshot({...roi,answers:{},confirmed:false});
assert.match(pointsEnquiry.formatNominationEnquiry(unfinished,'zh'),/自评未完成，不计算总分/);
const tsgConflict=pointsEnquiry.createNominationSnapshot({state:'tas',visa:'190',program:'tas-tsg',answers:{...Object.fromEntries(rankingPrograms['tas-tsg'].fields.map(f=>[f.key,'0'])),employment:'1',interviews:'1'},confirmed:true,context:{englishMode:'level',english:'competent'}});
assert.match(pointsEnquiry.formatNominationEnquiry(tsgConflict,'zh'),/存在冲突.*不计算总分/);
assert.equal(calculateRanking('tas-tsg',tsgConflict.answers,true).total,null);
assert.equal(pointsEnquiry.parseNominationSnapshot('{invalid'),null);
assert.equal(pointsEnquiry.parseNominationSnapshot('x'.repeat(6145)),null);
assert.equal(pointsEnquiry.createNominationSnapshot({...roi,state:'nsw'}),null);
assert.equal(pointsEnquiry.createNominationSnapshot({...roi,visa:'189'}),null);
assert.equal(pointsEnquiry.createNominationSnapshot({...roi,answers:{residence:'999'}}),null);
const unreadable=await setup('#enquiry?nomination=%7Bbad');
assert.equal(await unreadable.submit(),null,'Invalid selected ROI cannot silently send without its attachment');
unreadable.node('[name="includeNomination"]').checked=false;unreadable.node('[name="includeNomination"]').events.change();
assert(await unreadable.submit(),'Opt-out allows ordinary consultation even if imported ROI was invalid');
for(const state of stateCodes){
  const answers=state==='vic'?vic491:{...eoi,state,visa:'491',regionalConfirmed:true,regionalPostcode:examplePostcodes[state]};
  const snapshot=pointsEnquiry.createPointsSnapshot(answers);
  const rows=pointsEnquiry.pointsEnquiryRows(snapshot);
  assert.equal(rows.filter(row=>row.additive).reduce((sum,row)=>sum+row.points,0),calculate(answers).total);
  if(state==='vic')assert(!rows.some(row=>row.key==='nomination'),'VPT never includes nomination +15');
  else assert.equal(rows.find(row=>row.key==='nomination').points,15);
  assert.equal(pointsEnquiry.createPointsSnapshot({...answers,regionalConfirmed:false}),null);
  const imported=await setup(fragment(answers));
  if(state==='vic'){
    assert.match(await imported.submit(),/VPT: 679/);
    assert.doesNotMatch(await imported.submit(),/conditional \+15 nomination points/);
  }else assert.match(await imported.submit(),/conditional \+15 nomination points/);
  assert.match(await imported.submit(),/491 designated regional requirements/);
}
assert(!(await setup('#enquiry?pathway=vic-491&score=951')).node('[name="includeEstimate"]').checked);
assert.equal(pointsEnquiry.createPointsSnapshot(vic491).version,2);
assert.equal(pointsEnquiry.parsePointsSnapshot(JSON.stringify({version:1,answers:vic491}),'vic-491',679),null,'Old EOI snapshot cannot become VPT');
assert.equal(await (await setup('#enquiry?pathway=vic-491&score=100')).submit(),null,'Legacy VIC491 total without VPT detail requires recalculation or opt-out');
for(const program of ['act-resident-491','act-overseas-491','tas-tse-491','tas-tsg-491','tas-ter-491','tas-tbo-491']){
  const config=rankingPrograms[program];
  const input={state:config.state,visa:'491',program,answers:Object.fromEntries(config.fields.map(f=>[f.key,'0'])),confirmed:true,context:{englishMode:'level',english:'superior',regionalPostcode:examplePostcodes[config.state],regionalConfirmed:true}};
  const snap=pointsEnquiry.createNominationSnapshot(input);
  assert(snap&&pointsEnquiry.parseNominationSnapshot(JSON.stringify(snap)));
  assert.equal(pointsEnquiry.createNominationSnapshot({...input,visa:'190'}),null,'491 tables cannot be relabelled190');
  assert.equal(pointsEnquiry.createNominationSnapshot({...input,context:{...input.context,regionalConfirmed:'true'}}),null);
  const blocked=pointsEnquiry.createNominationSnapshot({...input,context:{...input.context,regionalPostcode:'9999'}});
  assert.match(pointsEnquiry.formatNominationEnquiry(blocked,'zh'),/自评未完成.*491 邮编/);
  for(const lang of ['en','zh']){
    const both=await setup(fragment({...eoi,state:config.state,visa:'491',regionalPostcode:examplePostcodes[config.state],regionalConfirmed:true})+'&'+new URLSearchParams({nomination:JSON.stringify(snap)}),lang);
    const body=await both.submit();
    assert(body.includes(pointsEnquiry.formatNominationEnquiry(snap,lang)));
    assert(body.includes('491'));
    assert.match(body,lang==='zh'?/含有条件州提名 \+15 分/:/conditional \+15 nomination points/);
  }
}
console.log('PASS: 24 scoring modes and 30 nomination paths; independent EOI/ROI attachments, 491 regional validation and subclass-safe imported scores.');
