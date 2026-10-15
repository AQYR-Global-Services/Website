import {calculate, ruleDate} from './points-rules.mjs';
import {getOccupation} from './occupation-search.mjs';

const common = ['state','visa','age','englishMode'];
const vptFields = ['occupation','experience','vptEducation','vptPartner','earningEligible'];
const eoiFields = ['overseas','australian','education','partner','study','specialist','regional','professional','language'];
const checkboxes = new Set(['study','specialist','regional','professional','language']);

// Carry only the completed pathway's scoring answers, never names or free-text searches.
export function createPointsSnapshot(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const vpt = input.state === 'vic' && input.visa === '190';
  const keys = [...common, ...(input.englishMode === 'level' ? ['english'] : ['listening','reading','writing','speaking', ...(input.englishMode === 'pte' ? ['testDate'] : [])]), ...(vpt ? vptFields : eoiFields)];
  if (vpt && input.vptPartner === 'yes') keys.push('partnerCode');
  if (vpt && input.earningEligible === 'yes') keys.push('salary');
  const answers = {};
  for (const key of keys) {
    const value = input[key];
    if (checkboxes.has(key)) {
      if (value != null && typeof value !== 'boolean') return null;
      answers[key] = !!value;
    } else {
      if (typeof value !== 'string' || value.length > 32 || !/^[a-z0-9.-]*$/i.test(value)) return null;
      answers[key] = value;
    }
  }
  if (!vpt) {
    answers.regional = answers.regional && answers.study;
    answers.specialist = answers.specialist && ['master','phd'].includes(answers.education);
  }
  const result = calculate(answers);
  return result.total == null ? null : {version:1, answers};
}

export function parsePointsSnapshot(raw, pathway, score) {
  try {
    if (typeof raw !== 'string' || raw.length > 4096) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return null;
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
  if (input.englishMode !== 'level') english += ' · '+(input.englishMode === 'pte' ? 'PTE Academic' : 'IELTS')+' L/R/W/S '+[input.listening,input.reading,input.writing,input.speaking].join('/')+(input.testDate ? ' · '+input.testDate : '');
  add('age',result.mode === 'vpt' ? 'Age at ROI' : 'Age at invitation',result.mode === 'vpt' ? 'ROI 年龄' : '获邀时年龄',input.age+t(' years',' 岁'));
  add('english','English','英语',english);
  if (result.mode === 'vpt') {
    const occupation = getOccupation(input.occupation);
    const experience = {0:t('0 years','0 年'),1:t('1 year','1 年'),2:t('2–3 years','2–3 年'),4:t('4–5 years','4–5 年'),6:t('6–7 years','6–7 年'),9:t('More than 8 years','超过 8 年')};
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
  return rows;
}

export function formatPointsEnquiry(snapshot, lang = 'en') {
  const zh = lang === 'zh';
  const result = calculate(snapshot.answers);
  const heading = zh ? '各项填写与得分（客户自评，待团队核对）' : 'Answers and points (self-assessed, subject to review)';
  const rows = pointsEnquiryRows(snapshot,lang).map(row=>row.label+': '+row.answer+' — '+row.points+(zh ? ' 分' : ' points'));
  return [heading,...rows,(zh ? '总分' : 'Total')+': '+result.total+(zh ? ' 分' : ' points'),(zh ? '规则版本' : 'Rule version')+': '+ruleDate].join('\n');
}
