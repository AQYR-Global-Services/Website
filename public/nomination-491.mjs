// Official ACT Matrix and Tasmania subclass 491 priority tables, checked 26 October 2026.
// Separate program identifiers keep saved 190 answers from being reinterpreted as 491.
const option=(points,en,zh,tier='')=>({points,en,zh,tier});
const field=(key,en,zh,options)=>({key,en,zh,options:[option(0,'No verified claim / not applicable','不申报／不适用'),...options]});
const binary=(key,en,zh,points,tier='orange')=>field(key,en,zh,[option(points,'Yes — all stated conditions met','是，已满足所述全部条件',tier)]);
const remap=(config,key,points)=>{
  const original=config.fields.find(f=>f.key===key);
  if(!original||original.options.length!==points.length)throw new Error('Invalid 491 table: '+key);
  return {...original,options:original.options.map((o,i)=>({...o,points:points[i]}))};
};
const pick=(config,key)=>config.fields.find(f=>f.key===key);
const relabel=(f,index,en,zh)=>({...f,options:f.options.map((o,i)=>i===index?{...o,en,zh}:o)});
const tasBase='https://www.migration.tas.gov.au/skilled_migration/skilled-workers-and-graduates-living-in-Tasmania/';
export function create491RankingPrograms(base){
  const resident=base['act-resident'],overseas=base['act-overseas'],tse=base['tas-tse'],tsg=base['tas-tsg'],ter=base['tas-ter'];
  const actResident={...resident,visa:'491',en:'Canberra resident · Matrix 491',zh:'堪培拉居民 · Matrix 491',notes:[resident.notes[0],
    ['491 small-business claim: at least 51% ownership, profitable ACT business, at least $16,000 personal taxable income in the last 3 months, and a qualifying local employee for 13 weeks at 20+ hours/week. Check excluded business types.','491 小企业加分：持股至少 51%、ACT 企业盈利、近 3 个月个人应税收入至少 $16,000，并有符合身份要求的本地雇员每周至少 20 小时、已工作 13 周；须核对排除企业类型。'],
    ['491 eligibility is separate from Matrix points: normally 3 months Canberra residence and the applicable 13-week employment requirement (employees: 15+ hours/week in 13 of the last 15 weeks). Matrix employment-point categories have their own higher conditions. Check the nominated-occupation, doctorate or business pathway and family conditions.','491 资格与 Matrix 加分分别核对：一般需居住堪培拉 3 个月，并满足相应 13 周就业要求（雇员为近 15 周中至少 13 周每周 15 小时）。Matrix 工作加分项目另有更高条件；还须核对职业清单、博士或企业主路径及家属条件。'],
  ],eligibilityUrl:'https://www.act.gov.au/migration/skilled-migrants/491-nomination-criteria/491-nomination-canberra-resident-applicant-eligibility'};
  const actOverseas={...overseas,visa:'491',en:'Overseas applicant · Matrix 491',zh:'境外申请人 · Matrix 491',notes:[
    ['Overseas 491 normally requires at least one year of full-time post-qualification nominated-occupation experience in the last five years and Competent English, plus the applicable occupation/registration conditions. Matrix experience points start at three years; meeting minimum eligibility does not automatically award those points. Check the doctorate exception separately.','境外 491 一般需近 5 年至少 1 年毕业后提名职业全职经验、Competent 英语及相应职业／注册条件。Matrix 工作经验加分从 3 年起，满足最低资格不代表自动取得该项分数；博士例外另行核对。'],
    overseas.notes[1],
  ],eligibilityUrl:'https://www.act.gov.au/migration/skilled-migrants/491-nomination-criteria/491-nomination-overseas-applicant-eligibility'};
  const tse491={...tse,visa:'491',en:'Skilled Employment · TSE 491',zh:'技术就业 · TSE 491',notes:[...tse.notes,
    ['491 TSE: priority-pay employment normally needs 9 months at an average 20+ hours/week; below-priority pay needs 12 months and additional employer evidence. Check current residence, dependants, qualifications, employer history and the 12-month contract with 3 months remaining.','491 TSE：达到优先收入的工作一般需 9 个月、平均每周至少 20 小时；低于优先收入需 12 个月及额外雇主证明。须另核对当前居住、家属、资历、雇主经营年限及至少 12 个月且余下 3 个月的合同。'],
  ],fields:[pick(tse,'gold'),{...pick(tse,'employment'),options:[...pick(tse,'employment').options,option(15,'Not assessment-matched, priority pay, at least 18 months','非评估职业、优先收入、至少 18 个月','orange')]},pick(tse,'salary'),
    field('industry','2+ years prior Australian experience in the assessment industry; current pay','评估职业同行业至少 2 年既往澳洲经验；当前收入',[option(15,'At or above priority pay','达到优先收入','orange'),option(6,'Above minimum wage but below priority pay','高于最低工资但低于优先收入','orange')]),
    binary('industryJob','12 months current TAS work in the assessment industry at priority pay','当前在塔州评估职业同行业工作满 12 个月且达优先收入',6),
    binary('lowPayAssessment','Current job above minimum wage but below priority pay; related skills assessment','当前工作高于最低工资但低于优先收入，持相关职业评估',4),
    pick(tse,'spouseWork'),binary('lowPayQualification','Current job above minimum wage but below priority pay; related Cert III+ qualification (not online/RPL)','当前工作高于最低工资但低于优先收入，持相关 Cert III 及以上学历（非网课／RPL）',2),pick(tse,'residence'),pick(tse,'english'),pick(tse,'spouseStudy')
  ]};
  const tsg491={...tsg,visa:'491',en:'Skilled Graduate · TSG 491',zh:'技术毕业生 · TSG 491',notes:[...tsg.notes,
    ['491 TSG study normally requires an eligible on-site, full-time CRICOS course of at least 40 weeks, Diploma+ or a qualifying Cert III, and one calendar year of Tasmanian residence from course commencement. This differs from the 190 study requirement. Check the full course, dependants and residence rules.','491 TSG 学习一般要求合资格线下全日制 CRICOS 课程至少 40 周、Diploma 以上或符合规定的 Cert III，并自开课起在塔州居住至少一个自然年。此要求与 190 不同，须核对完整课程、家属及居住条件。'],
  ],fields:tsg.fields.map(f=>({
    employment:remap(tsg,'employment',[0,500,300,95,70,45,30,17,8,6,6,4]),
    salary:remap(tsg,'salary',[0,40,23,18]),graduateOffer:remap(tsg,'graduateOffer',[0,30]),
    industryJob:remap(tsg,'industryJob',[0,2]),placement:remap(tsg,'placement',[0,9]),studyHealth:remap(tsg,'studyHealth',[0,2]),spouseWork:remap(tsg,'spouseWork',[0,2]),
  }[f.key]||f))};
  const graduateEmployment=tsg491.fields.find(f=>f.key==='employment');
  tsg491.fields=tsg491.fields.map(f=>f!==graduateEmployment?f:relabel(relabel(relabel(f,2,'Assessment-matched, priority pay, more than 9 to 18 months','评估相符、优先收入、超过 9 至 18 个月'),4,'Study-related not assessment-matched, priority pay, more than 12 to 18 months','与塔州课程相关但非评估职业、优先收入、超过 12 至 18 个月'),6,'Assessment/study-related, priority pay, 3–9 months','评估／课程相关、优先收入、3–9 个月'));
  const ter491={...ter,visa:'491',en:'Established Resident · TER 491',zh:'长期居民 · TER 491',notes:[...ter.notes,
    ['491 TER requires at least 2 years Tasmanian residence with no more than half of Australian residence elsewhere. Employment is normally 6 months in the last year at priority pay, or 12 months in the last 18 months below priority pay, at 20+ hours/week. Remote work is not eligible for this 491 pathway; business attributes from TER190 do not apply.','491 TER 要求至少居住塔州 2 年，澳洲居住时间中在其他州的比例不超过一半。工作一般需优先收入档近 1 年中满 6 个月，或低收入档近 18 个月中满 12 个月，每周至少 20 小时。此 491 路径不接受远程工作，也不沿用 TER190 的企业加分项目。'],
  ],fields:[pick(ter,'gold'),remap(ter,'employment',[0,500,300,20,18,9,8,6,4]),remap(ter,'salary',[0,40,25,15]),remap(ter,'industry',[0,20]),pick(ter,'tasOnly'),pick(ter,'residence'),remap(ter,'spouseWork',[0,3]),pick(ter,'studyHealth'),pick(ter,'industryJob'),pick(ter,'spouseStudy'),pick(ter,'english')]};
  ter491.fields=ter491.fields.map(f=>f.key!=='employment'?f:relabel(f,2,'Assessment-matched, priority pay, 9–18 months','评估相符、优先收入、9–18 个月'));
  const tbo491={state:'tas',visa:'491',en:'Business Operator · TBO 491',zh:'企业经营 · TBO 491',url:tasBase+'tasmanian-business-operator-pathway-tbo',notes:[
    ['491 TBO has no Gold or Green attributes. Business must have operated for at least 12 months, be solely owned or co-owned with a spouse and remain profitable after the required personal income. Check current income threshold, ATO records, Fair Work learning, dependants and excluded contractor/business rules.','491 TBO 不设 Gold 或 Green 属性。企业须经营至少 12 个月、独资或与配偶共同拥有，并在支付规定个人收入后仍盈利；须核对当前收入门槛、ATO 记录、Fair Work 学习、家属及承包商／企业排除规则。'],
  ],fields:[
    field('businessIncome','Profitable business personal income: select the applicable current band','盈利企业个人收入：选择适用当前档位',[option(40,'At least $106,600 for over 12 months','至少 $106,600、超过 12 个月','orange-plus'),option(20,'More than $79,423 but less than $106,600 in last year','上一年超过 $79,423 但不足 $106,600','orange'),option(12,'More than $71,480 but less than $79,423 in last year','上一年超过 $71,480 但不足 $79,423','orange')]),
    binary('businessTurnover','Business turnover over $500,000 in last financial year','上一财年企业营业额超过 $500,000',30,'orange-plus'),binary('businessStaff','Business employs over 10 local AU citizens, PRs or provisional visa holders','企业雇用超过 10 名本地澳洲公民、PR 或临居签证持有人',30,'orange-plus'),
    binary('incomeTwoYears','Personal business income over $79,423/year for the last 2 years; business still profitable','近 2 年企业个人收入每年超过 $79,423，企业仍盈利',20),pick(ter,'tasOnly'),binary('businessAssessment','Skills assessment directly related to current business','职业评估与当前企业经营直接相关',12),binary('businessQualification','Directly relevant Cert III+ qualification, excluding online/RPL','直接相关 Cert III 及以上学历，非网课／RPL',5),binary('spouseWork','Spouse working in TAS for last 6 months at priority pay','配偶近 6 个月在塔州工作且达优先收入',4),binary('businessMonths','Business operated for more than 18 consecutive months','企业已连续经营超过 18 个月',3),binary('threeStaff','At least 3 full-time AU citizens, PRs or provisional visa holders employed','雇用至少 3 名全职澳洲公民、PR 或临居签证持有人',3),field('residence','Continuous Tasmania residence','连续居住塔州时间',[option(3,'3 years or more','3 年及以上','orange'),option(2,'2–<3 years','满 2、不满 3 年','orange')]),binary('english','Proficient / Superior English or qualifying passport exemption','Proficient／Superior 英语或符合条件的护照豁免',2)
  ]};
  return {'act-resident-491':actResident,'act-overseas-491':actOverseas,'tas-tse-491':tse491,'tas-tsg-491':tsg491,'tas-ter-491':ter491,'tas-tbo-491':tbo491};
}
