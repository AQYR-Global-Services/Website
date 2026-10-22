import {geographicPostcodes} from './postcode-reference.mjs';

export const regionalRulesDate='2026-10-22';
// Home Affairs designated regional postcode table, not ABS remoteness categories.
// Inclusive ranges are transcribed verbatim; validate them before changing.
export const regionalRanges={
  nsw:{2:'2259 2264-2308 2500-2526 2528-2535 2574',3:'2250-2258 2260-2263 2311-2490 2527 2536-2551 2575-2739 2753-2754 2756-2758 2773-2898'},
  vic:{2:'3211-3232 3235 3240 3328 3330-3333 3340 3342',3:'3097-3099 3139 3233-3234 3236-3239 3241-3325 3329 3334 3341 3345-3424 3430-3799 3809-3909 3912-3971 3978-3996'},
  qld:{2:'4019-4022 4025 4037 4074 4076-4078 4207-4275 4300-4301 4303-4305 4500-4506 4508-4512 4514-4519 4521 4550-4551 4553-4562 4564-4569 4571-4575',3:'4124-4125 4133 4183-4184 4280-4287 4306-4498 4507 4552 4563 4570 4580-4895'},
  wa:{2:'6000-6038 6050-6083 6090-6182 6208-6211 6214 6556-6558'},
  sa:{2:'5000-5171 5173-5174 5231-5235 5240-5252 5351 5950-5960'},
  tas:{2:'7000 7004-7026 7030-7109 7140-7151 7170-7177'},
};
// ABS 2026 identifies these POAs as crossing borders. A postcode alone
// cannot establish the actual state/address: require individual checking.
export const sharedPostcodes={
  '0872':['nt','sa','wa'],'2406':['nsw','qld'],'2540':['nsw','other'],
  '2611':['nsw','act'],'2618':['nsw','act'],'2620':['nsw','act'],
  '3644':['vic','nsw'],'3691':['vic','nsw'],'3707':['vic','nsw'],
  '4375':['qld','nsw'],'4377':['qld','nsw'],'4380':['qld','nsw'],
  '4383':['qld','nsw'],'4385':['qld','nsw'],'4825':['qld','nt'],
};
const matches=(postcode,ranges='')=>ranges.split(' ').filter(Boolean).some(part=>{
  const [lo,hi=lo]=part.split('-').map(Number);return postcode>=lo&&postcode<=hi;
});
function postcodeStates(code){
  if(sharedPostcodes[code])return sharedPostcodes[code];
  if(['2899','6798','6799'].includes(code))return ['other'];
  const n=Number(code);
  if(n>=800&&n<=999)return ['nt'];
  if(n>=2600&&n<=2618||n>=2900&&n<=2920)return ['act'];
  if(n>=2000&&n<=2999)return ['nsw'];
  if(n>=3000&&n<=3999)return ['vic'];
  if(n>=4000&&n<=4999)return ['qld'];
  if(n>=5000&&n<=5999)return ['sa'];
  if(n>=6000&&n<=6999)return ['wa'];
  if(n>=7000&&n<=7999)return ['tas'];
  return [];
}

export function lookupRegionalPostcode(raw,selectedState){
  const postcode=typeof raw==='string'?raw.trim():'';
  if(!postcode)return {status:'empty',postcode,regional:null,states:[],matchesState:false};
  if(!/^\d{4}$/.test(postcode))return {status:'invalid',postcode,regional:null,states:[],matchesState:false};
  // An unrecognised/PO-box/new postcode is unknown, NOT automatically regional
  // and NOT asserted to be an invalid Australia Post code.
  if(!geographicPostcodes.has(postcode))return {status:'unknown',postcode,regional:null,states:[],matchesState:false};
  const states=postcodeStates(postcode),matchesState=states.includes(selectedState);
  if(states.length>1)return {status:'shared',postcode,regional:null,states,matchesState};
  const state=states[0];
  if(!state||state==='other')return {status:'unsupported',postcode,regional:null,states,matchesState};
  const n=Number(postcode),ranges=regionalRanges[state];
  const category=state==='act'?2:state==='nt'?3:matches(n,ranges?.[2])?2:matches(n,ranges?.[3])?3:['wa','sa','tas'].includes(state)?3:1;
  return {status:'matched',postcode,states,matchesState,regional:category!==1,category};
}

export function regionalPostcodeCanProceed(result){
  return result.status==='matched'&&result.regional===true&&result.matchesState;
}
