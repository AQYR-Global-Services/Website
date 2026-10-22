import {calculate, priorityCodes} from './points-rules.mjs?v=20261022-postcodes';
import {englishTests, needsEnglishDate, legacyOet, englishBands, englishEvidenceIssue} from './english-rules.mjs?v=20261022-all-tests';
import {states, stateCodes, regional491} from './state-nomination.mjs?v=20261022-491';
import {initialiseRankingTool} from './nomination-ranking.mjs?v=20261022-shared-english';
import {lookupRegionalPostcode,regionalPostcodeCanProceed} from './regional-postcodes.mjs';
import {initialiseOccupationPicker} from './occupation-picker.mjs';
import {getOccupation} from './occupation-search.mjs';
import {createPointsSnapshot} from './points-enquiry.mjs?v=20261022-postcodes';

export function nominationScoreCard(assessment,text) {
  if(!assessment)return '';
  const {score,system,path}=assessment;
  const count=(score.missing?.length||0)+(score.invalid?.length||0)+(score.confirmationRequired?1:0);
  const title=system==='matrix'?'Canberra Matrix':text('TAS ROI priority attributes','塔州 ROI 优先属性');
  const tier={none:text('No priority claim','未申报优先属性'),orange:'Orange','orange-plus':'Orange Plus',green:'Green',gold:'Gold'}[score.tier];
  const explanation=score.conflicts?.length?text('Conflicting selections — calculation stopped.','选项冲突，已停止计算。')
    :score.total==null?text(count+' item(s) to complete, including any evidence confirmation.','尚有 '+count+' 项待完成（包括所需材料确认）。')
    :system==='tas'?text('Priority category: ','优先类别：')+tier+text('. Self-assessed; not an invitation.','。仅为自评，不代表获邀。')
    :text('Independent ACT ranking. Self-assessed; not an invitation.','ACT 独立排序分，仅为自评，不代表获邀。');
  return '<div class="pc-score-card pc-nomination-score"><div>'+title+'</div><p class="pc-score-path">'+text(...path)+'</p><strong data-score="'+system+'">'+(score.total==null?'—':score.total)+'</strong><small>'+text('points','分')+'</small><p>'+explanation+'</p><button type="button" class="pc-review-nomination" data-pc-review-nomination>'+text(score.total==null?'Review missing / conflicting answers':'Review nomination assessment',score.total==null?'查看漏填／冲突项目':'查看州提名自评')+'</button></div>';
}

