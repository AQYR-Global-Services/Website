// Nomination systems are separate from the federal visa points test.
export const stateRuleDate = '2026-10-22';
export const states = {
  vic:{en:'Victoria',zh:'维多利亚州',url:'https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt',note:['Victoria ranks ROIs using its separate VPT. VPT points are not federal EOI points. Check nomination eligibility and current program status separately.','维州使用独立 VPT 排序 ROI。VPT 不是联邦 EOI 分数；提名资格及当前项目状态须另行核对。']},
  nsw:{en:'New South Wales',zh:'新南威尔士州',url:'https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190',note:['NSW selects candidates from SkillSelect rather than accepting direct 190 nomination applications. Occupation, age, English, qualifications and experience affect selection; an EOI total is not an invitation ranking or guarantee.','新州从 SkillSelect 择优邀请，不能直接申请 190 提名。职业、年龄、英语、学历及经验影响筛选；EOI 总分不等于邀请排名或获邀保证。']},
  qld:{en:'Queensland',zh:'昆士兰州',url:'https://www.migration.qld.gov.au/visa-options/skilled-visas',note:['Queensland has different streams for local workers, offshore workers, graduates and construction workers. Occupation, residence, employment and other stream conditions must be checked. The regional small-business stream is 491 only, not 190.','昆州分别设境内工作者、境外申请人、毕业生及建筑行业路径。需核对对应职业、居住、工作及其他条件；偏远地区小企业路径仅适用 491，不适用 190。']},
  wa:{en:'Western Australia',zh:'西澳大利亚州',url:'https://migration.wa.gov.au/our-services-support/state-nominated-migration-program',note:['WA uses General, Graduate and the 190-only Defence industry stream. Occupation/industry priority precedes residence for General and Graduate invitations. Check each stream’s current list and requirements; federal points alone do not establish nomination eligibility.','西澳设 General、Graduate 及仅适用 190 的 Defence 国防行业路径。General／Graduate 邀请先比较职业／行业优先类别，再比较居住地；须核对各路径当前清单及条件，联邦分数不代表已满足州提名资格。']},
  sa:{en:'South Australia',zh:'南澳大利亚州',url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants',note:['South Australia applies stream-specific occupation, residence, employment and graduate criteria. Onshore ROI selection and offshore EOI selection are separate processes. No extra numerical SA ranking score is inferred from the federal total.','南澳按路径核对职业、居住、工作及毕业生条件；境内 ROI 与境外 EOI 筛选流程不同。这里不把联邦分数换算成自行推定的南澳排名分。']},
  tas:{en:'Tasmania',zh:'塔斯马尼亚州',url:'https://www.migration.tas.gov.au/skilled_migration',note:['Tasmania ranks ROIs by pathway-specific priority attributes and pass categories, separately from federal EOI points. TSE, TSG and TER have different criteria. The offshore 190 health/education job-offer pathway has separate requirements.','塔州按具体路径的优先属性及通行类别排序 ROI，与联邦 EOI 分开。TSE、TSG 和 TER 条件不同；境外医疗／教育工作邀约 190 路径另有要求。']},
  act:{en:'Australian Capital Territory',zh:'澳大利亚首都领地',url:'https://www.act.gov.au/migration/skilled-migrants/canberra-matrix',note:['ACT uses the Canberra Matrix, with different tables for Canberra residents and overseas applicants. Matrix and federal EOI totals are separate. Meeting Matrix points does not establish ACT eligibility or guarantee selection.','ACT 使用 Canberra Matrix，堪培拉居民与境外申请人采用不同表格。Matrix 与联邦 EOI 分开；Matrix 分数不代表已满足 ACT 资格或保证获邀。']},
  nt:{en:'Northern Territory',zh:'北领地',url:'https://australiasnorthernterritory.com.au/move/migrate-to-work/nt-government-visa-nomination/eligibility',note:['NT checks local employment outcomes and long-term settlement commitment, with different resident, graduate and offshore criteria. 190 and 491 eligibility differ. Check current application restrictions before relying on a points estimate.','北领地重视本地就业及长期定居承诺，居民、毕业生和境外申请人条件不同，190 与 491 资格也有区别。请先核对当前申请限制，不能仅凭分数判断可申请。']},
};
export const stateCodes = Object.keys(states);
// Program availability is dated guidance, not a federal scoring or eligibility gate.
const saProgramNotice={
  published:'2026-10-22',checked:'2026-11-17',
  url:'https://migration.sa.gov.au/news/south-australias-general-skilled-migration-program-update',
  title:['South Australia · 2026–27 program update','南澳 · 2026–27 项目更新'],
  items:[
    {label:['Onshore · ROI','境内 · ROI'],body:['Currently open to people living and working in South Australia whose current visas expire on or before 31 January 2027. The relevant stream and occupation requirements still apply.','目前向在南澳居住、工作，且当前签证于 2027 年 1 月 31 日或之前到期的人士开放。仍须满足相应路径及职业要求。']},
    {label:['Onshore · Minimum versus selection','境内 · 门槛与择优'],body:['For SA graduates, skilled employment in SA and outer-regional skilled employment, at least 65 EOI points including nomination points remain a minimum. Higher EOI points are not an onshore selection factor. This does not replace the separate offshore selection rules.','南澳毕业生、当地技术就业及外偏远地区技术就业三条境内路径，EOI 至少 65 分（含提名加分）仍是门槛；更高 EOI 分数不作为境内择优因素。此说明不替代境外路径的独立筛选规则。']},
    {label:['Offshore · EOI','境外 · EOI'],body:['Candidates can continue to lodge an EOI through SkillSelect. South Australia selects suitable candidates from EOIs; offshore applicants do not submit an ROI.','申请人可继续通过 SkillSelect 提交 EOI，南澳从 EOI 中筛选合适人选；境外申请人无需提交 ROI。']},
    {label:['Priority sectors','优先行业'],body:['Building and construction, defence, education, engineering, health and manufacturing. High-ranking candidates in other sectors may also be considered.','建筑、国防、教育、工程、医疗及制造业；其他行业中排名较高的申请人亦可能获考虑。']},
  ],
  sources:[
    {label:['SA graduates · Official selection rules ↗','南澳毕业生 · 官方筛选说明 ↗'],url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/south-australian-graduates'},
    {label:['Skilled employment in SA · Official selection rules ↗','南澳技术就业 · 官方筛选说明 ↗'],url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/skilled-employment-in-south-australia'},
    {label:['Outer regional employment · Official selection rules ↗','外偏远地区就业 · 官方筛选说明 ↗'],url:'https://migration.sa.gov.au/before-applying/visa-options-and-pathways/skilled-migrants/outer-regional-skilled-employment'},
  ],
  note:['This is guidance, not an eligibility decision or invitation guarantee. It does not change federal EOI points. The onshore selection clarification has no separately stated commencement or transition date; the announcement date above refers to the program-status notice. Check current stream requirements before applying.','此为说明，不代表资格判断或保证获邀，也不改变联邦 EOI 计分。境内筛选说明未另列生效或过渡日期；上方公告日期指项目状态公告。申请前须核对当前具体路径条件。'],
};
const qldProgramNotice={
  published:'2026-10-30',checked:'2026-11-04',
  url:'https://www.migration.qld.gov.au/news/2026-27-queenslands-state-nominated-migration-program-now-published',
  title:['Queensland · 2026–27 program requirements','昆州 · 2026–27 项目条件'],
  items:[
    {label:['Onshore / graduates','境内／毕业生'],body:['190: at least 9 of the last 12 months living and working in Queensland before ROI. 491: at least 6 of the last 9 months in regional Queensland. Qualifying residence and current work must continue at ROI, invitation and nomination. Construction has its separate 3-continuous-month pathway.','190：ROI 前最近 12 个月中在昆州居住、工作至少 9 个月；491：最近 9 个月中在昆州偏远地区至少 6 个月。递交 ROI、获邀及获提名时继续满足居住、在职要求；建筑行业另有连续 3 个月路径。']},
    {label:['Offshore','境外'],body:['At ROI, at least 1 year of qualifying skilled work within the last 3 years is required; current employment in the nominated occupation is not required at ROI, invitation or nomination.','ROI 时，近 3 年内须有至少 1 年合资格技能工作；递交 ROI、获邀及获提名时，均不要求仍在提名职业就业。']},
    {label:['Graduates / tax evidence','毕业日期／报税证明'],body:['The Queensland graduate pathway requires graduation after 1 July 2022. Onshore applicants need their 2025–26 tax return and ATO Notice of Assessment before ROI, except where no return was required for that year.','昆州毕业生路径要求于 2022 年 7 月 1 日之后毕业。境内申请人须在 ROI 前完成 2025–26 报税并取得 ATO NOA；该财年依法无须报税者除外。']},
  ],
  sources:[
    {url:'https://www.migration.qld.gov.au/occupation-lists/queensland-onshore-skilled-occupation-list',label:['Current onshore occupation list ↗','当前境内职业清单 ↗']},
    {url:'https://www.migration.qld.gov.au/occupation-lists/offshore-queensland-skilled-occupation-lists-(qsol)',label:['Current offshore occupation list ↗','当前境外职业清单 ↗']},
    {url:'https://www.migration.qld.gov.au/visa-options/skilled-visas/documentation-checklist',label:['Evidence checklist and NOA exception ↗','材料清单及 NOA 例外 ↗']},
  ],
  note:['These are the published 2026–27 requirements, not an eligibility decision, invitation promise or change to federal points. The announcement does not specify a separate commencement or old-ROI transition date. Confirm the current intake, occupation and full pathway requirements before applying.','以上为已公布的 2026–27 条件，不代表资格判断、保证获邀或联邦加分变化。公告未另列生效或旧 ROI 过渡日期；申请前请核对当前轮次、职业及完整路径条件。'],
};
const tasAssessmentNotice={
  published:'2026-10-29',checked:'2026-11-04',
  url:'https://www.migration.tas.gov.au/news/processing_times_and_allocation_usage',
  title:['Tasmania · Nomination assessment','塔州 · 提名评审说明'],
  items:[
    {label:['Six-week reference','六周参考'],body:['Migration Tasmania now uses a six-week rolling invitation-score average instead of three months. The latest round and rolling average are changing assessment references, not extra points or fixed invitation cutoffs.','塔州现采用六周滚动邀请分数均值，取代原三个月均值。最近轮分数与滚动均值是动态评审参考，不是额外加分或固定邀请线。']},
    {label:['Unverified attributes','未获核实的属性'],body:['If claimed attributes are not verified, a revised score above the most recent round’s lowest score may still be approved. A revised score below both that round’s lowest score and the six-week average will be declined.','若申报属性未获核实，修正分高于最近邀请轮最低分，仍可能获批；若同时低于最近轮最低分及六周均值，则会被拒。']},
    {label:['Gold and evidence','Gold 与证据'],body:['A Gold holder who does not meet the Gold attribute will be declined regardless of total points. Deliberately inflated attribute claims will also be declined.','Gold 持有人若不满足对应 Gold 属性，无论总分多少均会被拒；故意虚报属性抬高分数亦会被拒。']},
  ],
  note:['This does not change the priority-attribute calculator. The source does not resolve equality or intermediate revised-score cases; no automatic approval or refusal is inferred here. Check the live figures and evidence before applying.','此说明不改变优先属性计分。官方未明确等于阈值或介于两项参考值之间的处理，工具不据此自动判定获批或拒绝；申请前须核对最新数据及证据。'],
};
const waProcessNotice={
  published:null,checked:'2026-11-17',
  url:'https://migration.wa.gov.au/our-services-support/state-nominated-migration-program',
  title:['Western Australia · Nomination guidance','西澳 · 州提名说明'],
  items:[
    {label:['Approval and nomination','审批与正式提名'],body:['An approved WA state-nomination application is eligible for nomination subject to places in the current program year. If no places are available, the application is carried over to the next program year.','西澳州提名申请获批后，仍须视当前项目年度名额情况安排正式提名；如无可用名额，申请将顺延至下一项目年度。']},
    {label:['Invitation priorities','邀请排序'],body:['General and Graduate streams prioritise occupation/industry before residence within each category. Graduate qualification level is considered before EOI points and EOI date. VET qualifications rank Advanced Diploma, Diploma, Certificate IV, then Certificate III.','General／Graduate 先比较职业／行业优先类别，再在类别内比较居住地；Graduate 在 EOI 分数及登记时间之前还比较学历。VET 学历顺序为 Advanced Diploma、Diploma、Certificate IV、Certificate III。']},
    {label:['EOI state choice','EOI 州别选择'],body:['Your EOI must seek nomination from Western Australia only. Confirm the live occupation list, evidence and intake requirements before applying.','EOI 须仅选择 Western Australia（西澳）提名；申请前核对实时职业清单、证据及当前轮次条件。']},
    {label:['Defence · 190 only','Defence 国防行业 · 仅 190'],body:['WASMOL Schedule 3 is a separate 190-only stream, with a matching skills assessment and applicable WA employment-contract requirements. It is not a 491 Defence pathway or an automatic eligibility result.','WASMOL 清单 3 是独立、仅适用 190 的路径，须有匹配的职业评估并满足适用的西澳工作合同要求；不适用于 491，也不自动判定资格。']},
    {label:['Transport Engineer · 233215','交通工程师 · 233215'],body:['The live General Schedule 2 list places this occupation in Building and Construction with priority status; both 190 and 491 remain listed. Confirm the live list before claiming priority.','实时 General 清单 2 将此职业列入 Building and Construction 建筑行业并标为优先；190 与 491 均保留。申报优先类别前须核对实时清单。']},
  ],
  sources:[{label:['WA · Current 2026–27 criteria PDF ↗','西澳 · 当前 2026–27 细则 PDF ↗'],url:'https://migration.wa.gov.au/sites/default/files/2026-11/SNMP%20Criteria%2026-27.pdf'}],
  note:['This guidance does not change federal EOI points, guarantee nomination timing or guarantee a visa. No separate commencement or transition date was verified; a check date does not confirm the intake is open. Check the current official rules and Steps 5 and 6.','此说明不改变联邦 EOI 计分，不保证提名时间或签证结果。尚未核实独立生效或过渡日期，核对日期也不代表项目已开放；须核对当前官方细则及第 5、6 步流程。'],
};
export function getNominationProgramNotice(state,visa,now=new Date()){
  if(['190','491'].includes(visa)&&state==='tas')return tasAssessmentNotice;
  if(['190','491'].includes(visa)&&state==='wa')return waProcessNotice;
  if(!['190','491'].includes(visa))return null;
  if(state==='sa')return saProgramNotice;
  if(state!=='qld')return null;
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
  const beforeOpening=`${parts.year}-${parts.month}-${parts.day}`<'2026-11-06';
  const opening={label:['ROI opening','ROI 开放日期'],body:beforeOpening?
    ['ROIs are scheduled to open on 6 November 2026. This intake is upcoming; do not treat the publication of requirements as confirmation that ROIs are already open.','ROI 计划于 2026 年 11 月 6 日开放，目前尚未到公告开放日期；条件公布不代表 ROI 已开放。']:
    ['The announced ROI opening date is 6 November 2026. Confirm current access and any later notice on the official site; this calculator does not verify live program availability.','公告 ROI 开放日期为 2026 年 11 月 6 日；请到官网确认当前入口及后续公告，本工具不实时确认项目是否开放。']};
  return {...qldProgramNotice,items:[opening,...qldProgramNotice.items]};
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
