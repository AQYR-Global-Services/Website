import {calculate, ruleDate, usesVpt} from './points-rules.mjs?v=20261023-vic491';
import {englishTests, needsEnglishDate, passportCountries, englishRuleDate} from './english-rules.mjs?v=20261022-all-tests';
import {getOccupation} from './occupation-search.mjs';
import {rankingPrograms,calculateRanking,rankingEnglishSelection} from './nomination-ranking.mjs?v=20261023-enquiry';
import {nominationPathways} from './nomination-pathways.mjs?v=20261023-guidance';
import {states} from './state-nomination.mjs?v=20261022-491';

// A separate opt-in snapshot: never add nomination ranking to EOI or invent a ROI total.
export function createNominationSnapshot(input) {
  if(!input||typeof input!=='object'||!Object.hasOwn(states,input.state)||!['190','491'].includes(input.visa))return null;
  const programs={...nominationPathways,...rankingPrograms};
  const program=input.program||'';
  const config=Object.hasOwn(programs,program)?programs[program]:null;
  if(program&&(!config||config.state!==input.state||input.visa!=='190'))return null;
  if(typeof input.confirmed!=='boolean')return null;
  const context={};
  for(const key of ['age','englishMode','english','passportCountry','listening','reading','writing','speaking','testDate','testEvidence']){
    const value=input.context?.[key]??'';
    if(typeof value!=='string'||value.length>32||!/^[a-z0-9.+-]*$/i.test(value))return null;
    context[key]=value;
  }
  if(!['','level','passport',...Object.keys(englishTests)].includes(context.englishMode))return null;
  if(context.passportCountry&&!Object.hasOwn(passportCountries,context.passportCountry))return null;
  if(!['','below','competent','proficient','superior'].includes(context.english))return null;
  const answers={};
  for(const f of config?.fields||[]){
    const value=f.key==='english'?rankingEnglishSelection(program,context):input.answers?.[f.key]??'';
    if(value!==''&&(!/^\d+$/.test(String(value))||!f.options[Number(value)]))return null;
    answers[f.key]=String(value);
  }
  return {version:1,state:input.state,visa:input.visa,program,context,answers,confirmed:input.confirmed};
}

export function parseNominationSnapshot(raw) {
  try{
    if(typeof raw!=='string'||raw.length>6144)return null;
    const input=JSON.parse(raw);
    return input?.version===1?createNominationSnapshot(input):null;
  }catch{return null;}
}

export function formatNominationEnquiry(snapshot,lang='en') {
  const t=(en,zh)=>lang==='zh'?zh:en;
  const programs={...nominationPathways,...rankingPrograms};
  const config=programs[snapshot.program];
  const result=config?.fields?calculateRanking(snapshot.program,snapshot.answers,snapshot.confirmed):null;
  const rows=[t('State nomination / ROI consultation (self-assessed, subject to review)','州提名／ROI 咨询（客户自评，待团队核对）'),
    snapshot.state.toUpperCase()+' · '+snapshot.visa+' · '+(config?t(config.en,config.zh):t('Pathway not selected — advice requested','尚未选择提名路径，希望团队评估')),
    t('Age supplied','已填写年龄')+': '+(snapshot.context.age||t('Not supplied','未填写'))];
  const exam=englishTests[snapshot.context.englishMode];
  rows.push(t('English evidence','英语信息')+': '+(exam?exam.name+' L/R/W/S '+['listening','reading','writing','speaking'].map(k=>snapshot.context[k]||t('missing','未填')).join('/')+(snapshot.context.testDate?' · '+snapshot.context.testDate:''):snapshot.context.englishMode==='level'?(snapshot.context.english||t('Not supplied','未填写')):snapshot.context.englishMode==='passport'?t('Passport exemption','护照豁免')+' · '+(passportCountries[snapshot.context.passportCountry]||t('Country not supplied','国家未填写')):t('Not supplied','未填写')));
  if(result){
    rows.push(t('Independent state ranking — do not add to EOI','独立州排序分，不与 EOI 相加'));
    for(const f of config.fields){
      const raw=snapshot.answers[f.key];const selected=raw===''?null:f.options[Number(raw)];
      rows.push(t(f.en,f.zh)+': '+(selected?t(selected.en,selected.zh)+' — '+selected.points+t(' points',' 分'):t('Not answered','未填写')));
    }
    if(result.conflicts?.length)rows.push(t('Conflicting claims: related employment and interview-only evidence. No total calculated.','存在冲突：同时申报相关在职工作与仅面试证据，不计算总分。'));
    else if(result.total==null)rows.push(t('Incomplete assessment — no total calculated. Missing: ','自评未完成，不计算总分。待完成：')+[...(result.missing||[]).map(k=>{const f=config.fields.find(f=>f.key===k);return t(f.en,f.zh);}),...(result.confirmationRequired?[t('Answer confirmation','填写确认')]:[])].join(t(', ','、')));
    else rows.push((snapshot.state==='act'?'Canberra Matrix':t('TAS ROI priority attributes','塔州 ROI 优先属性'))+': '+result.total+t(' points',' 分')+(snapshot.state==='tas'?' · '+result.tier:''));
  }else rows.push(t('No separate state ranking total calculated. The selected pathway and background are supplied for consultation only.','未计算独立州排序总分，仅附提名路径及背景供团队咨询评估。'));
  rows.push(t('Not an eligibility decision or invitation guarantee.','不代表资格结论或获邀保证。'));
  return rows.join('\n');
}

