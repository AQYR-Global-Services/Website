// Separate nomination self-assessment, never added to federal EOI or VPT.
// Sources are the linked ACT calculators and separate Tasmania 190/491 tables.
import {nominationPathways} from './nomination-pathways.mjs?v=20261026-491';
import {create491RankingPrograms} from './nomination-491.mjs?v=20261026-491';
import {lookupRegionalPostcode,regionalPostcodeCanProceed} from './regional-postcodes.mjs';
import {states} from './state-nomination.mjs?v=20261022-all-states';
import {englishLevel} from './english-rules.mjs?v=20261022-all-tests';
const option = (points,en,zh,tier='') => ({points,en,zh,tier});
const relatedJobOption = (...args) => ({...option(...args),currentRelatedJob:true});
const zero = option(0,'No verified claim / not applicable','不申报／不适用');
const field = (key,en,zh,options) => ({key,en,zh,options:[zero,...options]});
const yes = (points,en,zh,tier='') => [option(points,en,zh,tier)];
const binary = (key,en,zh,points,tier='') => field(key,en,zh,yes(points,'Yes — all stated conditions met','是，已满足所述全部条件',tier));
const qualification = overseas => field('qualification','Recognised qualification recorded in the EOI','EOI 中记录的认可学历',[
  option(20,'PhD','博士'),option(15,'Masters','硕士'),option(10,'Bachelor or trade certificate','本科或技工证书'),option(5,overseas?'Diploma: at least 2 full-time years':'Diploma: at least 18 full-time months',overseas?'Diploma：至少 2 年全日制':'Diploma：至少 18 个月全日制'),
]);
const actEnglish = field('english','Verified English level','已核实的英语等级',[option(15,'Superior','Superior'),option(10,'Proficient','Proficient'),option(0,'Competent','Competent')]);
const actPartnerEnglish = binary('partnerEnglish','Partner has Proficient or Superior English','配偶达到 Proficient 或 Superior 英语',5);
const actOccupation = binary('occupation','Assessed occupation is on the current ACT nomination occupation list','评估职业在当前 ACT 提名职业清单内',20);
const actStudy = field('study','Completed ACT on-site tertiary study / PY in the last 8 years','近 8 年在 ACT 居住期间完成的线下高等教育／职业年',[
  option(20,'4+ years','4 年及以上'),option(15,'3 years','3 年'),option(10,'2 years','2 年'),option(5,'1 year / eligible PY','1 年／合资格职业年'),
]);
const actBase = 'https://www.act.gov.au/migration/skilled-migrants/canberra-matrix/check-your-canberra-matrix-score-';
const tasBase = 'https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/';
const tasSalary = tse => field('salary','Current base pay received for at least 12 weeks (no loading / overtime)','当前基本工资，已持续至少 12 周（不含加载／加班等）',[
  option(tse?40:45,'$106,600/year or $53.95/hour or more','$106,600／年或 $53.95／小时及以上','orange-plus'),
  option(tse?15:25,'$79,423–<$106,600/year ($40.19–<$53.95/hour)','$79,423–不足 $106,600／年（$40.19–不足 $53.95／小时）','orange'),
  option(tse?10:20,'$71,480–<$79,423/year ($36.17–<$40.19/hour)','$71,480–不足 $79,423／年（$36.17–不足 $40.19／小时）','orange'),
]);
const spouseStudy = binary('spouseStudy','Spouse completed AQF 6+ study in Tasmania with a Tasmanian provider','配偶通过塔州教育机构在塔州完成 AQF 6 或以上学历',1,'orange');
const tasEnglish = binary('english','Proficient / Superior English or qualifying passport exemption','Proficient／Superior 英语或符合条件的护照豁免',1,'orange');
const tasOnly = binary('tasOnly','Never lived, worked or studied elsewhere in Australia','未在澳洲其他州或领地居住、工作或学习',15,'orange');
const tasResidence = field('residence','Continuous Tasmania residence','连续居住塔州时间',[
  option(4,'5+ years','5 年及以上','orange'),option(3,'4–<5 years','满 4 年、不满 5 年','orange'),option(2,'3–<4 years','满 3 年、不满 4 年','orange'),
]);
const priorityIncome = ['Priority-pay claims require at least $57,000/year or $28.85/hour excluding overtime, penalties and casual loading. Normally one current job supports employment claims; only the official hours / sequential-experience exceptions apply.','优先收入须达 $57,000／年或 $28.85／小时，不含加班、惩罚性工资和临时工加载。工作属性通常仅用一份当前工作申报；仅适用官方列出的工时及先后工作经验例外。'];
export const rankingPrograms = {
  'act-resident':{state:'act',en:'Canberra resident · Matrix',zh:'堪培拉居民 · Matrix',url:actBase+'canberra-residents',notes:[
    ['Employment-length claims need 20+ hours/week in the last 2 years. Skilled current-employment claims need 13 continuous weeks and the applicable pay, qualification and EOI evidence. Check leave, self-employment and commuter-region rules.','工作时长申报需为近 2 年每周至少 20 小时的工作；当前技能岗位申报需满足连续 13 周、相应薪资、学历和 EOI 证据要求。另需核对请假、自雇及通勤地区规则。'],
    ['Before claiming business points: at least 51% ownership, profitable ACT operation, at least $32,000 personal taxable income in the last 6 months, and a qualifying local employee for 13 weeks at 20+ hours/week. Excluded business types cannot claim.','企业加分前须核实：持股至少 51%、ACT 企业盈利、近 6 个月个人应税收入至少 $32,000，且有符合身份要求的本地雇员每周至少 20 小时、已工作 13 周；被排除的企业类型不得申报。'],
  ],fields:[
    field('residence','ACT residence in the last 8 years, subject to absence rules','近 8 年符合离境及居住限制的 ACT 居住年限',[option(25,'5+ years','5 年及以上'),option(20,'4–<5 years','满 4、不满 5 年'),option(15,'3–<4 years','满 3、不满 4 年'),option(10,'2–<3 years','满 2、不满 3 年'),option(5,'1–<2 years','满 1、不满 2 年')]),
    actEnglish,actPartnerEnglish,actOccupation,
    field('business','Eligible ACT small-business owner','符合全部条件的 ACT 小企业主',[option(20,'12+ months trading; turnover at least $200,000 over 12 months','经营满 12 个月；近 12 个月营业额至少 $200,000'),option(10,'6+ months trading; annual turnover at least $100,000 (official definition)','经营满 6 个月；年营业额至少 $100,000（按官方定义核对）')]),
    field('employment','Eligible ACT employment in last 2 years','近 2 年符合条件的 ACT 工作年限',[option(10,'12+ months','12 个月及以上'),option(5,'6–<12 months','满 6、不满 12 个月')]),
    field('skill','Current ACT job: all skill/pay/evidence conditions met','当前 ACT 工作：已满足技能、薪资及证据条件',[
      option(20,'Assessed nominated occupation on ACT list; EOI records job as related','工作与清单内提名评估职业相符，EOI 记载为相关工作'),option(15,'Primary 457/482 holder working for ACT sponsoring employer','457／482 主申请人为 ACT 担保雇主工作'),option(10,'Other ACT-listed occupation with relevant tertiary qualification','其他清单内职业，具有相关高等教育学历'),option(5,'ANZSCO 1–3 job with relevant tertiary qualification','ANZSCO 1–3 级岗位，具有相关高等教育学历'),
    ]),
    field('partnerWork','Partner ACT employment / employability: official conditions met','配偶 ACT 就业／就业能力：已满足官方条件',[
      option(15,'ACT-listed job + related assessment + qualifying pay','清单内岗位＋相关职业评估＋合资格薪资'),option(10,'Related assessment + qualifying ACT job/pay','相关评估＋合资格 ACT 工作及薪资'),option(5,'Any qualifying ACT job','其他合资格 ACT 工作'),option(5,'Australian trade certificate / Bachelor / Masters / PhD + Competent English, no employment claim','澳洲技工证书／本科／硕士／博士＋Competent 英语，不申报工作项'),
    ]),qualification(false),actStudy,
    field('family','AU citizen/PR family living in ACT for 2+ years','澳洲公民／PR 亲属，已居住 ACT 至少 2 年',[option(20,'Partner or child','配偶或子女'),option(10,'Parent, grandparent, sibling, aunt or uncle','父母、祖父母、兄弟姐妹、姨姑叔舅')]),
    binary('assets','At least $250,000 personal cash invested in ACT residential/commercial property (not land only)','至少 $250,000 个人现金投资 ACT 住宅／商业物业（仅土地不计）',5),
  ]},
  'act-overseas':{state:'act',en:'Overseas applicant · Matrix',zh:'境外申请人 · Matrix',url:actBase+'overseas-applicants',notes:[
    ['Check the separate overseas 190 eligibility criteria. Work claims need assessment points advice and EOI evidence. A qualifying job offer is full-time in the nominated occupation for at least 6 months and must meet the employer, advertising and location conditions.','须核对境外 190 独立资格条件。工作年限需职业评估计分意见及 EOI 证据。工作邀约须为提名职业的全职岗位、至少 6 个月，并满足雇主、招聘广告及所在地条件。'],
    ['Partner employment requires at least 6 months full-time work in the last 12 months and Competent English. ACT study requires on-site attendance and residence during the claimed study period.','配偶工作需近 12 个月中至少 6 个月全职及 Competent 英语；ACT 学习加分需线下就读且在申报学习期间居住 ACT。'],
  ],fields:[
    field('residence','Previous ACT residence / visit in the last 8 years','近 8 年曾居住或到访 ACT',[option(20,'More than 5 years','超过 5 年'),option(15,'3–5 years','3–5 年'),option(10,'1–<3 years','满 1、不满 3 年'),option(5,'Visit of at least 7 consecutive nights','连续到访至少 7 晚')]),actOccupation,actEnglish,actPartnerEnglish,
    binary('offer','Genuine qualifying ACT job offer in nominated occupation','提名职业的真实合资格 ACT 工作邀约',20),
    field('experience','Assessed relevant work experience, recorded in EOI','已由职业评估支持并记入 EOI 的相关工作经验',[option(20,'8–10 years','8–10 年'),option(15,'5–<8 years','满 5、不满 8 年'),option(10,'3–<5 years','满 3、不满 5 年')]),
    field('partnerWork','Partner employment: official work/English conditions met','配偶就业：已满足官方工作及英语条件',[option(15,'ACT-listed job + related assessment','ACT 清单内岗位＋相关评估'),option(10,'ANZSCO 1–3 job + related assessment','ANZSCO 1–3 级岗位＋相关评估'),option(5,'ANZSCO 1–3 job + relevant tertiary qualification','ANZSCO 1–3 级岗位＋相关高等教育学历')]),qualification(true),actStudy,
    field('family','Close family living in ACT for 2+ years','已居住 ACT 至少 2 年的近亲属',[option(20,'Australian citizen or PR','澳洲公民或 PR'),option(5,'Temporary resident','临时居民')]),
    field('assets','Qualifying ACT property or majority-owned profitable business','合资格 ACT 物业或控股盈利企业',[option(10,'$250,000+ personal cash property investment (not land only)','$250,000 及以上个人现金物业投资（仅土地不计）'),option(10,'51%+ business ownership for 6+ months, $100,000+ turnover over 6 months','持股至少 51%、满 6 个月，近 6 个月营业额至少 $100,000')]),
  ]},
  'tas-tse':{state:'tas',en:'Skilled Employment · TSE 190',zh:'技术就业 · TSE 190',url:tasBase+'tasmanian-skilled-employment-pathways-tse',notes:[priorityIncome],fields:[
    binary('gold','Health/allied health or school-teaching assessment and matching TAS job; priority pay; 6 months with one job at 30+ hours each week','医疗／相关医疗或学校教师评估及相符塔州工作；达优先收入；已工作 6 个月且一份工作每周均至少 30 小时',1000,'gold'),
    field('employment','Job matching assessment at priority pay: select one duration','工作与职业评估相符且达优先收入：仅选一个时长档位',[
      option(500,'More than 24 months','超过 24 个月','green'),option(300,'18–24 months','18–24 个月','green'),option(40,'15–<18 months','15–不足 18 个月','orange-plus'),option(30,'12–<15 months','12–不足 15 个月','orange-plus'),option(25,'9–<12 months','9–不足 12 个月','orange'),
    ]),tasSalary(true),binary('industry','2+ years Australian work in assessment industry; currently at priority pay','在评估职业同行业有至少 2 年澳洲经验，当前达优先收入',15,'orange'),
    binary('spouseWork','Spouse working in TAS for last 6 months at priority pay','配偶近 6 个月在塔州工作且达优先收入',4,'orange'),binary('residence','More than 3 years continuous TAS residence','连续居住塔州超过 3 年',2,'orange'),tasEnglish,spouseStudy,
  ]},
  'tas-tsg':{state:'tas',en:'Skilled Graduate · TSG 190',zh:'技术毕业生 · TSG 190',url:tasBase+'tasmanian-skilled-graduate-pathways-tsg',notes:[priorityIncome],fields:[
    {...binary('gold','Health/allied health or school-teaching assessment; 3 months matching TAS work at priority pay','医疗／相关医疗或学校教师评估；已从事相符塔州工作 3 个月且达优先收入',1000,'gold'),currentRelatedJob:true},
    field('employment','One current-job attribute: verify match, duration and pay','仅选一个当前工作属性：核对匹配关系、时长和工资',[
      relatedJobOption(500,'Assessment-matched, priority pay, >18 months','评估相符、优先收入、超过 18 个月','green'),relatedJobOption(300,'Assessment-matched, priority pay, 9–18 months','评估相符、优先收入、9–18 个月','green'),
      relatedJobOption(100,'Study-related but not assessment-matched, priority pay, >18 months','与塔州课程相关但非评估职业、优先收入、超过 18 个月','orange-plus'),relatedJobOption(75,'Study-related not assessment-matched, priority pay, 12–18 months','与塔州课程相关但非评估职业、优先收入、12–18 个月','orange-plus'),relatedJobOption(50,'Study-related not assessment-matched, priority pay, 9–<12 months','与塔州课程相关但非评估职业、优先收入、9–不足 12 个月','orange-plus'),relatedJobOption(35,'Assessment/study-related, priority pay, 3–<9 months','评估／课程相关、优先收入、3–不足 9 个月','orange-plus'),
      option(20,'Unrelated to both assessment and study, priority pay, >18 months','与评估及课程均无关、优先收入、超过 18 个月','orange'),option(9,'Unrelated to both, priority pay, 9–18 months','与两者均无关、优先收入、9–18 个月','orange'),option(7,'Unrelated to both, priority pay, 3–<9 months','与两者均无关、优先收入、3–不足 9 个月','orange'),
      relatedJobOption(7,'Assessment/study-related Cert III+, above minimum wage but below priority pay, >12 months','评估／Cert III 及以上课程相关、高于最低工资但低于优先收入、超过 12 个月','orange'),relatedJobOption(4,'Same related low-pay category, >6–<12 months','同上相关低收入工作、超过 6 且不足 12 个月','orange'),
    ]),
    binary('phdDuration','Completed 2 years of TAS PhD, or 1 year following TAS undergraduate completion','塔州博士完成 2 年，或塔州本科毕业后博士完成 1 年',250,'green'),binary('phdCommenced','Commenced PhD after completing TAS undergraduate/postgraduate study','完成塔州本科／研究生课程后已开始博士学习',8,'orange'),
    binary('industryJob','Assessment / Cert III+ study industry, at least minimum wage, 3–6 months','评估／Cert III 及以上课程同行业、至少最低工资、3–6 个月',3,'orange'),
    tasSalary(false),binary('graduateOffer','Qualifying graduate program offer in last 12 months: full-time, assessment-related, offered before/within 12 months of graduation; TAS business 20+ staff and >5 years trading','近 12 个月获合资格全职毕业生项目邀约：评估相关、毕业前或毕业后 12 个月内提供；塔州企业至少 20 人且经营超过 5 年',35,'orange-plus'),
    tasOnly,binary('placement','400+ hours in-course TAS health/allied health/teaching placement','塔州课程内医疗／相关医疗／教学实习至少 400 小时',10,'orange'),tasResidence,binary('studyHealth','TAS study directly related to health/allied health/teaching','塔州课程直接关联医疗／相关医疗／教学职业',3,'orange'),binary('spouseWork','Spouse working in TAS for last 6 months at priority pay','配偶近 6 个月在塔州工作且达优先收入',3,'orange'),binary('interviews','No current related job; evidence of related job interviews with 2 TAS businesses trading 3+ years','当前无相关工作；有两家经营至少 3 年的塔州企业相关岗位面试证据',1,'orange'),spouseStudy,tasEnglish,
  ]},
  'tas-ter':{state:'tas',en:'Established Resident · TER 190',zh:'长期居民 · TER 190',url:tasBase+'tasmanian-established-resident-pathways-ter',notes:[priorityIncome],fields:[
    binary('gold','Health/allied health or school-teaching assessment; 3 months matching TAS work at priority pay','医疗／相关医疗或学校教师评估；相符塔州工作满 3 个月且达优先收入',1000,'gold'),
    field('employment','One current-job attribute: verify relationship, pay and duration','仅选一个当前工作属性：核对相关性、工资和时长',[
      option(500,'Assessment-matched, priority pay, >18 months','评估相符、优先收入、超过 18 个月','green'),option(300,'Assessment-matched, priority pay, >9–18 months','评估相符、优先收入、超过 9 至 18 个月','green'),option(25,'Assessment-matched, priority pay, 3–<9 months','评估相符、优先收入、3–不足 9 个月','orange'),
      option(20,'Unrelated to assessment and study, priority pay, >18 months','与评估及课程均无关、优先收入、超过 18 个月','orange'),option(15,'Unrelated to both, priority pay, 9–18 months','与两者均无关、优先收入、9–18 个月','orange'),option(8,'Unrelated to both, priority pay, 3–<9 months','与两者均无关、优先收入、3–不足 9 个月','orange'),
      option(7,'Assessment/study-related Cert III+, above minimum wage but below priority pay, >12 months','评估／Cert III 及以上课程相关、高于最低工资但低于优先收入、超过 12 个月','orange'),option(5,'Same related low-pay category, 6–12 months','同上相关低收入工作、6–12 个月','orange'),
    ]),tasSalary(false),
    field('businessIncome','Profitable TAS business personal income (select one)','盈利塔州企业的个人收入（仅选一个）',[option(45,'At least $106,600 for >12 months','至少 $106,600、超过 12 个月','orange-plus'),option(25,'More than $79,423/year for last 2 years','近 2 年每年超过 $79,423','orange')]),
    binary('businessAssessment','Skills assessment directly related to business operations','职业评估与企业经营直接相关',35,'orange-plus'),binary('businessTurnover','Business turnover >$500,000 in last financial year','上一财年营业额超过 $500,000',30,'orange-plus'),binary('businessStaff','Business employs >10 local AU citizens, PRs or provisional visa holders','企业雇用超过 10 名本地澳洲公民、PR 或临居签证持有人',30,'orange-plus'),
    binary('industry','2+ years Australian work in assessment industry; currently at priority pay','评估职业同行业至少 2 年澳洲经验，当前达优先收入',23,'orange'),tasOnly,tasResidence,binary('spouseWork','Spouse working in TAS for last 6 months at priority pay','配偶近 6 个月在塔州工作且达优先收入',4,'orange'),binary('studyHealth','AQF 5+ TAS qualification directly related to health/allied health/education','AQF 5 及以上塔州学历直接关联医疗／相关医疗／教育职业',3,'orange'),binary('businessYears','Business operated in TAS for at least the last 3 years','企业在塔州已连续经营至少 3 年',3,'orange'),binary('industryJob','Currently employed in assessment / Cert III+ TAS-study industry at least at minimum wage','当前在评估／Cert III 及以上塔州课程同行业工作且至少达最低工资',2,'orange'),spouseStudy,tasEnglish,
  ]},
};
Object.assign(rankingPrograms,create491RankingPrograms(rankingPrograms));
export function nominationProgramSupports(program,state,visa){
  const programs={...nominationPathways,...rankingPrograms};
  const config=Object.hasOwn(programs,program||'')?programs[program]:null;
  return !!config&&config.state===state&&(config.visa||'190')===visa;
}
export function rankingConflicts(program,answers={}) {
  if(!['tas-tsg','tas-tsg-491'].includes(program)||!/^\d+$/.test(String(answers.interviews))||Number(answers.interviews)!==1)return [];
  const related=rankingPrograms[program].fields.filter(f=>{
    const raw=answers[f.key];
    const selected=/^\d+$/.test(String(raw))?f.options[Number(raw)]:null;
    return selected?.points>0&&(f.currentRelatedJob||selected.currentRelatedJob);
  });
  return related.length?[{code:'interviews-current-related-job',fields:['interviews',...related.map(f=>f.key)]}]:[];
}
export function calculateRanking(program,answers={},confirmed=false) {
  const config = Object.hasOwn(rankingPrograms,program || '') ? rankingPrograms[program] : null;
  if (!config) return {total:null,tier:null};
  const conflicts=rankingConflicts(program,answers);
  const missing=[],invalid=[];
  let total=0,tier='none';
  const tiers=['none','orange','orange-plus','green','gold'];
  for (const f of config.fields) {
    const raw=answers[f.key];
    if (raw === '' || raw == null) {missing.push(f.key);continue;}
    if (!/^\d+$/.test(String(raw))) {invalid.push(f.key);continue;}
    const opt=f.options[Number(raw)];
    if (!opt) {invalid.push(f.key);continue;}
    total+=opt.points;
    if (tiers.indexOf(opt.tier)>tiers.indexOf(tier)) tier=opt.tier;
  }
  if(missing.length||invalid.length||!confirmed||conflicts.length)return {
    total:null,tier:null,missing,invalid,confirmationRequired:!confirmed,...(conflicts.length?{conflicts}:{}),
  };
  return {total,tier};
}

