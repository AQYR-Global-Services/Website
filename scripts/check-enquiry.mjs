import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Exercise the actual contact handler without opening an email app or sending a message.
const script = await readFile(new URL('../public/script.js',import.meta.url),'utf8');
const html = await readFile(new URL('../content/contact.html',import.meta.url),'utf8');
const handler = script.slice(script.indexOf('  if (form) {'),script.indexOf('  // Do not re-hide'));
function setup(hash='',lang='en') {
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key,{value:'',checked:false,disabled:false,hidden:false,dataset:{},events:{},addEventListener(event,fn){this.events[event]=fn;}});
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
  const context = {form,root:{dataset:{lang}},location,window:{location},URLSearchParams,FormData,
    history:{state:null,replaceState(_state,_title,url){location.hash=new URL(url,'https://example.test').hash;}},
    document:{querySelector(){return {scrollIntoView(){}};}},requestAnimationFrame(fn){fn();}};
  vm.runInNewContext(handler,context);
  for(const [name,value] of Object.entries({name:'Test visitor',email:'test@example.test',message:'Please review my estimate.'})) node('[name="'+name+'"]').value=value;
  return {node,location,submit(){form.events.submit({preventDefault(){}});return new URL(location.href).searchParams.get('body');}};
}
const plain=setup();
assert(!plain.node('[name="includeEstimate"]').checked);
assert.doesNotMatch(plain.submit(),/Estimated points/);
for(const lang of ['en','zh']) {
  const chosen=setup('#enquiry?pathway=vic-190&score=679',lang);
  assert(chosen.node('[name="includeEstimate"]').checked);
  assert.equal(chosen.node('[name="estimatedScore"]').value,'679');
  assert.equal(chosen.location.hash,'#enquiry');
  const body=chosen.submit();
  assert.match(body,/VPT: 679/);
  assert.match(body,lang==='zh'?/客户自评/:/self-assessed/);
  assert.doesNotMatch(body,/salary|occupationQuery|listening/);
  chosen.node('[name="estimatedScore"]').value='650';
  assert.match(chosen.submit(),/VPT: 650/);
  chosen.node('[name="includeEstimate"]').checked=false;
  chosen.node('[name="includeEstimate"]').events.change();
  assert.doesNotMatch(chosen.submit(),/679|650|Estimated points|客户自评/);
}
const nsw=setup('#enquiry?pathway=nsw-190&score=80');
assert.match(nsw.submit(),/conditional \+5 nomination points.*80/);
nsw.node('[name="requestType"]').value='hiring';
nsw.node('[name="requestType"]').events.change();
assert.doesNotMatch(nsw.submit(),/Estimated points/);
for(const hash of ['#enquiry?pathway=vic-190&score=951','#enquiry?pathway=nsw-189&score=131','#enquiry?pathway=nsw-190&score=80.5','#enquiry?pathway=unknown&score=80','#enquiry?pathway=vic-190&score=']) {
  assert(!setup(hash).node('[name="includeEstimate"]').checked,hash);
}
console.log('PASS: enquiry opt-in, VPT/EOI labels, editable totals, omission after opt-out, bilingual email drafts and invalid-fragment rejection. No email opened or sent.');
