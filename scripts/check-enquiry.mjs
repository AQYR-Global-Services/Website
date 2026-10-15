import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as pointsEnquiry from '../public/points-enquiry.mjs';
import {calculate} from '../public/points-rules.mjs';

// Exercise the actual contact handler without opening an email app or sending a message.
const script = await readFile(new URL('../public/script.js',import.meta.url),'utf8');
const html = await readFile(new URL('../content/contact.html',import.meta.url),'utf8');
const handler = script.slice(script.indexOf('  if (form) {'),script.indexOf('  // Do not re-hide'))
  .replace("import(location.pathname.endsWith('.html') ? './public/points-enquiry.mjs' : '/points-enquiry.mjs')",'Promise.resolve(pointsEnquiry)');
async function setup(hash='',lang='en') {
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key,{value:'',checked:false,disabled:false,hidden:false,textContent:'',dataset:{},events:{},addEventListener(event,fn){this.events[event]=fn;}});
    return nodes.get(key);
  };
  for (const match of html.matchAll(/<select\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const field = node('[name="'+match[1]+'"]');
    field.options = [...match[2].matchAll(/<option value="([^"]*)" data-en="([^"]*)" data-zh="([^"]*)"/g)].map(([,value,en,zh])=>({value,dataset:{en,zh}}));
    Object.defineProperty(field,'selectedOptions',{get(){return this.options.filter(option=>option.value===this.value);}});
  }
  const form = {querySelector:node,events:{},addEventListener(event,fn){this.events[event]=fn;},reportValidity(){return true;}};
  const location = {search:'?service=skilled&audience=individual',hash,pathname:'/contact',href:''};
  class FormData {
    get(name) {
      const field=node('[name="'+name+'"]');
      if(field.disabled || name==='includeEstimate' && !field.checked) return null;
      return name==='includeEstimate'?'yes':field.value;
    }
  }
  const context = {form,root:{dataset:{lang}},location,window:{location},URLSearchParams,FormData,pointsEnquiry,Promise,MutationObserver:class{observe(){}},
    history:{state:null,replaceState(_state,_title,url){location.hash=new URL(url,'https://example.test').hash;}},
    document:{querySelector(){return {scrollIntoView(){}};}},requestAnimationFrame(fn){fn();}};
  vm.runInNewContext(handler,context);
  await new Promise(resolve=>setImmediate(resolve));
  for(const [name,value] of Object.entries({name:'Test visitor',email:'test@example.test',message:'Please review my estimate.'})) node('[name="'+name+'"]').value=value;
  return {node,location,async submit(){location.href='';await form.events.submit({preventDefault(){}});return location.href ? new URL(location.href).searchParams.get('body') : null;}};
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
const eoi = {state:'nsw',visa:'190',age:'25',englishMode:'level',english:'proficient',overseas:'3',australian:'1',education:'bachelor',partner:'single',study:true};
function fragment(answers) {
  return '#enquiry?'+new URLSearchParams({pathway:answers.state+'-'+answers.visa,score:String(calculate(answers).total),details:JSON.stringify(pointsEnquiry.createPointsSnapshot(answers))});
}
for(const lang of ['en','zh']) for (const answers of [vpt,eoi,{...eoi,state:'vic',visa:'189'},{...eoi,visa:'189'}]) {
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
const capped=pointsEnquiry.createPointsSnapshot({...eoi,overseas:'8',australian:'8'});
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
console.log('PASS: four pathways, bilingual itemised email bodies, work-points cap, opt-out, legacy totals, snapshot validation and no automatic sending.');