export function getRankingAssessment(program,answers,confirmed,context={}) {
  const config=Object.hasOwn(rankingPrograms,program||'')?rankingPrograms[program]:null;
  if(!config)return null;
  let score=calculateRanking(program,answers,confirmed);
  if(config.visa==='491'&&(!regionalPostcodeCanProceed(lookupRegionalPostcode(context.regionalPostcode,config.state))||context.regionalConfirmed!==true))score={...score,total:null,tier:null,regionalRequired:true};
  return {program,state:config.state,visa:config.visa||'190',system:config.state==='act'?'matrix':'tas',path:[config.en,config.zh],score};
}

export function rankingEnglishSelection(program,input={}) {
  const level=englishLevel(input);
  if(!level||level==='below')return '';
  if(rankingPrograms[program]?.state==='act')return {superior:'1',proficient:'2',competent:'3'}[level];
  if(rankingPrograms[program]?.state==='tas')return ['proficient','superior'].includes(level)||input.englishMode==='passport'?'1':'0';
  return '';
}

export function initialiseRankingTool(host) {
  const root=host.querySelector('#pc-local-ranking');
  const text=(en,zh)=>document.documentElement.dataset.lang==='zh'?zh:en;
  const el=(tag,content,className)=>{const n=document.createElement(tag);if(content)n.textContent=content;if(className)n.className=className;return n;};
  const programs={...nominationPathways,...rankingPrograms};
  const details=el('details',null,'pc-local-ranking');
  const toggle=el('summary');details.append(toggle);
  // Guidance is optional; only genuine numeric ranking factors become controls.
  const stateSource=host.querySelector('#pc-state-link');
  details.append(stateSource);
  const badge=el('p',null,'label');details.append(badge);
  const summary=el('h3');details.append(summary);
  const intro=el('p',null,'pc-hint');details.append(intro);
  const label=el('label');label.htmlFor='pc-ranking-path';details.append(label);
  const path=document.createElement('select');path.id='pc-ranking-path';details.append(path);
  const empty=el('option');empty.value='';path.append(empty);
  for(const [key,config] of Object.entries(programs)){const opt=el('option');opt.value=key;path.append(opt);}
  const source=el('a');source.target='_blank';source.rel='noopener noreferrer';details.append(source);
  const notes=el('div');details.append(notes);
  const requirements=el('ul',null,'pc-nomination-requirements');details.append(requirements);
  const fields=el('div',null,'pc-grid');details.append(fields);
  const confirmLabel=el('label',null,'pc-check');
  const confirm=el('input');confirm.type='checkbox';confirm.id='pc-ranking-confirm';const confirmText=el('span');confirmLabel.append(confirm,confirmText);details.append(confirmLabel);
  const conflict=el('p',null,'pc-ranking-conflict');conflict.id='pc-ranking-conflict';conflict.hidden=true;conflict.setAttribute('role','alert');details.append(conflict);
  const pending=el('div',null,'pc-ranking-pending');pending.id='pc-ranking-pending';pending.hidden=true;
  const pendingTitle=el('p');pendingTitle.id='pc-ranking-pending-title';pendingTitle.setAttribute('role','status');
  const pendingHint=el('p',null,'pc-hint');pendingHint.id='pc-ranking-pending-hint';
  const pendingList=el('ul');pending.append(pendingTitle,pendingHint,pendingList);details.append(pending);
  const result=el('p',null,'pc-inline-result');result.setAttribute('role','status');details.append(result);
  const reset=el('button',null,'pc-reset');reset.type='button';details.append(reset);
  root.append(details);
  const reminder=el('p',null,'pc-hint pc-nomination-reminder');root.append(reminder);
  let currentState='',currentProgram='',currentVisa='',currentEnglishInput={};
  const controls=new Map();
  function update(state,visa,englishInput=currentEnglishInput){
    currentEnglishInput=englishInput;
    if(currentState!==state||currentVisa!==visa){
      currentState=state;currentVisa=visa;currentProgram='';path.value='';fields.replaceChildren();controls.clear();confirm.checked=false;
      details.open=state==='act'||state==='tas';
    }
    root.hidden=!Object.entries(programs).some(([key])=>nominationProgramSupports(key,state,visa));
    if(root.hidden)return;
    const hasRanking=state==='act'||state==='tas';
    toggle.textContent=hasRanking?text('State ranking calculator · optional','州提名排序计算（可选）'):text('State nomination conditions · optional reading','州提名条件说明（选读）');
    reminder.textContent=text('A points estimate does not establish state nomination eligibility. Occupation, study and employment conditions need an individual review.','分数估算不等于符合州提名资格，具体条件需结合职业、学习及工作情况进一步核对。');
    badge.textContent=text('STATE NOMINATION · '+state.toUpperCase(),'州提名 · '+state.toUpperCase());
    summary.textContent=hasRanking?text(states[state].en+' ranking',''+states[state].zh+'提名排序'):text(states[state].en+' nomination guide',states[state].zh+'提名说明');
    intro.textContent=hasRanking?text('Choose a pathway to estimate its separate state ranking score. It is never added to federal EOI points.','选择路径可估算独立的州排序分，不与联邦 EOI 分数相加。'):text('You can calculate points without selecting a pathway here. Select one only if you want to read its nomination conditions.','无需在此选择路径即可计算分数。如需了解提名条件，可选择相应路径查看说明。');
    label.textContent=text('Pathway','提名路径');empty.textContent=text('Select to view','选择后查看');
    for(const opt of path.options){if(!opt.value)continue;const c=programs[opt.value];const available=nominationProgramSupports(opt.value,state,visa);opt.hidden=!available;opt.disabled=!available;opt.textContent=text(c.en,c.zh);}
    const config=Object.hasOwn(programs,path.value)?programs[path.value]:null;
    if(currentProgram!==path.value){
      currentProgram=path.value;fields.replaceChildren();controls.clear();confirm.checked=false;
      for(const f of config?.fields||[]){
        const wrap=el('div',null,'pc-field'),lab=el('label'),select=el('select');select.id='pc-rank-'+f.key;lab.htmlFor=select.id;
        const pending=el('option');pending.value='';select.append(pending);
        f.options.forEach((o,i)=>{const opt=el('option');opt.value=String(i);select.append(opt);});
        wrap.append(lab,select);
        if(f.key==='english'){
          const edit=el('button',null,'pc-reset');edit.type='button';edit.dataset.pcEditEnglish='';
          edit.addEventListener('click',()=>{const target=host.querySelector('#pc-englishMode');target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'instant'});});
          wrap.append(edit);
        }
        fields.append(wrap);controls.set(f.key,{lab,select});
      }
    }
    source.hidden=!config;confirmLabel.hidden=!config?.fields;notes.replaceChildren();requirements.replaceChildren();requirements.hidden=!config?.checks;
    if(config){
      source.href=config.url;source.textContent=text('Read the full official pathway rules','阅读该路径完整官方条件');
      const method=el('div',null,'pc-selection-method');
      method.append(el('h4',text('How this pathway is selected','此路径如何筛选')));
      method.append(el('p',config.order?text(...config.order):state==='act'?text('Canberra Matrix ranks separately from EOI, using the selected resident or overseas table. The self-assessment below does not establish eligibility.','Canberra Matrix 独立于 EOI 排序，居民与境外使用不同表格；下方自评不等于满足资格。'):text('Tasmania uses pathway-specific priority attributes and pass categories, not federal EOI rankings.','塔州按路径对应的优先属性及通行类别排序，不是联邦 EOI 排名。')));
      notes.append(method);
      if(config.eligibilityUrl){const eligibility=el('a',text('Read the separate 491 eligibility criteria','查阅 491 独立资格要求'));eligibility.href=config.eligibilityUrl;eligibility.target='_blank';eligibility.rel='noopener noreferrer';notes.append(eligibility);}
      for(const note of config.notes||[])notes.append(el('p',text(...note),'pc-hint'));
      for(const pair of config.checks||[])requirements.append(el('li',text(...pair)));
      for(const f of config.fields||[]){const c=controls.get(f.key);c.lab.textContent=text(f.en,f.zh);c.select.options[0].textContent=text('Please select','请选择');
        f.options.forEach((o,i)=>c.select.options[i+1].textContent=text(o.en,o.zh)+' · '+o.points);
      }
    }
    confirmText.textContent=text('My answers reflect my circumstances. Points claimed still need valid supporting evidence.','我已按实际情况填写，所申报加分仍需有效材料支持。');
    const localEnglish=controls.get('english');
    if(localEnglish){
      localEnglish.select.value=rankingEnglishSelection(path.value,currentEnglishInput);
      localEnglish.select.disabled=true;
      localEnglish.lab.textContent=text('English · calculated from your test scores above','英语 · 由上方考试成绩自动换算');
      localEnglish.select.options[0].textContent=text('Complete English scores above','请先填写上方英语成绩');
      details.querySelector('[data-pc-edit-english]').textContent=text('Edit test type / component scores','修改考试类型／单项成绩');
    }
    const answers=Object.fromEntries([...controls].map(([key,c])=>[key,c.select.value]));
    const score=getRankingAssessment(path.value,answers,confirm.checked,currentEnglishInput)?.score||calculateRanking(path.value,answers,confirm.checked);
    const incompleteFields=new Set([...(score.missing||[]),...(score.invalid||[])]);
    const invalidFields=new Set((score.conflicts||[]).flatMap(issue=>issue.fields));
    for(const [key,c] of controls){
      c.select.toggleAttribute('data-pc-incomplete',incompleteFields.has(key));
      if(invalidFields.has(key)){c.select.setAttribute('aria-invalid','true');c.select.setAttribute('aria-describedby',conflict.id);}
      else{
        if(score.invalid?.includes(key))c.select.setAttribute('aria-invalid','true');else c.select.removeAttribute('aria-invalid');
        if(incompleteFields.has(key))c.select.setAttribute('aria-describedby',pendingHint.id);else c.select.removeAttribute('aria-describedby');
      }
    }
    conflict.hidden=!score.conflicts?.length;
    conflict.textContent=conflict.hidden?'':text('Conflicting claims: interview evidence is only available when you are not currently employed in a role related to your skills assessment or Tasmanian study. You have also claimed current related employment. Change the highlighted selections before calculating.','选项冲突：面试证据仅适用于当前未从事与职业评估或塔州课程相关工作的人。您同时申报了相关在职工作，请修改标记的冲突选项后再计算。');
    const pendingCount=incompleteFields.size+(score.confirmationRequired?1:0)+(score.regionalRequired?1:0);
    pending.hidden=!config?.fields||!pendingCount;
    pendingTitle.textContent=text(pendingCount+' item(s) still need attention before a score can be shown:', '还有 '+pendingCount+' 项未完成，暂不能出分：');
    pendingHint.textContent=text('Choose an answer for each listed category. If it does not apply, select “No verified claim / not applicable” rather than leaving it blank. Select an item below to return to it.','请逐项选择；不适用的项目请选择“不申报／不适用”，不要留空。点击下列项目可跳回填写位置。');
    pendingList.replaceChildren();
    const addPending=(label,target)=>{
      const item=el('li'),button=el('button',label);button.type='button';button.dataset.pcTarget=target.id;
      button.addEventListener('click',()=>{target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
      item.append(button);pendingList.append(item);
    };
    for(const f of config?.fields||[])if(incompleteFields.has(f.key))addPending(text(f.en,f.zh)+(score.invalid?.includes(f.key)?text(' — choose a valid option','——请重新选择有效选项'):''),f.key==='english'?host.querySelector('#pc-englishMode'):controls.get(f.key).select);
    if(score.confirmationRequired)addPending(text('Confirm your answers reflect your circumstances','确认已按实际情况填写'),confirm);
    if(score.regionalRequired)addPending(text('Check the 491 postcode and acknowledge regional obligations','核对 491 邮编并确认偏远地区义务'),host.querySelector('#pc-regional-postcode'));
    if(score.confirmationRequired)confirm.setAttribute('aria-describedby',pendingTitle.id);else confirm.removeAttribute('aria-describedby');
    result.hidden=!config?.fields;
    result.textContent=score.conflicts?.length?text('Calculation stopped — resolve conflicting selections first.','发现选项冲突，已停止计算；解决冲突后再显示分数。'):score.total==null?text('Complete the items listed above. State ranking is separate from EOI and can be attached independently for consultation.','请完成上方列出的项目。州排序分不与 EOI 相加，咨询时可选择单独附上自评。'):
      (state==='act'?'Canberra Matrix':text('TAS ROI priority attributes','塔州 ROI 优先属性'))+': '+score.total+text(' points',' 分')+(state==='tas'?' · '+({none:text('No priority claim','未申报优先属性'),orange:'Orange','orange-plus':'Orange Plus',green:'Green',gold:'Gold'}[score.tier]):'')+text(' · Self-assessed, not an invitation or eligibility decision.',' · 仅为自评，不代表获邀或资格决定。');
    reset.textContent=text('Reset nomination assessment','重置州提名自评');
    reset.hidden=!config?.fields;
  }
  details.addEventListener('change',()=>update(currentState,currentVisa));
  reset.addEventListener('click',()=>{path.value='';currentProgram='';fields.replaceChildren();controls.clear();confirm.checked=false;update(currentState,currentVisa);path.dispatchEvent(new Event('change',{bubbles:true}));});
  return {update,selected(){return path.value;},
    values(){return {program:nominationProgramSupports(path.value,currentState,currentVisa)?path.value:'',answers:Object.fromEntries([...controls].map(([key,c])=>[key,c.select.value])),confirmed:confirm.checked};},
    assessment(){return nominationProgramSupports(path.value,currentState,currentVisa)?getRankingAssessment(path.value,Object.fromEntries([...controls].map(([key,c])=>[key,c.select.value])),confirm.checked,currentEnglishInput):null;},
    review(){
      details.open=true;
      const assessment=this.assessment();
      const key=assessment?.score.conflicts?.[0]?.fields[0]||assessment?.score.missing?.[0]||assessment?.score.invalid?.[0];
      const target=assessment?.score.regionalRequired?host.querySelector('#pc-regional-postcode'):key==='english'?host.querySelector('#pc-englishMode'):key?controls.get(key)?.select:assessment?.score.confirmationRequired?confirm:path;
      target?.focus({preventScroll:true});target?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    },
    reset(){currentState='';currentProgram='';currentVisa='';path.value='';fields.replaceChildren();controls.clear();confirm.checked=false;}};
}