const common = ['state','visa','age','englishMode'];
const vptFields = ['occupation','experience','vptEducation','vptPartner','earningEligible'];
const eoiFields = ['overseas','australian','education','partner','study','specialist','regional','professional','language'];
const checkboxes = new Set(['study','specialist','regional','professional','language','regionalConfirmed']);

// Carry only the completed pathway's scoring answers, never names or free-text searches.
export function createPointsSnapshot(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const vpt = usesVpt(input);
  const evidenceKeys = input.englishMode === 'level' ? ['english'] : input.englishMode === 'passport' ? ['passportCountry'] : ['listening','reading','writing','speaking', ...(needsEnglishDate(input.englishMode) ? ['testDate'] : [])];
  if ((input.englishMode === 'toefl' && input.testDate >= '2025-08-07') || (input.englishMode === 'cambridge' && input.testDate >= '2024-02-12' && input.testDate < '2025-08-07')) evidenceKeys.push('testEvidence');
  const keys = [...common, ...evidenceKeys, ...(vpt ? vptFields : eoiFields), ...(input.visa==='491'?['regionalConfirmed','regionalPostcode']:[])];
  if (vpt && input.vptPartner === 'yes') keys.push('partnerCode');
  if (vpt && input.earningEligible === 'yes') keys.push('salary');
  const answers = {};
  for (const key of keys) {
    const value = input[key];
    if (checkboxes.has(key)) {
      if (value != null && typeof value !== 'boolean') return null;
      answers[key] = !!value;
    } else {
      if (typeof value !== 'string' || value.length > 32 || !/^[a-z0-9.+-]*$/i.test(value)) return null;
      answers[key] = value;
    }
  }
  if (!vpt) {
    answers.regional = answers.regional && answers.study;
    answers.specialist = answers.specialist && ['master','phd'].includes(answers.education);
  }
  const result = calculate(answers);
  return result.total == null ? null : input.state==='vic'&&input.visa==='491'?{version:2,model:'vpt',answers}:{version:1,answers};
}

export function parsePointsSnapshot(raw, pathway, score) {
  try {
    if (typeof raw !== 'string' || raw.length > 4096) return null;
    const parsed = JSON.parse(raw);
    if (![1,2].includes(parsed.version)) return null;
    const vic491=parsed.answers?.state==='vic'&&parsed.answers?.visa==='491';
    if(vic491?(parsed.version!==2||parsed.model!=='vpt'):parsed.version!==1)return null;
    const snapshot = createPointsSnapshot(parsed.answers);
    if (!snapshot || snapshot.answers.state+'-'+snapshot.answers.visa !== pathway || calculate(snapshot.answers).total !== Number(score)) return null;
    return snapshot;
  } catch { return null; }
}

