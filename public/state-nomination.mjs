// Nomination systems are separate from the federal visa points test.
export const stateRuleDate = '2026-10-22';
export const states = {
  vic:{en:'Victoria',zh:'维多利亚州',url:'https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt',note:['Victoria ranks ROIs using its separate VPT. VPT points are not federal EOI points. Check nomination eligibility and current program status separately.','维州使用独立 VPT 排序 ROI。VPT 不是联邦 EOI 分数；提名资格及当前项目状态须另行核对。']},
  nsw:{en:'New South Wales',zh:'新南威尔士州',url:'https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190',note:['NSW selects candidates from SkillSelect rather than accepting direct 190 nomination applications. Occupation, age, English, qualifications and experience affect selection; an EOI total is not an invitation ranking or guarantee.','新州从 SkillSelect 择优邀请，不能直接申请 190 提名。职业、年龄、英语、学历及经验影响筛选；EOI 总分不等于邀请排名或获邀保证。']},
  qld:{en:'Queensland',zh:'昆士兰州',url:'https://www.migration.qld.gov.au/visa-options/skilled-visas',note:['Queensland has different streams for local workers, offshore workers, graduates and construction workers. Occupation, residence, employment and other stream conditions must be checked. The regional small-business stream is 491 only, not 190.','昆州分别设境内工作者、境外申请人、毕业生及建筑行业路径。需核对对应职业、居住、工作及其他条件；偏远地区小企业路径仅适用 491，不适用 190。']},
  wa:{en:'Western Australia',zh:'西澳大利亚州',url:'https://migration.wa.gov.au/our-services-support/state-nominated-migration-program',note:['WA uses General and Graduate streams, occupation lists and invitation priorities. Check the current stream, residence priority, employment requirements and invitation criteria. Federal points alone do not establish nomination eligibility.','西澳按 General／Graduate 路径、职业清单及邀请优先级筛选。需核对当前路径、居住优先级、工作要求和邀请标准；联邦分数不代表已满足州提名资格。']},
  sa:{en:'South Australia',zh:'南澳大利亚州',url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants',note:['South Australia applies stream-specific occupation, residence, employment and graduate criteria. Onshore ROI selection and offshore EOI selection are separate processes. No extra numerical SA ranking score is inferred from the federal total.','南澳按路径核对职业、居住、工作及毕业生条件；境内 ROI 与境外 EOI 筛选流程不同。这里不把联邦分数换算成自行推定的南澳排名分。']},
  tas:{en:'Tasmania',zh:'塔斯马尼亚州',url:'https://www.migration.tas.gov.au/skilled_migration',note:['Tasmania ranks ROIs by pathway-specific priority attributes and pass categories, separately from federal EOI points. TSE, TSG and TER have different criteria. The offshore 190 health/education job-offer pathway has separate requirements.','塔州按具体路径的优先属性及通行类别排序 ROI，与联邦 EOI 分开。TSE、TSG 和 TER 条件不同；境外医疗／教育工作邀约 190 路径另有要求。']},
  act:{en:'Australian Capital Territory',zh:'澳大利亚首都领地',url:'https://www.act.gov.au/migration/skilled-migrants/canberra-matrix',note:['ACT uses the Canberra Matrix, with different tables for Canberra residents and overseas applicants. Matrix and federal EOI totals are separate. Meeting Matrix points does not establish ACT eligibility or guarantee selection.','ACT 使用 Canberra Matrix，堪培拉居民与境外申请人采用不同表格。Matrix 与联邦 EOI 分开；Matrix 分数不代表已满足 ACT 资格或保证获邀。']},
  nt:{en:'Northern Territory',zh:'北领地',url:'https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination/eligibility',note:['NT checks local employment outcomes and long-term settlement commitment, with different resident, graduate and offshore criteria. 190 and 491 eligibility differ. Check current application restrictions before relying on a points estimate.','北领地重视本地就业及长期定居承诺，居民、毕业生和境外申请人条件不同，190 与 491 资格也有区别。请先核对当前申请限制，不能仅凭分数判断可申请。']},
};
export const stateCodes = Object.keys(states);
// Program availability is dated guidance, not a federal scoring or eligibility gate.
const saProgramNotice={
  published:'2026-10-22',checked:'2026-10-23',
  url:'https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update',
  title:['South Australia · 2026–27 program update','南澳 · 2026–27 项目更新'],
  items:[
    {label:['Onshore · ROI','境内 · ROI'],body:['Currently open to people living and working in South Australia whose current visas expire on or before 31 January 2027. The relevant stream and occupation requirements still apply.','目前向在南澳居住、工作，且当前签证于 2027 年 1 月 31 日或之前到期的人士开放。仍须满足相应路径及职业要求。']},
    {label:['Offshore · EOI','境外 · EOI'],body:['Candidates can continue to lodge an EOI through SkillSelect. South Australia selects suitable candidates from EOIs; offshore applicants do not submit an ROI.','申请人可继续通过 SkillSelect 提交 EOI，南澳从 EOI 中筛选合适人选；境外申请人无需提交 ROI。']},
    {label:['Priority sectors','优先行业'],body:['Building and construction, defence, education, engineering, health and manufacturing. High-ranking candidates in other sectors may also be considered.','建筑、国防、教育、工程、医疗及制造业；其他行业中排名较高的申请人亦可能获考虑。']},
  ],
  note:['This is a program-status notice, not an eligibility decision or invitation guarantee. It does not change federal EOI points. Check the latest announcement and stream requirements before applying.','此为项目状态提示，不代表符合提名资格或保证获邀，也不改变联邦 EOI 计分。申请前请核对最新公告及具体路径条件。'],
};
export function getNominationProgramNotice(state,visa){
  return state==='sa'&&['190','491'].includes(visa)?saProgramNotice:null;
}
export const regional491 = {
  vic:{url:'https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-visa-faqs',area:['Only designated regional Victorian postcodes qualify; metropolitan Melbourne is excluded. Check the actual postcode, not just the state.','仅指定偏远地区的维州邮编适用，墨尔本都会区不包括在内；须核对实际邮编，不能仅凭所在州判断。']},
  nsw:{url:'https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-work-regional-visa-subclass-491',area:['Only designated regional NSW postcodes qualify; Sydney is excluded. Newcastle and Wollongong include eligible areas. Check the actual postcode.','仅指定偏远地区的新州邮编适用，悉尼不包括在内；纽卡斯尔、卧龙岗包含符合地区，须核对实际邮编。']},
  qld:{url:states.qld.url,area:['Only designated regional Queensland postcodes qualify; Brisbane is excluded. The Gold Coast and Sunshine Coast include eligible areas. Check the actual postcode.','仅指定偏远地区的昆州邮编适用，布里斯班不包括在内；黄金海岸、阳光海岸包含符合地区，须核对实际邮编。']},
  wa:{url:states.wa.url,area:['All of Western Australia, including Perth, is designated regional for this visa. State nomination conditions still apply separately.','西澳全州（包括珀斯）属于此签证指定偏远地区；州提名条件仍须另行满足。']},
  sa:{url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-work-regional-provisional',area:['All of South Australia, including Adelaide, is designated regional for this visa. State nomination conditions still apply separately.','南澳全州（包括阿德莱德）属于此签证指定偏远地区；州提名条件仍须另行满足。']},
  tas:{url:states.tas.url,area:['All of Tasmania, including Hobart, is designated regional for this visa. Tasmania has separate 491 pathways and requirements.','塔州全州（包括霍巴特）属于此签证指定偏远地区；塔州 491 的路径及要求须单独核对。']},
  act:{url:'https://www.act.gov.au/migration/skilled-migrants/act-government-nomination/act-nomination-pathways',area:['The ACT, including Canberra, is designated regional for this visa. ACT 491 nomination and Matrix requirements need separate checking.','首都领地（包括堪培拉）属于此签证指定偏远地区；ACT 491 提名及 Matrix 要求须另行核对。']},
  nt:{url:states.nt.url,area:['All of the Northern Territory, including Darwin, is designated regional for this visa. NT 491 nomination conditions still apply separately.','北领地全境（包括达尔文）属于此签证指定偏远地区；北领地 491 提名条件仍须另行满足。']},
};
export const estimateLimits = Object.fromEntries(stateCodes.flatMap(state=>[[state+'-189',130],[state+'-190',state==='vic'?950:135],[state+'-491',state==='vic'?950:145]]));
export const isFederalNomination = pathway => /-(190|491)$/.test(pathway) && !['vic-190','vic-491'].includes(pathway) && Object.hasOwn(estimateLimits,pathway);
