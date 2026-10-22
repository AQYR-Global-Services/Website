import assert from 'node:assert/strict';
import {nominationPathways,checklistProgress} from '../public/nomination-pathways.mjs';
import {rankingPrograms,calculateRanking,getRankingAssessment} from '../public/nomination-ranking.mjs';
import {nominationScoreCard} from '../public/points-calculator.mjs';
import {stateCodes} from '../public/state-nomination.mjs';
const all={...nominationPathways,...rankingPrograms};
assert.equal(Object.keys(all).length,23);
for(const state of stateCodes)assert.ok(Object.values(all).some(p=>p.state===state),state);
for(const [id,path] of Object.entries(nominationPathways)){
  assert.ok(path.en&&path.zh&&path.order.length===2&&path.url.startsWith('https://'),id);
  assert.ok(path.checks.length>=3,id);
  for(const pair of path.checks)assert.ok(pair[0]&&pair[1],id);
  assert.deepEqual(checklistProgress(path.checks,{}),{verified:0,unresolved:0,pending:path.checks.length});
  assert.deepEqual(checklistProgress(path.checks,{0:'yes',1:'no',2:'unsure'}),{verified:1,unresolved:1,pending:path.checks.length-2});
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
      const pending=nominationScoreCard(getRankingAssessment(program,{},false),translate);
      assert.ok(pending.includes('>—</strong>'));
      assert.ok(pending.includes(String(config.fields.length+1)));
    }
  }
}
assert.equal(getRankingAssessment('__proto__',{},true),null);
const tsgZero=Object.fromEntries(rankingPrograms['tas-tsg'].fields.map(f=>[f.key,'0']));
const conflictHtml=nominationScoreCard(getRankingAssessment('tas-tsg',{...tsgZero,employment:'1',interviews:'1'},true),(en,zh)=>zh);
assert.ok(conflictHtml.includes('>—</strong>')&&conflictHtml.includes('选项冲突')&&!conflictHtml.includes('501'));
console.log('PASS: 23 bilingual nomination paths across eight states, distinct checklists, no invented scores or offshore NT190 route.');
