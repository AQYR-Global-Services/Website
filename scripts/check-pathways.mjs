import assert from 'node:assert/strict';
import {nominationPathways} from '../public/nomination-pathways.mjs';
import {readFileSync} from 'node:fs';
import {rankingPrograms,calculateRanking,getRankingAssessment} from '../public/nomination-ranking.mjs';
import {nominationScoreCard,rankingMaximum} from '../public/points-calculator.mjs';
import {stateCodes,getNominationProgramNotice} from '../public/state-nomination.mjs';
const all={...nominationPathways,...rankingPrograms};
assert.equal(rankingMaximum('act-resident'),195);
assert.equal(rankingMaximum('act-overseas'),185);
for(const id of ['tas-tse','tas-tsg','tas-ter','unknown','__proto__'])assert.equal(rankingMaximum(id),null);
for(const state of stateCodes)for(const visa of ['189','190','491']){
  const notice=getNominationProgramNotice(state,visa);
  assert.equal(!!notice,state==='sa'&&visa!=='189','SA program status appears only for its190/491 scenarios');
  if(notice){
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
assert.equal(Object.keys(all).length,23);
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
assert.equal(Object.values(all).filter(p=>p.state==='tas').length,4);
assert.ok(!Object.keys(all).some(key=>key==='nt-offshore'||key.includes('491')));
for(const [program,config] of Object.entries(all)){
  const zero=Object.fromEntries((config.fields||[]).map(f=>[f.key,'0']));
  const assessment=getRankingAssessment(program,zero,true);
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
      assert.ok(pending.includes(String(config.fields.length+1)));
      if(maximum!=null)assert.ok(pending.includes(translate('/ '+maximum+' points','/ '+maximum+' 分')),'Maximum remains visible before answers are complete');
    }
  }
}
assert.equal(getRankingAssessment('__proto__',{},true),null);
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
console.log('PASS: 23 bilingual nomination paths across eight states; optional read-only guidance, direct scoring and five independent numeric ranking paths.');
