// Home Affairs Competent / Proficient / Superior tables, checked 22 October 2026.
// Component order is always Listening, Reading, Writing, Speaking.
export const englishRuleDate = '2026-10-22';
export const englishTests = {
  ielts:{name:'IELTS Academic / General Training',min:0,max:9,step:0.5,current:[[6,6,6,6],[7,7,7,7],[8,8,8,8]]},
  pte:{name:'PTE Academic',min:10,max:90,step:1,current:[[47,48,51,54],[58,59,69,76],[69,70,85,88]],legacy:[[50,50,50,50],[65,65,65,65],[79,79,79,79]]},
  cambridge:{name:'Cambridge C1 Advanced',min:80,max:210,step:1,current:[[163,163,170,179],[175,179,193,194],[186,190,210,208]],legacy:[[169,169,169,169],[185,185,185,185],[200,200,200,200]]},
  celpip:{name:'CELPIP General',min:0,max:12,step:1,current:[[7,7,7,7],[9,8,10,8],[10,10,12,10]],from:'2025-08-07'},
  met:{name:'Michigan English Test (MET)',min:0,max:80,step:1,current:[[56,55,57,48],[61,63,74,59],null],from:'2025-08-07'},
  oet:{name:'Occupational English Test (OET)',min:0,max:500,step:10,current:[[290,310,290,330],[350,360,380,360],[390,400,420,400]],legacy:[['B','B','B','B'],['B','B','B','B'],['A','A','A','A']]},
  languagecert:{name:'LANGUAGECERT Academic',min:0,max:100,step:1,current:[[57,60,64,70],[67,71,78,82],[80,83,89,89]],from:'2025-08-07'},
  toefl:{name:'TOEFL iBT',min:0,max:30,step:1,current:[[16,16,19,19],[22,22,26,24],[26,27,30,28]],legacy:[[12,13,21,21],[24,24,27,23],[28,29,30,26]]},
};
export const passportCountries = {uk:'United Kingdom',usa:'United States of America',canada:'Canada',nz:'New Zealand',ireland:'Republic of Ireland'};
export const getEnglishTest = mode => Object.hasOwn(englishTests,mode || '') ? englishTests[mode] : null;
export const needsEnglishDate = mode => !!getEnglishTest(mode) && mode !== 'ielts';
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value && value <= new Date().toISOString().slice(0,10);
export const legacyOet = input => input.englishMode === 'oet' && validDate(input.testDate) && input.testDate < '2025-08-07';
export function englishEvidenceIssue(input) {
  const test = getEnglishTest(input.englishMode);
  if (!test) return null;
  if (needsEnglishDate(input.englishMode) && !validDate(input.testDate)) return 'date';
  if (test.from && input.testDate < test.from) return 'not-approved';
  if (input.englishMode === 'toefl') {
    if (input.testDate >= '2023-07-26' && input.testDate <= '2024-05-04') return 'toefl-suspended';
    if (input.testDate >= '2025-08-07' && input.testEvidence !== 'yes') return 'toefl-registration';
  }
  if (input.englishMode === 'cambridge' && input.testDate >= '2024-02-12' && input.testDate < '2025-08-07' && input.testEvidence !== 'yes') return 'cambridge-paper';
  return null;
}
export function englishBands(input) {
  const test = getEnglishTest(input.englishMode);
  if (!test || (needsEnglishDate(input.englishMode) && !validDate(input.testDate)) || (test.from && input.testDate < test.from)) return null;
  return input.testDate < '2025-08-07' && test.legacy ? test.legacy : test.current;
}
export function englishLevel(input) {
  if (input.englishMode === 'level') return ['below','competent','proficient','superior'].includes(input.english) ? input.english : null;
  if (input.englishMode === 'passport') return Object.hasOwn(passportCountries,input.passportCountry || '') ? 'competent' : null;
  const test = getEnglishTest(input.englishMode);
  if (!test || englishEvidenceIssue(input)) return null;
  const scores = ['listening','reading','writing','speaking'].map(key => input[key]);
  const letters = legacyOet(input);
  if (scores.some(value => letters ? !['A','B','C+','C','D','E'].includes(String(value).toUpperCase()) : value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < test.min || Number(value) > test.max || Math.abs(Number(value)/test.step-Math.round(Number(value)/test.step)) > 1e-8)) return null;
  const rank = {A:5,B:4,'C+':3,C:2,D:1,E:0};
  let level = 'below';
  englishBands(input).forEach((band,index) => {
    if (band && band.every((min,i) => letters ? rank[String(scores[i]).toUpperCase()] >= rank[min] : Number(scores[i]) >= min)) level = ['competent','proficient','superior'][index];
  });
  return level;
}
