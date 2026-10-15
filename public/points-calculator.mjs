import {calculate, priorityCodes} from './points-rules.mjs';
import {initialiseOccupationPicker} from './occupation-picker.mjs';

export function initialisePointsCalculator() {
  const host = document.querySelector('#points-calculator');
  if (!host || host.dataset.ready) return;
  const form = host.querySelector('form');
  const root = document.documentElement;
  const text = (en, zh) => root.dataset.lang === 'zh' ? zh : en;
  const labels = {
    state:['state','州'], visa:['visa','签证类别'], age:['age','年龄'], english:['English','英语'],
    overseas:['overseas work','海外工作'], australian:['Australian work','澳洲工作'], education:['education','学历'],
    partner:['partner','配偶'], experience:['nominated occupation experience','提名职业工作年限'], skill:['occupation skill level','职业技能等级'],
    occupation:['nominated occupation','提名职业'], 'occupation-level':['occupation level needs checking','职业等级需进一步核对'],
    vptEducation:['highest qualification','最高学历'], vptPartner:['VPT partner conditions','VPT 配偶条件'],
    'earnings-status':['Victorian earnings conditions','维州收入条件'], salary:['eligible earnings','合资格收入'],
    'partner-code':['partner occupation code','配偶职业代码'], 'eight-years':['exactly 8 years needs official clarification','刚好 8 年需官方澄清'],
    employment:['Skilled employment (combined cap: 20)','技术工作（合计上限 20）'], study:['Australian study','澳洲学习'],
    specialist:['Specialist education','特定研究学历'], regional:['Regional study','偏远地区学习'],
    professional:['Professional Year','职业年'], language:['Community language','社区语言'], earnings:['Victorian earnings','维州收入'],
  };
  const label = key => text(...labels[key]);
  function values() {
    return Object.fromEntries([...form.elements].filter(el => el.name).map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
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
    const chosen = ['vic','nsw'].includes(input.state) && ['189','190'].includes(input.visa);
    const vic = chosen && input.state === 'vic' && input.visa === '190';
    const federal = chosen && !vic;
    show('[data-pc-common]', chosen);
    show('[data-pc-federal]', federal);
    show('[data-pc-vpt]', vic);
    show('[data-pc-result-button]', chosen);
    show('[data-pc-english-level]', chosen && input.englishMode === 'level');
    show('[data-pc-english-scores]', chosen && ['pte','ielts'].includes(input.englishMode));
    show('[data-pc-pte-date]', chosen && input.englishMode === 'pte');
    show('[data-pc-salary]', vic && input.earningEligible === 'yes');
    show('[data-pc-partner-code]', vic && input.vptPartner === 'yes');
    show('#points-sources', chosen);
    show('[data-pc-reference="vpt"]', vic);
    show('[data-pc-reference="federal"]', federal);
    show('[data-pc-reference="nsw"]', federal && input.state === 'nsw' && input.visa === '190');
    occupationPicker.refresh();
    const regional = form.elements.namedItem('regional');
    regional.disabled = !federal || !input.study;
    if (!input.study) {regional.checked = false; input.regional = false;}
    const specialist = form.elements.namedItem('specialist');
    specialist.disabled = !federal || !['master','phd'].includes(input.education);
    if (!['master','phd'].includes(input.education)) {specialist.checked = false; input.specialist = false;}
    ['listening','reading','writing','speaking'].forEach(key => {
      const el = form.elements.namedItem(key);
      el.min = input.englishMode === 'pte' ? '10' : '0';
      el.max = input.englishMode === 'pte' ? '90' : '9';
      el.step = input.englishMode === 'pte' ? '1' : '0.5';
    });
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
    host.querySelector('#pc-contact').href = includeScore.checked
      ? contactBase + '?' + new URLSearchParams({pathway:input.state+'-'+input.visa,score:String(result.total)})
      : contactBase;
    const pathway = vic ? text('VIC 190 · Victorian Points Test','VIC 190 · 维州 VPT') : federal ? input.state.toUpperCase()+' '+input.visa+' · '+text('Federal EOI','联邦 EOI') : text('Select your pathway','请选择路径');
    host.querySelector('.pc-form-heading h2').textContent = chosen ? text('Your '+(vic?'VPT':'EOI')+' answers','填写 '+(vic?'VPT':'EOI')+' 信息') : text('Start with your pathway','先选择州与签证');
    host.querySelector('#pc-result-title').textContent = pathway;
    host.querySelector('#pc-mode-note').textContent = !chosen ? text('Choose a state and visa to load the matching questions.','请选择州与签证类别，再填写对应的问题。')
      : vic ? text('Victorian 190: only the 2026–27 VPT is calculated here. Seven factors, one total. There is no fixed pass mark.','维州 190：此处仅计算 2026–27 新版 VPT。七项因素，一个总分，没有固定及格分。')
      : input.visa === '189' ? text('189 uses the federal points test. There are no state nomination or salary points.','189 使用联邦计分规则，不含州提名或薪资加分。')
      : text('NSW 190 uses federal EOI points here, including a conditional +5 nomination scenario. This is not an NSW invitation ranking score.','新州 190 此处计算联邦 EOI 分数，含获得州提名后的 +5 分模拟；并非新州邀请排名分数。');
    host.querySelector('#pc-english-result').textContent = result.english ? text('English level: ','英语等级：') + text(...englishOptions[result.english]) : text('Select a level, or enter all four valid scores (and the PTE test date).','请选择英语等级，或填写四项有效成绩（PTE 还需考试日期）。');
    if (vic && input.vptPartner === 'yes') host.querySelector('#pc-partner-result').textContent = !/^\d{6}$/.test(input.partnerCode)
      ? text('Enter a complete 6-digit partner occupation code.','请填写完整的六位配偶职业代码。')
      : priorityCodes.has(input.partnerCode)
      ? text('Priority occupation found: +50 if all skilled partner conditions are met. Recheck the current official list before lodging.','已匹配优先职业：符合全部技术配偶条件时 +50 分；递交前请再次核对官方清单。')
      : text('Not on this snapshot’s priority list: partner +0. This does not assess occupation eligibility.','此代码未列入本版本优先清单：配偶 +0 分；这并非职业资格判断。');
    const blocked = result.issues.includes('age-limit') || result.issues.includes('english-minimum');
    let markup = '';
    if (!chosen) markup = '<p class="pc-hint">'+text('Choose VIC or NSW, then 189 or 190. Only the matching calculator will appear.','先选维州或新州，再选 189 或 190；页面只显示对应的打分工具。')+'</p>';
    else {
      markup = '<div class="pc-score-card'+(vic?' pc-vpt-score':'')+'"><div>'+text(vic?'VPT total':'EOI total',vic?'VPT 总分':'EOI 总分')+'</div><strong data-score="'+(vic?'vpt':'federal')+'">'+(result.total == null?'—':result.total)+'</strong><small>'+text(vic?'/ 950 points':'points',vic?'/ 950 分':'分')+'</small><p>';
      markup += result.total == null ? (blocked ? text('A basic age or English requirement is not met.','年龄或英语基本要求未满足。') : text('Complete the required selections.','请完成必填选项。'))
        : vic ? text('No fixed pass mark. This score does not predict an invitation.','没有固定及格分，此分数不代表能够获邀。')
        : input.visa === '190' ? text('Base '+result.base+' + conditional nomination 5. Not a nomination already granted.','基础 '+result.base+' 分 + 有条件州提名 5 分；不代表已获得提名。')
        : text('Federal 189 points, without nomination points.','联邦 189 分数，不含州提名加分。');
      markup += '</p></div>';
      if (result.missing.length) markup += '<p class="pc-pending">'+text('To complete: ','待完成：')+result.missing.map(label).join(text(', ','、'))+text('.','。')+'</p>';
      if (federal && result.total != null) markup += '<p class="pc-score-status">'+(result.total >=65 ? text('At or above the 65-point federal minimum. This does not establish eligibility or guarantee invitation.','达到联邦 65 分最低分数要求，但不代表资格成立或保证获邀。') : text('Below the federal 65-point minimum.','未达到联邦 65 分最低分数要求。'))+'</p>';
    }
    host.querySelector('#pc-live-score').innerHTML = markup;
    show('.pc-breakdown', chosen);
    show('.pc-assumptions', chosen);
    host.querySelector('#pc-breakdown').innerHTML = chosen ? rows(result.breakdown)+(federal && input.visa === '190' ? '<p>'+text('Conditional nomination: +5','有条件州提名：+5')+'</p>':'') : '';
    const notes = [];
    if (result.issues.includes('age-limit')) notes.push(text('189 / 190 requires being under 45 when invited. Age 45+ cannot produce a qualifying total here.','189／190 要求签证获邀时未满 45 岁，45 岁及以上不显示可用总分。'));
    if (result.issues.includes('english-minimum')) notes.push(text('At least Competent English is required. Other points cannot replace this requirement.','需至少达到 Competent English，其他分数不能替代此要求。'));
    if (vic) {
      if (input.experience === '8') notes.push(text('The official VPT table omits exactly 8 years. The total is withheld pending official clarification.','官方 VPT 表未单列刚好 8 年，暂不显示总分，待官方澄清。'));
      notes.push(text('This screen calculates VPT only. Visa eligibility and federal EOI requirements must still be checked separately before applying.','本页当前仅计算 VPT。正式申请前仍需另行核对签证资格与联邦 EOI 要求。'));
    }
    if (federal && input.visa === '190') notes.push(text('NSW selects at its discretion using multiple factors. Check the live program status, occupation list and residence requirements; no invitation probability is calculated.','新州综合多项因素择优邀请。请核对当前项目状态、职业清单与居住要求；此处不计算获邀概率。'));
    notes.push(text('Answers are calculated in this page. If you choose to include your estimate, only your pathway and total are carried into the enquiry form for review. No email is sent automatically.','填写内容在当前页面计算。勾选附上预估分数后，仅将路径与总分带入咨询表单供您确认；不会自动发送邮件。'));
    host.querySelector('#pc-result-notes').innerHTML = notes.map(note=>'<p>'+note+'</p>').join('');
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  host.querySelector('#pc-include-score').addEventListener('change', update);
  form.addEventListener('submit', event=>event.preventDefault());
  form.addEventListener('reset', () => {
    // Hidden inputs reflect assigned values into their reset defaults; clear the selection explicitly.
    form.elements.namedItem('occupation').value = '';
    setTimeout(update, 0);
  });
  host.querySelector('#pc-show-result').addEventListener('click', () => {
    const results = host.querySelector('#pc-results');
    results.focus({preventScroll:true});
    results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  });
  new MutationObserver(update).observe(root,{attributes:true,attributeFilter:['data-lang']});
  const occupationPicker = initialiseOccupationPicker(host, update);
  host.dataset.ready = 'true';
  update();
}
