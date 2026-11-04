import assert from 'node:assert/strict';
import {nominationPathways} from '../public/nomination-pathways.mjs';
import {readFileSync} from 'node:fs';
import {rankingPrograms,calculateRanking,getRankingAssessment,nominationProgramSupports} from '../public/nomination-ranking.mjs';
import {nominationScoreCard,rankingMaximum} from '../public/points-calculator.mjs';
import {stateCodes,getNominationProgramNotice} from '../public/state-nomination.mjs';
const all={...nominationPathways,...rankingPrograms};
assert.equal(rankingMaximum('act-resident'),195);
assert.equal(rankingMaximum('act-overseas'),185);
for(const id of ['tas-tse','tas-tsg','tas-ter','unknown','__proto__'])assert.equal(rankingMaximum(id),null);
for(const state of stateCodes)for(const visa of ['189','190','491']){
  const notice=getNominationProgramNotice(state,visa);
  assert.equal(!!notice,['sa','qld','tas','wa'].includes(state)&&visa!=='189','Dated guidance appears only for its matching190/491 scenarios');
  if(state==='sa'&&notice){
    assert.equal(notice.published,'2026-10-22');assert.equal(notice.checked,'2026-10-23');
    assert.equal(notice.url,'https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update');
    assert.equal(notice.items.length,3);
    assert.match(notice.items[0].body[0],/on or before 31 January 2027/);
    assert.match(notice.items[0].body[1],/2027 年 1 月 31 日或之前/);
    assert.match(notice.items[1].body[0],/offshore applicants do not submit an ROI/);
    assert.match(notice.items[1].body[1],/境外申请人无需提交 ROI/);
    assert.match(notice.note[0],/does not change federal EOI points/);
    assert.match(notice.note[1],/不改变联邦 EOI 计分/);
  }
}
assert.equal(getNominationProgramNotice('unknown','190'),null);
for(const visa of ['190','491']){
  const tas=getNominationProgramNotice('tas',visa),wa=getNominationProgramNotice('wa',visa);
  assert.equal(tas.published,'2026-10-29');assert.equal(tas.checked,'2026-11-04');
  assert.match(tas.items[0].body[0],/six-week rolling/);
  assert.match(tas.items[0].body[1],/不是额外加分或固定邀请线/);
  assert.match(tas.items[1].body[0],/above.*may still be approved/);
  assert.match(tas.items[1].body[0],/below both.*will be declined/);
  assert.match(tas.items[2].body[0],/Gold.*regardless of total points/);
  assert.match(tas.note[0],/does not resolve equality or intermediate/);
  assert.doesNotMatch(JSON.stringify(tas),/326|316|78 points|75 points/,'Live round values must not become fixed cutoffs');
  assert.equal(wa.published,null,'Do not invent a WA publication or commencement date');
  assert.equal(wa.checked,'2026-11-04');
  assert.match(wa.items[0].body[0],/subject to places/);
  assert.match(wa.items[0].body[0],/carried over to the next program year/);
  assert.match(wa.note[0],/does not change federal EOI points/);
  assert.match(wa.note[1],/不保证提名时间或签证结果/);
}
for(const visa of ['190','491']){
  const before=getNominationProgramNotice('qld',visa,new Date('2026-11-05T12:59:59Z'));
  const announcedDate=getNominationProgramNotice('qld',visa,new Date('2026-11-05T13:00:00Z'));
  const later=getNominationProgramNotice('qld',visa,new Date('2026-11-07T00:00:00Z'));
  assert.equal(before.published,'2026-10-30');assert.equal(before.checked,'2026-11-04');
  assert.match(before.items[0].body[0],/upcoming/);assert.match(before.items[0].body[1],/尚未到公告开放日期/);
  for(const notice of [announcedDate,later]){
    assert.match(notice.items[0].body[0],/Confirm current access/);
    assert.doesNotMatch(notice.items[0].body[0],/are open|now open|is upcoming/);
    assert.match(notice.items[0].body[1],/不实时确认项目是否开放/);
  }
  assert.match(before.items[1].body[0],/9 of the last 12 months/);assert.match(before.items[1].body[0],/6 of the last 9 months/);
  assert.match(before.items[2].body[0],/at least 1 year.*last 3 years/);
  assert.match(before.items[2].body[0],/current employment.*not required at ROI, invitation or nomination/);
  assert.match(before.items[3].body[0],/after 1 July 2022/);
  assert.match(before.items[3].body[0],/except where no return was required/);
  assert.match(before.items[3].body[1],/依法无须报税者除外/);
  assert.equal(before.sources.length,3);for(const source of before.sources)assert.ok(source.url.startsWith('https://www.migration.qld.gov.au/'));
}
assert.equal(getNominationProgramNotice('qld','189',new Date('2026-11-06T00:00:00Z')),null);
const qldChecks=id=>nominationPathways[id].checks.map(pair=>pair.join(' ')).join(' ');
assert.match(qldChecks('qld-graduate'),/after 1 July 2022 \(not on that date\)/);
assert.match(qldChecks('qld-graduate'),/any ANZSCO Skill Level 1 occupation/);
assert.match(qldChecks('qld-graduate'),/does not make unrelated work eligible for federal EOI employment points/);
for(const id of ['qld-local','qld-graduate']){assert.match(qldChecks(id),/9 of the last 12 months/);assert.match(qldChecks(id),/6 of the last 9 months/);}
assert.match(qldChecks('qld-construction'),/Both 190 and 491 require at least 3 continuous months/);
assert.match(qldChecks('qld-offshore'),/Current employment.*not required at ROI, invitation or nomination/);
assert.doesNotMatch(qldChecks('qld-offshore'),/must be currently.*employment|当前仍从事相关工作/);
assert.doesNotMatch(nominationPathways['qld-local'].order.join(' '),/2025–26/);
assert.equal(Object.keys(all).length,30);
for(const state of stateCodes)assert.ok(Object.values(all).some(p=>p.state===state),state);
for(const [id,path] of Object.entries(nominationPathways)){
  assert.ok(path.en&&path.zh&&path.order.length===2&&path.url.startsWith('https://'),id);
  assert.ok(path.checks.length>=3,id);
  for(const pair of path.checks)assert.ok(pair[0]&&pair[1],id);
  assert.equal(calculateRanking(id,{},true).total,null,'Checklist must not become a numerical score');
}
assert.equal(Object.values(all).filter(p=>p.state==='qld').length,4);
assert.equal(Object.values(all).filter(p=>p.state==='wa').length,4);
assert.equal(Object.values(all).filter(p=>p.state==='sa').length,4);
assert.equal(Object.values(all).filter(p=>p.state==='tas').length,9);
assert.ok(!Object.keys(all).some(key=>key==='nt-offshore'));
for(const [id,p] of Object.entries(all)){
  const visa=p.visa||'190';
  assert(nominationProgramSupports(id,p.state,visa));
  for(const wrong of ['189',visa==='190'?'491':'190'])assert(!nominationProgramSupports(id,p.state,wrong),'Do not reinterpret a program under another subclass');
}
for(const [program,config] of Object.entries(all)){
  const zero=Object.fromEntries((config.fields||[]).map(f=>[f.key,'0']));
  const region={regionalPostcode:config.state==='act'?'2601':'7000',regionalConfirmed:true};
  const assessment=getRankingAssessment(program,zero,true,region);
  assert.equal(!!assessment,!!config.fields,program+' only numeric state assessments add a score card');
  for(const lang of ['en','zh']){
    const translate=(en,zh)=>lang==='zh'?zh:en;
    const html=nominationScoreCard(assessment,translate);
    if(!config.fields)assert.equal(html,'');
    else{
      assert.ok(html.includes('data-score="'+(config.state==='act'?'matrix':'tas')+'">0</strong>'));
      assert.ok(html.includes(translate(config.en,config.zh)));
      const maximum=rankingMaximum(program);
      if(maximum!=null)assert.ok(html.includes(translate('/ '+maximum+' points','/ '+maximum+' 分')));
      else assert.ok(html.includes(translate('no common maximum is published','官方未列统一满分')));
      const pending=nominationScoreCard(getRankingAssessment(program,{},false),translate);
      assert.ok(pending.includes('>—</strong>'));
      assert.ok(config.visa==='491'?pending.includes(translate('Complete the 491 postcode','请先完成 491 邮编')):pending.includes(String(config.fields.length+1)));
      if(maximum!=null)assert.ok(pending.includes(translate('/ '+maximum+' points','/ '+maximum+' 分')),'Maximum remains visible before answers are complete');
    }
  }
}
assert.equal(getRankingAssessment('__proto__',{},true),null);
for(const id of Object.keys(rankingPrograms).filter(id=>id.endsWith('-491'))){
  const config=rankingPrograms[id];const answers=Object.fromEntries(config.fields.map(f=>[f.key,'0']));
  const region={regionalPostcode:config.state==='act'?'2601':'7000',regionalConfirmed:true};
  assert.equal(getRankingAssessment(id,answers,true,region).score.total,0);
  for(const invalidRegion of [{},{...region,regionalConfirmed:false},{...region,regionalPostcode:'9999'},{...region,regionalPostcode:'3000'},{...region,regionalPostcode:config.state==='act'?'7000':'2601'}]){
    const score=getRankingAssessment(id,answers,true,invalidRegion).score;
    assert.equal(score.total,null,'491 state ranking cannot bypass regional postcode/obligation validation');
    assert.equal(score.regionalRequired,true);
  }
  const englishInput={englishMode:'level',english:'superior'};
  const optionIndex=config.fields.find(f=>f.key==='english').options.findIndex(o=>o.points===(id==='tas-tbo-491'?2:config.state==='act'?15:1));
  const {rankingEnglishSelection}=await import('../public/nomination-ranking.mjs');
  assert.equal(rankingEnglishSelection(id,englishInput),String(optionIndex));
}
const tsg491Zero=Object.fromEntries(rankingPrograms['tas-tsg-491'].fields.map(f=>[f.key,'0']));
for(const employment of ['1','2','3','4','5','6','10','11'])assert.equal(calculateRanking('tas-tsg-491',{...tsg491Zero,employment,interviews:'1'},true).total,null);
assert.equal(calculateRanking('tas-tsg-491',{...tsg491Zero,gold:'1',interviews:'1'},true).total,null);
assert.equal(calculateRanking('tas-tsg-491',{...tsg491Zero,employment:'3'},true).total,95,'491 differs from190100');
const tsgZero=Object.fromEntries(rankingPrograms['tas-tsg'].fields.map(f=>[f.key,'0']));
const conflictHtml=nominationScoreCard(getRankingAssessment('tas-tsg',{...tsgZero,employment:'1',interviews:'1'},true),(en,zh)=>zh);
assert.ok(conflictHtml.includes('>—</strong>')&&conflictHtml.includes('选项冲突')&&!conflictHtml.includes('501'));
const ui=readFileSync(new URL('../public/nomination-ranking.mjs',import.meta.url),'utf8');
const controller=readFileSync(new URL('../public/points-calculator.mjs',import.meta.url),'utf8');
assert.ok(ui.includes("el('details',null,'pc-local-ranking')"),'Guidance uses a native optional disclosure');
assert.ok(ui.includes('for(const f of config?.fields||[])'),'Only numeric ranking factors generate form controls');
assert.ok(!ui.includes('checklistProgress')&&!ui.includes('已自核')&&!ui.includes('config.checks.map'),'No professional self-check dropdowns or progress counts');
assert.ok(!controller.includes('hasNominationPath'),'Nomination guidance cannot gate the scoring form');
assert.ok(controller.includes("programNotice.hidden=!notice"),'Program status clears when leaving the matching state or visa');
assert.ok(controller.includes('federalPanel.hidden=!chosen;')&&controller.includes('federalPanel.open=true;'),'EOI/VPT inputs are directly available');
console.log('PASS: 30 bilingual paths; eleven separate numeric ranking programs, subclass-safe selections and optional guidance.');