export function pointsEnquiryRows(snapshot, lang = 'en') {
  const input = snapshot.answers;
  const result = calculate(input);
  const zh = lang === 'zh';
  const t = (en, cn) => zh ? cn : en;
  const yesNo = value => value ? t('Yes','是') : t('No','否');
  const rows = [];
  const add = (key, en, cn, answer, points = result.breakdown[key], additive = true) => rows.push({key,label:t(en,cn),answer,points,additive});
  const qualification = {other:t('Other','其他'),diploma:t('Australian diploma / trade','澳洲文凭／技工'),assessed:t('Other recognised qualification','其他认可资格'),bachelor:t('Bachelor / Honours','本科／荣誉学士'),master:t('Masters','硕士'),phd:t('PhD','博士（PhD）')};
  const englishNames = {competent:'Competent',proficient:'Proficient',superior:'Superior'};
  let english = englishNames[result.english];
  if (input.englishMode === 'passport') english += ' · '+t('Passport exemption','护照豁免')+' · '+passportCountries[input.passportCountry];
  else if (englishTests[input.englishMode]) english += ' · '+englishTests[input.englishMode].name+' L/R/W/S '+[input.listening,input.reading,input.writing,input.speaking].join('/')+(input.testDate ? ' · '+input.testDate : '')+(input.testEvidence === 'yes' ? ' · '+t('Test conditions confirmed','已确认考试条件') : '');
  add('age',result.mode === 'vpt' ? 'Age at ROI' : 'Age at invitation',result.mode === 'vpt' ? 'ROI 年龄' : '获邀时年龄',input.age+t(' years',' 岁'));
  add('english','English','英语',english);
  if (result.mode === 'vpt') {
    const occupation = getOccupation(input.occupation);
    const experience = {0:t('0 years','0 年'),1:t('1 year','1 年'),2:t('2–3 years','2–3 年'),4:t('4–5 years','4–5 年'),6:t('6–7 years','6–7 年'),8:t('8 years or more (planning estimate)','8 年及以上（估算）'),9:t('8 years or more (planning estimate)','8 年及以上（估算）')};
    add('skill','Nominated occupation / skill level','提名职业／技能等级',occupation.code+' · '+occupation.title+' · '+t('level ','等级 ')+occupation.skill);
    add('experience','Nominated occupation experience','提名职业工作经验',experience[input.experience]);
    add('education','Highest qualification','最高学历',qualification[input.vptEducation]);
    const partner = getOccupation(input.partnerCode);
    add('partner','Skilled partner','技术配偶',input.vptPartner === 'yes' ? t('Conditions confirmed','已确认满足条件')+' · '+partner.code+' · '+partner.title : t('No claim / single / Australian partner','不申报／单身／澳洲配偶'));
    add('earnings','Eligible Victorian annual earnings','维州合资格年收入',input.earningEligible === 'yes' ? 'AUD '+Number(input.salary).toLocaleString('en-AU') : t('No eligible earnings claim','不申报合资格收入'));
  } else {
    const overseas = {0:t('Less than 3 years','不满 3 年'),3:t('3–<5 years','满 3 年、不满 5 年'),5:t('5–<8 years','满 5 年、不满 8 年'),8:t('8+ years','满 8 年')};
    const australian = {0:t('Less than 1 year','不满 1 年'),1:t('1–<3 years','满 1 年、不满 3 年'),3:t('3–<5 years','满 3 年、不满 5 年'),5:t('5–<8 years','满 5 年、不满 8 年'),8:t('8+ years','满 8 年')};
    add('overseas','Overseas skilled work (before combined cap)','海外技术工作（合计封顶前）',overseas[input.overseas],({0:0,3:5,5:10,8:15})[input.overseas],false);
    add('australian','Australian skilled work (before combined cap)','澳洲技术工作（合计封顶前）',australian[input.australian],({0:0,1:5,3:10,5:15,8:20})[input.australian],false);
    add('employment','Skilled work counted toward total','计入总分的技术工作',t('Overseas + Australian, capped at 20','海外与澳洲合计，上限 20 分'));
    add('education','Highest qualification','最高学历',qualification[input.education]);
    const partners = {single:t('Single / Australian citizen or PR partner','单身／澳洲公民或永久居民配偶'),skilled:t('Skilled partner conditions confirmed','已确认满足技术配偶条件'),english:t('English-only partner conditions confirmed','已确认满足配偶英语条件'),none:t('No partner claim','不申报配偶加分')};
    add('partner','Partner','配偶',partners[input.partner]);
    for (const [key,en,cn] of [['study','Australian study','澳洲学习'],['specialist','Specialist education','特定研究学历'],['regional','Regional study','偏远地区学习'],['professional','Professional Year','职业年'],['language','Community language','社区语言']]) add(key,en,cn,yesNo(input[key]));
    if (result.nomination) add('nomination','Conditional state nomination','有条件州提名',t('Only if state nomination is granted','仅在获得州提名后计入'),result.nomination);
  }
  if (input.visa==='491') add('regionalConfirmed','491 designated regional requirements','491 指定偏远地区要求',input.regionalPostcode+' · '+t('Postcode matches the regional reference and selected state; obligation acknowledged. Actual address and nomination eligibility still need checking.','邮编匹配地区清单及所选州，并知悉地区义务；实际地址及州提名资格仍需核验。'),0,false);
  return rows;
}

export function formatPointsEnquiry(snapshot, lang = 'en') {
  const zh = lang === 'zh';
  const result = calculate(snapshot.answers);
  const heading = zh ? '各项填写与得分（客户自评，待团队核对）' : 'Answers and points (self-assessed, subject to review)';
  const rows = pointsEnquiryRows(snapshot,lang).map(row=>row.label+': '+row.answer+' — '+row.points+(zh ? ' 分' : ' points'));
  return [heading,...rows,(zh ? '总分' : 'Total')+': '+result.total+(zh ? ' 分' : ' points'),(zh ? '基础计分版本' : 'Base scoring version')+': '+ruleDate,(zh ? '英语标准版本' : 'English rules version')+': '+englishRuleDate].join('\n');
}
