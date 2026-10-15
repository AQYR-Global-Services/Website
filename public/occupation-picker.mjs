import {getOccupation, searchOccupations} from './occupation-search.mjs';

export function initialiseOccupationPicker(host, onChange) {
  const input = host.querySelector('#pc-occupation-query');
  const value = host.querySelector('#pc-occupation');
  const list = host.querySelector('#pc-occupation-options');
  const status = host.querySelector('#pc-occupation-status');
  const selected = host.querySelector('#pc-occupation-selected');
  const text = (en,zh)=>document.documentElement.dataset.lang === 'zh' ? zh : en;
  let active = -1;
  let found = [];
  let open = false;
  function close() {
    open = false; active = -1; list.hidden = true;
    input.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');
  }
  function setActive(index) {
    active = index;
    [...list.children].forEach((node,i)=>node.setAttribute('aria-selected',String(i===active)));
    const option = list.children[active];
    if (option) {
      input.setAttribute('aria-activedescendant',option.id);
      option.scrollIntoView({block:'nearest'});
    }
  }
  function choose(row) {
    value.value = row.code;
    input.value = row.code+' · '+row.title;
    status.textContent = '';
    close();
    refresh();
    onChange();
    input.focus({preventScroll:true});
  }
  function search() {
    const result = searchOccupations(input.value,1023);
    found = result.matches;
    list.replaceChildren();
    const query = input.value.trim();
    if (!query) {status.textContent = '';close();return;}
    if (!found.length) {
      status.textContent = text('No match yet. Try a 6-digit code, an English title, or a more specific keyword. Select a result before points are calculated.','暂未匹配，请尝试六位代码、英文名称或更具体的关键词。选定搜索结果后才会计分。');
      close(); return;
    }
    found.forEach((row,index)=>{
      const option = document.createElement('li');
      option.id = 'pc-occupation-option-'+row.code;
      option.setAttribute('role','option');
      option.setAttribute('aria-selected',String(index===active));
      const title = document.createElement('strong');
      title.textContent = row.title;
      const detail = document.createElement('span');
      detail.textContent = row.code+' · '+text('Skill level ','技能等级 ')+row.skill;
      option.append(title,detail);
      option.addEventListener('pointerdown',event=>event.preventDefault());
      option.addEventListener('click',()=>choose(row));
      list.append(option);
    });
    open = true; list.hidden = false;
    input.setAttribute('aria-expanded','true');
    status.textContent = text(result.total+' matches'+(result.total>found.length?'; showing the first '+found.length:'')+'. Choose the occupation matching your assessment.','匹配 '+result.total+' 项'+(result.total>found.length?'，显示前 '+found.length+' 项':'')+'。请选择与职业评估一致的职业。');
  }
  function refresh() {
    if (input.disabled) close();
    const row = getOccupation(value.value);
    selected.replaceChildren();
    selected.hidden = !row;
    if (row) {
      const title = document.createElement('strong');
      title.textContent = row.code+' · '+row.title;
      const points = document.createElement('span');
      points.textContent = text('Skill level ','技能等级 ')+row.skill+(row.skill<=3 ? ' · VPT +'+(row.skill===1?50:0) : text(' · outside this calculator’s VPT level 1–3 scope; verify before claiming points.',' · 不在本工具 VPT 等级 1–3 范围内，需核对后再计分。'));
      selected.append(title,points);
    } else if (!input.value) {status.textContent='';close();}
    if (open) search();
  }
  input.addEventListener('input',()=>{
    value.value='';active=-1;
    refresh();search();onChange();
  });
  input.addEventListener('focus',()=>{if (!value.value && input.value) search();});
  input.addEventListener('keydown',event=>{
    if (event.key === 'Escape') {close();return;}
    if (event.key === 'Tab') {close();return;}
    if (event.key==='ArrowDown' || event.key==='ArrowUp') {
      if (!open) search();
      if (!found.length || !open) return;
      event.preventDefault();
      setActive(event.key==='ArrowDown' ? Math.min(active+1,found.length-1) : Math.max(active-1,0));
    } else if (event.key==='Enter' && open && found.length) {
      event.preventDefault();choose(found[active<0?0:active]);
    }
  });
  host.addEventListener('focusout',event=>{
    if (!event.relatedTarget || !event.relatedTarget.closest('.pc-occupation')) close();
  });
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.pc-occupation')) close();});
  return {refresh};
}