export function calculatorValues(elements) {
  return Object.fromEntries([...elements]
    .filter(el => el.name && (el.type !== 'radio' || el.checked))
    .map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
}

export function initialisePointsCalculator() {
  const host = document.querySelector('#points-calculator');
  if (!host || host.dataset.ready) return;
  const form = host.querySelector('form');
  const root = document.documentElement;
  const text = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
  // Keep the common federal form secondary to the state-specific 190 pathway.
  const federalPanel=document.createElement('details');
  federalPanel.id='pc-federal-panel';federalPanel.className='pc-federal-panel';
  const federalSummary=document.createElement('summary');
  federalPanel.append(federalSummary);
  const common=host.querySelector('[data-pc-common]');
  common.before(federalPanel);
  host.querySelector('[data-pc-state-info]').before(common);
  for(const selector of ['[data-pc-federal]','[data-pc-vpt]'])federalPanel.append(host.querySelector(selector));
  let lastPathway='';
  const labels = {
    state:['state','州'], visa:['visa','签证类别'], age:['age','年龄'], english:['English','英语'],
    regionalConfirmed:['491 regional location and obligations confirmation','491 偏远地区地点及限制确认'],
    regionalPostcode:['491 intended postcode','491 计划地点邮编'],
    overseas:['overseas work','海外工作'], australian:['Australian work','澳洲工作'], education:['education','学历'],
    partner:['partner','配偶'], experience:['nominated occupation experience','提名职业工作年限'], skill:['occupation skill level','职业技能等级'],
    occupation:['nominated occupation','提名职业'], 'occupation-level':['occupation level needs checking','职业等级需进一步核对'],
    vptEducation:['highest qualification','最高学历'], vptPartner:['VPT partner conditions','VPT 配偶条件'],
    'earnings-status':['Victorian earnings conditions','维州收入条件'], salary:['eligible earnings','合资格收入'],
    'partner-code':['partner occupation','配偶职业'],
    employment:['Skilled employment (combined cap: 20)','技术工作（合计上限 20）'], study:['Australian study','澳洲学习'],
    specialist:['Specialist education','特定研究学历'], regional:['Regional study','偏远地区学习'],
    professional:['Professional Year','职业年'], language:['Community language','社区语言'], earnings:['Victorian earnings','维州收入'],
  };
  const label = key => text(...labels[key]);
  function values() {
    return calculatorValues(form.elements);
  }
  function show(selector, visible) {
    const node = document.querySelector(selector);
    node.hidden = !visible;
    node.querySelectorAll('input, select').forEach(el => {el.disabled = !visible;});
  }
  function rows(items) {
    return '<dl>' + Object.entries(items).map(([key,value]) => '<div><dt>'+label(key)+'</dt><dd>'+(value == null ? text('Pending','待核对') : value)+'</dd></div>').join('') + '</dl>';
  }
  function update() {
    const input = values();
    host.querySelectorAll('[data-pc-state]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pcState===input.state)));
    const chosen = stateCodes.includes(input.state) && ['189','190','491'].includes(input.visa);
    const vic = chosen && input.state === 'vic' && input.visa === '190';
    const federal = chosen && !vic;
    show('[data-pc-state-info]', chosen && input.visa === '190');
    rankingTool.update(input.state,input.visa,input);
    const nomination=rankingTool.assessment();
    if(vic&&rankingTool.selected()==='vic-offshore'){
      input.earningEligible='no';form.elements.namedItem('earningEligible').value='no';
    }
    const hasNominationPath=input.visa!=='190'||!!rankingTool.selected();
    const pathwayKey=input.state+'-'+input.visa;
    if(lastPathway!==pathwayKey){
      federalPanel.open=input.visa!=='190'||vic;
      form.elements.namedItem('regionalConfirmed').checked=false;input.regionalConfirmed=false;
      lastPathway=pathwayKey;
    }
    show('[data-pc-491]',chosen&&input.visa==='491');
    if(chosen&&input.visa==='491'){
      host.querySelector('#pc-491-area').textContent=text(...regional491[input.state].area);
      const lookup=lookupRegionalPostcode(input.regionalPostcode,input.state);
      const regionalResult=host.querySelector('#pc-postcode-result');
      const stateNames=lookup.states.map(code=>states[code]?text(states[code].en,states[code].zh):text('Other Territories','其他领地')).join(' / ');
      let title,detail;
      if(lookup.status==='empty'){
        title=text('Enter a postcode to check','输入邮编，查询地区');detail=text('Use the four-digit postcode for the place you plan to live, work or study.','填写计划居住、工作或学习地点的四位邮编。');
      }else if(lookup.status==='invalid'){
        title=text('Enter four digits','请输入四位数字');detail=text('Keep any leading zero, e.g. 0800.','请保留开头的 0，例如 0800。');
      }else if(lookup.status==='unknown'){
        title=text('Unable to confirm this postcode','暂无法确认此邮编');detail=text('Not found in the local geographic reference. New, PO-box and special-purpose postcodes may be absent. This is not a “non-regional” decision; check the actual street address with the team.','本地地理邮编资料未收录；新设、邮政信箱或特殊用途邮编可能不在其中。这不等于“非偏远地区”，请联系团队核对实际街道地址。');
      }else if(lookup.status==='shared'){
        title=lookup.postcode+' · '+text('Cross-border postcode — check the address','跨州邮编，需核对实际地址');detail=stateNames+text('. The postcode covers more than one jurisdiction. We cannot confirm regional eligibility from this postcode alone.','. 此邮编覆盖多个州／领地，不能仅凭邮编自动确认地区条件。');
      }else if(lookup.status==='unsupported'){
        title=text('Other territory — individual check needed','其他领地，需单独核对');detail=stateNames+text('. Not covered by the eight-state nomination calculators.','. 不属于当前八州／领地提名计算器的查询范围。');
      }else{
        title=lookup.postcode+' · '+(lookup.regional?text('Designated regional area','属于指定偏远地区'):text('Not a designated regional area','不属于指定偏远地区'));
        detail=stateNames+' · '+(lookup.regional?text('Category '+lookup.category,'第 '+lookup.category+' 类'):text('Not listed in Home Affairs regional postcodes','未列入内政部指定偏远地区邮编范围'));
        if(!lookup.matchesState)detail+=text('. This postcode does not match your selected state. Change the state or postcode.','。此邮编与当前所选州不一致，请修改州或邮编。');
        else detail+=lookup.regional?text('. Regional designation only; nomination and the actual address still need checking.','。仅判断地区范围，不代表已满足州提名条件；实际地址仍须核验。'):text('. This location cannot satisfy the 491 regional requirement.','。此地点不能满足 491 的指定偏远地区要求。');
      }
      regionalResult.dataset.status=regionalPostcodeCanProceed(lookup)?'regional':lookup.status==='empty'?'empty':lookup.status==='matched'&&!lookup.regional?'nonregional':'attention';
      host.querySelector('#pc-postcode-result-title').textContent=title;
      host.querySelector('#pc-postcode-result-detail').textContent=detail;
      const postcodeField=form.elements.namedItem('regionalPostcode');
      if(lookup.status!=='empty'&&!regionalPostcodeCanProceed(lookup))postcodeField.setAttribute('aria-invalid','true');else postcodeField.removeAttribute('aria-invalid');
    }
    federalPanel.hidden=!chosen||!hasNominationPath;
    federalPanel.classList.toggle('pc-federal-panel--plain',input.visa!=='190'||vic);
    federalSummary.textContent=text('Federal EOI · open the separate points calculator','联邦 EOI · 展开独立计分');
    show('[data-pc-common]', chosen);
    show('[data-pc-federal]', federal);
    show('[data-pc-vpt]', vic);
    show('[data-pc-result-button]', chosen);
    show('[data-pc-english-level]', chosen && input.englishMode === 'level');
    const test = englishTests[input.englishMode];
    const letters = legacyOet(input);
    show('[data-pc-english-scores]', chosen && !!test);
    show('[data-pc-test-date]', chosen && needsEnglishDate(input.englishMode));
    show('[data-pc-passport]', chosen && input.englishMode === 'passport');
    const evidenceNeeded = (input.englishMode === 'toefl' && input.testDate >= '2025-08-07') || (input.englishMode === 'cambridge' && input.testDate >= '2024-02-12' && input.testDate < '2025-08-07');
    show('[data-pc-test-evidence]', chosen && evidenceNeeded);
    host.querySelector('#pc-test-evidence-label').textContent = input.englishMode === 'toefl'
      ? text('Registered as “Taking TOEFL for Australia”, with 0–30 section scores?','是否通过“Taking TOEFL for Australia”报名，且各单项成绩为 0–30 分？')
      : text('Was this Cambridge C1 Advanced test paper-based?','这次 Cambridge C1 Advanced 是否为纸笔考试？');
    show('[data-pc-test-reference]', chosen && !!test);
    show('[data-pc-salary]', vic && input.earningEligible === 'yes');
    show('[data-pc-partner-code]', vic && input.vptPartner === 'yes');
    show('#points-sources', chosen);
    show('[data-pc-reference="vpt"]', vic);
    show('[data-pc-reference="federal"]', federal);
    show('[data-pc-reference="nsw"]', federal && input.state === 'nsw' && input.visa === '190');
    const state = states[input.state];
    host.querySelector('#pc-selected-state').textContent=state?text(state.en,state.zh):text('Choose a state from the index','请从索引选择州或领地');
    if (state) {
      host.querySelector('#pc-state-note').textContent = text(...state.note);
      const stateLink = host.querySelector('#pc-state-link');
      stateLink.href = state.url;
      stateLink.textContent = text('Official '+state.en+' nomination rules','查阅'+state.zh+'官方提名规则');
    }
    occupationPicker.refresh();
    partnerOccupationPicker.refresh();
    const regional = form.elements.namedItem('regional');
    regional.disabled = !federal || !input.study;
    if (!input.study) {regional.checked = false; input.regional = false;}
    const specialist = form.elements.namedItem('specialist');
    specialist.disabled = !federal || !['master','phd'].includes(input.education);
    if (!['master','phd'].includes(input.education)) {specialist.checked = false; input.specialist = false;}
    ['listening','reading','writing','speaking'].forEach(key => {
      const el = form.elements.namedItem(key);
      el.type = letters ? 'text' : 'number';
      el.inputMode = letters ? 'text' : test?.step === 0.5 ? 'decimal' : 'numeric';
      el.min = String(test?.min ?? 0);
      el.max = String(test?.max ?? 9);
      el.step = String(test?.step ?? 1);
      el.placeholder = letters ? 'A / B / C+ / C / D / E' : '';
      el.setAttribute('aria-describedby','pc-test-guidance pc-english-validity');
    });
    const issue = englishEvidenceIssue(input);
    const issueText = {
      date:['Enter a valid test date to load the applicable score table.','请填写有效的考试日期，以加载对应分数标准。'],
      'not-approved':['This test was not accepted before 7 August 2025. No English level can be calculated for that date.','此考试在 2025 年 8 月 7 日前不被认可，因此不计算该日期的英语等级。'],
      'toefl-suspended':['TOEFL iBT taken from 26 July 2023 to 4 May 2024 was not approved for Australian visa purposes.','2023 年 7 月 26 日至 2024 年 5 月 4 日参加的 TOEFL iBT 不被接受用于澳洲签证。'],
      'toefl-registration':['Confirm the Australian registration pathway and score scale above before a level can be calculated. Do not convert 1–6 bands yourself.','请先确认上方的澳洲专用报名路径及计分制，再计算等级；不要自行换算 1–6 分制。'],
      'cambridge-paper':['For this test date, only paper-based C1 Advanced is accepted. Confirm the format above.','该日期的 C1 Advanced 仅认可纸笔考试，请先确认考试形式。'],
    };
    const guidance = [];
    if (test) guidance.push(text('Use all four scores from the same accepted test sitting at a test centre; at-home / fully online tests are not accepted.','请填写同一次认可考点考试的四项成绩；居家或完全线上考试不被接受。'));
    if (letters) guidance.push(text('Enter the letter grade shown on each pre-7 August 2025 OET sub-test result.','2025 年 8 月 7 日前的 OET 请填写各单项的字母等级。'));
    if (input.englishMode === 'met') guidance.push(text('MET has Competent and Proficient thresholds only; Home Affairs does not list a Superior threshold.','MET 仅设 Competent 和 Proficient 标准；内政部未列出 Superior 标准。'));
    if (input.englishMode === 'toefl') guidance.push(text('Enter 0–30 section scores, not a total or 1–6 bands. From 21 January 2026, use the TOEFL iBT Australia version.','填写各单项 0–30 分成绩，不填总分或 1–6 分制；2026 年 1 月 21 日起须使用 TOEFL iBT Australia 版本。'));
    if (issue && test) guidance.push(text(...issueText[issue]));
    host.querySelector('#pc-test-guidance').hidden = !test;
    host.querySelector('#pc-test-guidance').textContent = guidance.join(' ');
    const bands = englishBands(input);
    host.querySelector('#pc-test-thresholds').innerHTML = !bands ? '<p class="pc-hint">'+text('Choose a valid test date first.','请先填写有效考试日期。')+'</p>'
      : '<p class="pc-hint">'+text('Minimum in each component · L / R / W / S','各单项最低标准 · 听力／阅读／写作／口语')+'</p><dl>'+bands.map((band,index)=>'<div><dt>'+['Competent','Proficient','Superior'][index]+'</dt><dd>'+(band ? band.join(' / ') : text('Not listed / no claim','未列出／不申报'))+'</dd></div>').join('')+'</dl>';
    form.elements.namedItem('testDate').max = new Date().toISOString().slice(0,10);
    host.querySelector('label[for="pc-age"] span').textContent = vic ? text('Age at ROI (whole years)','ROI 对应年龄（周岁）') : text('Age at invitation (whole years)','获邀时年龄（周岁）');
    host.querySelector('#pc-age-hint').textContent = vic ? text('Use your age for the Victorian Registration of Interest.','填写维州 ROI 意向登记对应的周岁年龄。') : text('Use your expected age when invited to apply for the visa.','填写预计获得签证邀请时的周岁年龄。');
    const englishOptions = {below:['Below Competent','未达到 Competent'],competent:['Competent','Competent'],proficient:['Proficient','Proficient'],superior:['Superior','Superior']};
    const englishPoints = vic ? {below:0,competent:0,proficient:100,superior:200} : {below:0,competent:0,proficient:10,superior:20};
    host.querySelectorAll('#pc-english option[value]').forEach(option => {
      if (englishOptions[option.value]) option.textContent = text(...englishOptions[option.value]) + ' · +' + englishPoints[option.value];
    });
    const result = calculate(input);
    const includeScore = host.querySelector('#pc-include-score');
    show('[data-pc-enquiry]', chosen && result.total != null);
    if (result.total == null) includeScore.checked = false;
    const contactBase = '/contact?service=skilled&audience=individual#enquiry';
    const snapshot = includeScore.checked ? createPointsSnapshot(input) : null;
    host.querySelector('#pc-contact').href = includeScore.checked
      ? contactBase + '?' + new URLSearchParams({pathway:input.state+'-'+input.visa,score:String(result.total),details:JSON.stringify(snapshot)})
      : contactBase;
    const pathway = nomination?input.state.toUpperCase()+' 190 · '+text('Two separate scores','两项独立评分'):vic ? text('VIC 190 · Victorian Points Test','VIC 190 · 维州 VPT') : federal ? input.state.toUpperCase()+' '+input.visa+' · EOI' : text('Select your pathway','请选择路径');
    host.querySelector('.pc-form-heading h2').textContent = state?input.state.toUpperCase()+' · '+text('189 / 190 / 491 calculator','189／190／491 计算器'):text('Choose a state calculator','选择州计算器');
    host.querySelector('#pc-result-title').textContent = pathway;
    host.querySelector('#pc-results').classList.toggle('pc-summary--dual',!!nomination);
    host.querySelector('#pc-mode-note').textContent = !chosen ? text('Choose a state from the index, then select a visa subclass.','请从索引选择州或领地，再选择签证类别。')
      : vic ? text('Victorian 190: only the 2026–27 VPT is calculated here. Seven factors, one total. There is no fixed pass mark.','维州 190：此处仅计算 2026–27 新版 VPT。七项因素，一个总分，没有固定及格分。')
      : input.visa === '189' ? text('189 uses the federal points test. There are no state nomination or salary points.','189 使用联邦计分规则，不含州提名或薪资加分。')
      : input.visa === '491' ? text('491: federal EOI plus 15 conditional state nomination points, not +5 and +15 together. Check the regional requirements below before calculating.','491：联邦 EOI 加有条件州提名 15 分，不与 190 的 5 分叠加。请先核对下方偏远地区要求。')
      : text('Choose a '+state.en+' nomination pathway below. Review its selection method first; open the separate federal EOI calculator when needed.','请先选择下方'+state.zh+'提名路径，核对该路径的筛选方式；需要时再展开独立的联邦 EOI 计算。');
    host.querySelector('#pc-english-result').textContent = result.english ? text('English level: ','英语等级：') + text(...englishOptions[result.english])+' · '+text(vic?'VPT English points: +':'Federal EOI English points: +',vic?'VPT 英语加分：+':'联邦 EOI 英语加分：+')+englishPoints[result.english] : text('Select your test and enter all four component scores, the date and any required confirmations. Your English level will be calculated automatically.','选择考试类型，填写听说读写各单项成绩、考试日期及必要确认，系统将自动判断英语等级。');
    if (vic && input.vptPartner === 'yes') host.querySelector('#pc-partner-result').textContent = !getOccupation(input.partnerCode)
      ? text('Search for your partner’s occupation and select a matching result.','请搜索配偶职业，并选中对应的搜索结果。')
      : priorityCodes.has(input.partnerCode)
      ? text('Priority occupation found: +50 if all skilled partner conditions are met. Recheck the current official list before lodging.','已匹配优先职业：符合全部技术配偶条件时 +50 分；递交前请再次核对官方清单。')
      : text('Not on this snapshot’s priority list: partner +0. This does not assess occupation eligibility.','此代码未列入本版本优先清单：配偶 +0 分；这并非职业资格判断。');
    const postcodeBlocked=result.issues.some(issue=>issue.startsWith('regional-postcode-'));
    const blocked = result.issues.includes('age-limit') || result.issues.includes('english-minimum');
    let markup = '';
    if (!chosen) markup = '<p class="pc-hint">'+text('Choose a state from the index, then select 189, 190 or 491.','请从索引进入州计算器，再选择 189、190 或 491。')+'</p>';
    else {
      markup = nominationScoreCard(nomination,text);
      if(nomination)markup+='<p class="pc-dual-score-note">'+text('Independent scores — do not add them together. The enquiry checkbox attaches federal EOI only.','两项分数独立，不可相加。咨询勾选项仅附上联邦 EOI。')+'</p>';
      markup += '<div class="pc-score-card'+(vic?' pc-vpt-score':'')+'"><div>'+text(vic?'VPT total':nomination?'Federal EOI total':'EOI total',vic?'VPT 总分':nomination?'联邦 EOI 总分':'EOI 总分')+'</div><strong data-score="'+(vic?'vpt':'federal')+'">'+(result.total == null?'—':result.total)+'</strong><small>'+text(vic?'/ 950 points':'points',vic?'/ 950 分':'分')+'</small><p>';
      markup += result.total == null ? (postcodeBlocked?text('Resolve the postcode / selected-state check before a 491 total can be shown.','邮编或所选州的核对未通过，暂不显示 491 总分。'):blocked ? text('A basic age or English requirement is not met.','年龄或英语基本要求未满足。') : text('Complete the required selections.','请完成必填选项。'))
        : vic ? text('No fixed pass mark. This score does not predict an invitation.','没有固定及格分，此分数不代表能够获邀。')
        : input.visa === '190' ? text('Base '+result.base+' + conditional nomination 5. Not a nomination already granted.','基础 '+result.base+' 分 + 有条件州提名 5 分；不代表已获得提名。')
        : input.visa === '491' ? text('Base '+result.base+' + conditional nomination 15. Not a nomination or regional eligibility decision.','基础 '+result.base+' 分 + 有条件州提名 15 分；不代表已获提名或符合地区要求。')
        : text('Federal 189 points, without nomination points.','联邦 189 分数，不含州提名加分。');
      markup += '</p></div>';
      if (result.missing.length) markup += '<p class="pc-pending">'+text('To complete: ','待完成：')+result.missing.map(label).join(text(', ','、'))+text('.','。')+'</p>';
      if (federal && result.total != null) markup += '<p class="pc-score-status">'+(result.total >=65 ? text('At or above the 65-point federal minimum. This does not establish eligibility or guarantee invitation.','达到联邦 65 分最低分数要求，但不代表资格成立或保证获邀。') : text('Below the federal 65-point minimum.','未达到联邦 65 分最低分数要求。'))+'</p>';
    }
    host.querySelector('#pc-live-score').innerHTML = markup;
    host.querySelector('.pc-breakdown summary').textContent=nomination?text('Federal EOI breakdown','联邦 EOI 计分明细'):text('See the points breakdown','查看计分明细');
    host.querySelector('.pc-assumptions summary').textContent=nomination?text('Federal EOI assumptions','联邦 EOI 计算前提'):text('Assumptions & important notes','计算前提与重要提示');
    show('.pc-breakdown', chosen);
    show('.pc-assumptions', chosen);
    host.querySelector('#pc-breakdown').innerHTML = chosen ? rows(result.breakdown)+(federal && result.nomination ? '<p>'+text('Conditional nomination: +','有条件州提名：+')+result.nomination+'</p>':'') : '';
    const notes = [];
    if (result.issues.includes('age-limit')) notes.push(text('189 / 190 / 491 requires being under 45 when invited. Age 45+ cannot produce a qualifying total here.','189／190／491 要求签证获邀时未满 45 岁，45 岁及以上不显示可用总分。'));
    if (result.issues.includes('english-minimum')) notes.push(text('At least Competent English is required. Other points cannot replace this requirement.','需至少达到 Competent English，其他分数不能替代此要求。'));
    if (vic) {
      if (['8','9'].includes(input.experience)) notes.push(text('This calculator estimates 8 years or more at 100 points. Confirm the applicable experience band before lodging.','本工具将 8 年及以上按 100 分估算，正式申报前请核对适用年限档位。'));
      notes.push(text('This screen calculates VPT only. Visa eligibility and federal EOI requirements must still be checked separately before applying.','本页当前仅计算 VPT。正式申请前仍需另行核对签证资格与联邦 EOI 要求。'));
    }
    if (federal && input.visa === '190') notes.push(text(...state.note));
    if(input.visa==='491')notes.push(text(...regional491[input.state].area),text('The postcode check compares the regional table and geographic reference, not the actual street address or nomination eligibility. 491 state ranking and family sponsorship are not assessed. Regional study +5 is separate and is not awarded automatically for choosing 491.','邮编查询比对地区清单及地理邮编资料，不核验实际街道地址或提名资格，也不评估 491 州排序和亲属担保。偏远地区学习的 5 分需独立满足条件，不会因选择 491 自动加分。'));
    notes.push(text('Answers are calculated in this page. If you include your estimate, your pathway, scoring answers and itemised points are carried into the enquiry form for review. No email is sent automatically.','填写内容在当前页面计算。勾选附上预估分数后，会将路径、计分选项与每项得分带入咨询表单供您确认；不会自动发送邮件。'));
    host.querySelector('#pc-result-notes').innerHTML = notes.map(note=>'<p>'+note+'</p>').join('');
  }
  form.addEventListener('input', update);
  let scoreFormat = '';
  form.addEventListener('change', event => {
    if (event.target.name === 'englishMode') {
      for (const key of ['listening','reading','writing','speaking','testDate','testEvidence','passportCountry','english']) form.elements.namedItem(key).value = '';
    }
    const nextFormat = legacyOet(values()) ? 'letters' : 'numbers';
    if (scoreFormat && scoreFormat !== nextFormat) for (const key of ['listening','reading','writing','speaking']) form.elements.namedItem(key).value = '';
    scoreFormat = nextFormat;
    update();
  });
  host.querySelector('#pc-include-score').addEventListener('change', update);
  const runPostcodeCheck=()=>{update();host.querySelector('#pc-postcode-result').focus({preventScroll:true});};
  host.querySelector('#pc-postcode-check').addEventListener('click',runPostcodeCheck);
  host.querySelector('#pc-regional-postcode').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();runPostcodeCheck();}});
  host.querySelector('#pc-state-index').addEventListener('click',event=>{
    const button=event.target.closest('button[data-pc-state]');
    if(!button||!stateCodes.includes(button.dataset.pcState))return;
    form.elements.namedItem('state').value=button.dataset.pcState;
    form.elements.namedItem('state').dispatchEvent(new Event('change',{bubbles:true}));
    const heading=host.querySelector('#pc-calculator-title');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:'instant'});
  });
  host.querySelector('#pc-live-score').addEventListener('click',event=>{if(event.target.closest('[data-pc-review-nomination]'))rankingTool.review();});
  form.addEventListener('submit', event=>event.preventDefault());
  form.addEventListener('reset', () => {
    const selectedState=form.elements.namedItem('state').value;
    const selectedVisa=form.elements.namedItem('visa').value;
    rankingTool.reset();
    // Hidden inputs reflect assigned values into their reset defaults; clear the selection explicitly.
    form.elements.namedItem('occupation').value = '';
    form.elements.namedItem('partnerCode').value = '';
    setTimeout(()=>{
      form.elements.namedItem('state').value=selectedState;
      form.elements.namedItem('visa').value=selectedVisa;
      update();
    }, 0);
  });
  host.querySelector('#pc-show-result').addEventListener('click', () => {
    const results = host.querySelector('#pc-results');
    results.focus({preventScroll:true});
    results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  });
  new MutationObserver(update).observe(root,{attributes:true,attributeFilter:['data-lang']});
  const occupationPicker = initialiseOccupationPicker(host, update);
  const partnerOccupationPicker = initialiseOccupationPicker(host, update, {
    prefix:'pc-partner-occupation',
    describeSelection:(row, translate)=>priorityCodes.has(row.code)
      ? translate('On the Victorian priority occupation list in this rule snapshot. Partner +50 only if all skilled partner conditions are met.','已列入本版本维州优先职业清单；满足全部技术配偶条件时，配偶项可加 50 分。')
      : translate('Not on the Victorian priority occupation list in this rule snapshot. Partner +0.','未列入本版本维州优先职业清单，配偶项为 0 分。'),
  });
  host.dataset.ready = 'true';
  const rankingTool = initialiseRankingTool(host);
  update();
}
