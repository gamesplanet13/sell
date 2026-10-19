export const MODELS: Record<string, string[]> = { PS2:['Slim','Slim Rasila Combo (IDE HDD)'], PS3:['Slim','SuperSlim'], PS4:['Fat','Slim','Pro'], PS5:['Fat Digital','Fat Disc','Slim Digital','Slim Disc','Pro Digital','Pro Disc'] };
export const SEALS=[{id:'original',name:'Original seal intact — never opened'},{id:'opened',name:'Seal opened / broken'},{id:'missing',name:'Seal missing / replaced / not original'},{id:'unknown',name:'Not sure about the seal'}];
export const CONDITIONS = [{id:'Best',name:'Excellent',detail:'Fully working, no scratches, never repaired'},{id:'Normal',name:'Good',detail:'Fully working, visible scratches, never repaired'},{id:'Poor',name:'Repaired',detail:'Previously opened or repaired'},{id:'NotWorking',name:'Not working',detail:'Faulty or does not turn on'}];
export const STATUSES = ['submitted','reviewing','shipping','received','inspection','offer_sent','accepted','paid','declined','cancelled'] as const;
export const STATUS_LABELS: Record<string,string>={submitted:'Request submitted',reviewing:'Under review',shipping:'Shipping arranged',received:'Console received',inspection:'Quality check',offer_sent:'Final offer ready',accepted:'Offer accepted',paid:'Payment completed',declined:'Request declined',cancelled:'Cancelled'};
export const TERMS_VERSION='2026-10-19-v2';
export const ADDRESS="GAMES PLANET, Near JK’s Tyre, in front of Raza Sugar Mill Gate, Radha Road–Gurudwara Road, Civil Lines, Rampur, Uttar Pradesh 244901";
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export type Device={console:string;model:string;condition:string;firmware:string;seal:string};
export function quote(d:Device):{eligible:boolean;min:number|null;max:number|null;note:string}{
 const no=(note:string)=>({eligible:false,min:null,max:null,note});
 const price=(min:number,max=min,note='Estimated purchase value. Final offer follows physical inspection.')=>({eligible:true,min,max,note});
 if(!MODELS[d.console]?.includes(d.model))return no('Select a supported console and model. PS2 Fat and PS3 Fat are not accepted.');
 if(!CONDITIONS.some(c=>c.id===d.condition))return no('Select the condition of your console.');
 if(['Poor','NotWorking'].includes(d.condition))return no('Repaired, internally modified or non-working consoles are not accepted.');
 if(d.seal!=='original')return no(d.seal?'Only consoles with an intact original seal are accepted. Opened, broken, missing, replaced or non-original seals are not accepted.':'Confirm that the original console seal is intact and the set has never been opened.');
 const best=d.condition==='Best';
 if(d.console==='PS2')return d.model.includes('Rasila')?price(2500):best?price(1500,2000):price(1000,1500);
 if(d.console==='PS3')return d.model==='Slim'?(best?price(5000,6000):price(3500,5000)):(best?price(4000,5000):price(3000,4000));
 if(d.console==='PS4'){
  if(!d.firmware.trim())return no('Enter firmware version, or choose Not sure.');
  if(d.model==='Fat')return price(7000,8000);
  const match=d.firmware.trim().match(/^(\d{1,2})\.(\d{1,2})$/);
  if(d.model==='Slim'){
   const version=match?Number(match[1])*100+Number(match[2].padEnd(2,'0')):null;
   if(version!==null&&version<=1352)return price(12000);
   if(version!==null&&version>=1360)return price(10000);
   return {eligible:true,min:null,max:null,note:'PS4 Slim firmware is unknown or between 13.52 and 13.60. Games Planet will confirm the purchase value after checking the exact version.'};
  }
  const below9=match&&Number(match[1])<9;
  return below9?price(14000,17000,'Estimate uses the earlier PS4 Pro below-9.00 firmware price tier. Firmware and condition will be verified.'):price(12000,14000,'PS4 Pro base estimate. Exact firmware and condition require verification.');
 }
 const prices:Record<string,[number,number]>={'Fat Digital':[25000,25000],'Fat Disc':[30000,30000],'Slim Digital':[30000,30000],'Slim Disc':[35000,35000],'Pro Digital':[50000,50000],'Pro Disc':[50000,50000]};
 return price(...prices[d.model],'Purchase estimate from our updated price list. Model, attached disc drive, firmware and condition require verification.');
}
export function normalizeMobile(value:unknown){const n=String(value??'').replace(/\D/g,'');if(n.length===12&&n.startsWith('91'))return n.slice(2);if(n.length===11&&n.startsWith('0'))return n.slice(1);return n;}
export const validMobile=(value:string)=>/^[6-9]\d{9}$/.test(value);
export const TRANSITIONS:Record<string,string[]>={submitted:['reviewing','declined'],reviewing:['shipping','declined'],shipping:['received','declined'],received:['inspection'],inspection:['offer_sent','declined'],offer_sent:['inspection','declined'],accepted:['paid'],paid:[],declined:[],cancelled:[]};
export const CANCELLABLE=['submitted','reviewing'];
