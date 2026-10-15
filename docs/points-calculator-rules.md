# Skilled migration calculator rule snapshot

Verified against government sources on 15 October 2026. This is a planning tool, not a visa eligibility engine. Each state/visa choice loads exactly one calculator: VIC190 uses VPT only; VIC189, NSW189 and NSW190 use federal EOI. The selected form, result, breakdown and references exclude the other scoring system. VPT qualification and partner answers are separate from federal answers. No invitation forecasts, implied government affiliation or invented NSW weighting formula.

## Sources

- [Home Affairs 189 points](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-table)
- [Home Affairs 190 points](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190/points-table) (rendered government page read in the browser; the text-only crawler omitted the loaded tables)
- [Australian study requirement](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190/australian-study-requirement)
- English: [Competent](https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english), [Proficient](https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/proficient-english), [Superior](https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/superior-english)
- [Victoria VPT and 2026–27 priority occupation codes](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt)
- [Victoria annual earnings guidance and estimator](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/earnings-calculator)
- [Victoria 190 requirements](https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/skilled-nominated-visa-subclass-190)
- [NSW 190 selection and requirements](https://www.nsw.gov.au/visas-and-migration/skilled-visas/skilled-nominated-visa-subclass-190)

## Federal model

Age bands: 18–24 = 25; 25–32 = 30; 33–39 = 25; 40–44 = 15. Age 45+ blocks a qualifying total. The supported input range begins at 18.

English Competent / Proficient / Superior = 0 / 10 / 20; below Competent blocks a qualifying total. IELTS Academic and General Training thresholds remain 6 / 7 / 8 in **each** component. PTE thresholds in L/R/W/S order: tests from 7 August 2025 = 47/48/51/54, 58/59/69/76, 69/70/85/88; earlier tests = 50/65/79 in each component. The date chooses the table, not a presumption of validity. Validity, test-centre status, retakes and visa-specific evidence timing require separate checking. Other accepted tests and passport evidence use a manually confirmed level; passport evidence alone cannot claim Proficient/Superior.

Employment in preceding ten years: overseas <3 / 3–<5 / 5–<8 / 8+ years = 0/5/10/15; Australian <1 / 1–<3 / 3–<5 / 5–<8 / 8+ = 0/5/10/15/20. Combined cap 20. No inference of assessed skilled dates or verification of overlapping employment. Eligible paid work requires 20 hours/week and the nominated/closely related occupation; Australian visa conditions also apply.

Highest recognised qualification only: PhD20; Bachelor/Honours/Masters15; Australian diploma/trade or suitable assessing-authority award10; other0. Specialist Australian research Masters/PhD in specified fields10; Australian study5; eligible regional study5 (requires Australian study); eligible Professional Year5; qualifying NAATI community-language credential5. Inputs explain the qualifying conditions. Regional and specialist claims are disabled when their prerequisite selections are inconsistent.

Partner: single/Australian citizen or PR partner10; qualifying skilled partner10; qualifying English-only partner5; none0. Skilled partner conditions are shown beside the field. No double counting between categories.

NSW190 displays base +5 as a **conditional nomination scenario**, not an existing nomination. VIC190 is VPT-only and has no nomination bonus or federal result. 189 never adds nomination points, regardless of chosen state. Salary does not affect federal points. 65 is a federal minimum threshold only, not an invitation cutoff.

## Victoria VPT model

Age18=265,19=282,20–29=300,30=286,31=270,32=256,33=240,34=226,35=210,36=196,37=180,38=166,39=150,40=136,41=106,42=76,43=46,44=16.

English0/100/200. Nominated-occupation experience0/1/2–3/4–5/6–7/>8 years = 0/20/40/60/80/100. **The official table omits exactly eight years. We do not choose 80 or 100; the VPT total is withheld and the reason shown. Federal totals remain available.**

Education Other25, Bachelor/Honours50, Masters75, PhD100. Nominated ANZSCO skill level1=50; levels2/3=0. The occupation picker derives the level only from an explicitly selected six-digit official occupation record, not from a guessed title or code prefix. It uses ABS ANZSCO **2013 v1.2**, the version applicable to 189/190 (not 2022 or OSCA): Structure Table 5 supplies 1,023 occupations and levels; Index Table 2 supplies 2,213 alternative names/specialisations. Common Chinese search aids are editorial, not official translations. Users must select their assessed occupation, and a match does not establish visa eligibility. Unknown codes and levels4/5 withhold the VPT total. Source URLs, attribution and SHA256 hashes are recorded in `assets/anzsco-source.json`.

Partner50 only with the federal **skilled partner** category (not single/AU partner), inclusion in the same nominated application and a six-digit partner code in the published Victorian priority list. The snapshot includes every published code from healthcare, social assistance, education and construction. This membership check is not an occupation eligibility determination or promise of a priority-stream invitation. Updates to the priority list require updating the Set and regression tests.

Current eligible Victorian annual earnings: <$80k=0; 5k bands from $80k have points 8,16,24,32,39,47,55,63,71,79,87,95,103,111,118,126,134,142; $170k+=150. Users enter the **official earnings estimator result**, not arbitrary gross income: current Victorian residence, skilled employment for a physically Victorian employer (no virtual office), highest-paying eligible job only, excluding super and other excluded payments. Casual loading needs the official adjustment. The job can differ from nominated occupation. Salary is ignored when claim eligibility is No or the mode is not VIC190.

VPT maximum950 is a theoretical total, not a pass mark. State and federal eligibility remain separate; federal and VPT totals must never be combined. Age at ROI may differ from age at federal invitation: the form tells users to recalculate each scenario if needed.

## NSW / program status

NSW's page describes multiple selection factors and ANZSCO-unit-group ranking but no separate numerical weights. Show federal EOI only. Do not create a NSW points test or score salary. The live page currently contains a closure/review notice; link users to its current status rather than encode an opening date or imply nomination is open. No fees, allocations or historical cutoffs are used in either calculator.

## Maintenance and testing

Rules: `public/points-rules.mjs`; browser controller: `public/points-calculator.mjs`; page: `content/points-calculator.html`. Run `node scripts/check-points.mjs`, sync static previews, build, then run the full site check against a current server. Test all four state/subclass modes, empty/invalid fields, threshold boundaries, switching language without losing answers, Reset, phone layout, keyboard controls and source links. No form submissions, cookies containing answers, analytics events, URL parameters containing answers or local storage of answers are implemented.
