export const MODELS: Record<string, string[]> = { PS2:['Slim','Slim Rasila Combo (IDE HDD)'], PS3:['Slim','SuperSlim'], PS4:['Fat','Slim','Pro'], PS5:['Fat Digital','Fat Disc','Slim Digital','Slim Disc','Pro Digital','Pro Disc'] };
export const CONDITIONS = [{id:'Best',name:'Excellent',detail:'Fully working, no scratches, never repaired'},{id:'Normal',name:'Good',detail:'Fully working, visible scratches, never repaired'},{id:'Poor',name:'Repaired',detail:'Previously opened or repaired'},{id:'NotWorking',name:'Not working',detail:'Faulty or does not turn on'}];
export const STATUSES = ['submitted','reviewing','shipping','received','inspection','offer_sent','accepted','paid','declined','cancelled'] as const;
export const STATUS_LABELS: Record<string,string>={submitted:'Request submitted',reviewing:'Under review',shipping:'Shipping arranged',received:'Console received',inspection:'Quality check',offer_sent:'Final offer ready',accepted:'Offer accepted',paid:'Payment completed',declined:'Request declined',cancelled:'Cancelled'};
export const TERMS_VERSION='2026-10-19-v1';
export const ADDRESS="GAMES PLANET, Near JK’s Tyre, in front of Raza Sugar Mill Gate, Radha Road–Gurudwara Road, Civil Lines, Rampur, Uttar Pradesh 244901";
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export type Device={console:string;model:string;condition:string;firmware:string};
export function quote(d:Device):{eligible:boolean;min:number|null;max:number|null;note:string}{
 const no=(note:string)=>({eligible:false,min:null,max:null,note});
 const price=(min:number,max=min,note='Estimated purchase value. Final offer follows physical inspection.')=>({eligible:true,min,max,note});
 if(!MODELS[d.console]?.includes(d.model))return no('Select a supported console and model. PS2 Fat and PS3 Fat are not accepted.');
 if(!CONDITIONS.some(c=>c.id===d.condition))return no('Select the condition of your console.');
 if(['Poor','NotWorking'].includes(d.condition))return no('Repaired, internally modified or non-working consoles are not accepted.');
 const best=d.condition==='Best';
 if(d.console==='PS2')return d.model.includes('Rasila')?price(2500):best?price(1500,2000):price(1000,1500);
 if(d.console==='PS3')return d.model==='Slim'?(best?price(5000,6000):price(3500,5000)):(best?price(4000,5000):price(3000,4000));
 if(d.console==='PS4'){
  if(!d.firmware.trim())return no('Enter firmware version, or choose Not sure.');
  const match=d.firmware.match(/^(\d{1,2})\.(\d{1,2})$/);const below9=match&&Number(match[1])<9;
  if(below9){const r:Record<string,[number,number]>={Fat:[5000,7000],Slim:[10000,14000],Pro:[14000,17000]};return price(...r[d.model],'Estimate uses the earlier below-9.00 firmware price tier. Firmware and condition will be verified.');}
  const r:Record<string,[number,number]>={Fat:[4000,6000],Slim:[7000,8000],Pro:[12000,14000]};return price(...r[d.model],'Base estimate only. Exact firmware and software status need review; this does not classify your console as modified or unmodified.');
 }
 const prices:Record<string,[number,number]>={'Fat Digital':[15000,15000],'Fat Disc':[20000,20000],'Slim Digital':[18000,20000],'Slim Disc':[24000,24000],'Pro Digital':[30000,30000],'Pro Disc':[35000,35000]};
 return price(...prices[d.model],'Reference estimate from our existing price list. Model, attached disc drive, firmware and condition require verification.');
}
export function normalizeMobile(value:unknown){const n=String(value??'').replace(/\D/g,'');if(n.length===12&&n.startsWith('91'))return n.slice(2);if(n.length===11&&n.startsWith('0'))return n.slice(1);return n;}
export const validMobile=(value:string)=>/^[6-9]\d{9}$/.test(value);
export const TRANSITIONS:Record<string,string[]>={submitted:['reviewing','declined'],reviewing:['shipping','declined'],shipping:['received','declined'],received:['inspection'],inspection:['offer_sent','declined'],offer_sent:['inspection','declined'],accepted:['paid'],paid:[],declined:[],cancelled:[]};
export const CANCELLABLE=['submitted','reviewing'];
