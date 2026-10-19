import {env} from 'cloudflare:workers';
import {and,eq,desc,inArray,gte,count} from 'drizzle-orm';
import {getDb} from '@/db';
import {customers,requests,events,photos} from '@/db/schema';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {auth,isAdmin,json,mutationGuard,readJson,backupReady,backupRecord} from '@/lib/server';
import {quote,normalizeMobile,validMobile,TERMS_VERSION,TRANSITIONS,CANCELLABLE,STATUS_LABELS} from '@/lib/console-rules';
export const dynamic='force-dynamic';
const clean=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
function error(e:unknown){const msg=e instanceof Error?e.message:'Unable to process your request.';return json({error:msg==='AUTH_REQUIRED'?'Please sign in to continue.':msg},msg==='AUTH_REQUIRED'?401:msg==='FORBIDDEN'||msg==='INVALID_ORIGIN'?403:400);}
export async function GET(request:Request){try{
 const user=await getChatGPTUser();if(!user)return json({user:null,profile:null,requests:[],admin:false});
 const admin=isAdmin(user),db=getDb(),url=new URL(request.url),all=admin&&url.searchParams.get('admin')==='1';
 const profile=await db.select().from(customers).where(eq(customers.userId,user.userId)).get();
 const rows=await db.select().from(requests).where(all?undefined:eq(requests.userId,user.userId)).orderBy(desc(requests.createdAt)).limit(200);
 const ids=rows.map(r=>r.id);const history=ids.length?await db.select().from(events).where(inArray(events.requestId,ids)).orderBy(events.createdAt):[];
 const pictures=ids.length?await db.select({id:photos.id,requestId:photos.requestId}).from(photos).where(inArray(photos.requestId,ids)):[];
 return json({user:{name:user.displayName,email:user.email},profile:profile?{name:profile.name,mobile:profile.mobile}:null,admin,backupConfigured:admin?backupReady():undefined,requests:rows.map(r=>({...r,userId:undefined,details:JSON.parse(r.details),events:history.filter(e=>e.requestId===r.id),photos:pictures.filter(p=>p.requestId===r.id).map(p=>p.id)}))});
 }catch(e){return error(e)}}
export async function POST(request:Request){try{
 mutationGuard(request);const user=await auth(),admin=isAdmin(user),db=getDb();
 if(request.headers.get('content-type')?.startsWith('multipart/form-data')){
  if(!env.BUCKET)throw new Error('Photo storage is unavailable. Please try later.');
  if(Number(request.headers.get('content-length')||0)>5*1024*1024)throw new Error('Maximum file size is 4 MB.');
  const form=await request.formData(),file=form.get('photo');if(!(file instanceof File)||file.size===0||file.size>4*1024*1024)throw new Error('Choose a JPG, PNG or WebP photo up to 4 MB.');
  const buf=await file.arrayBuffer(),b=new Uint8Array(buf);let type='';if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)type='image/jpeg';else if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)type='image/png';else if(new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')type='image/webp';if(!type)throw new Error('Only JPG, PNG and WebP images are accepted.');
  const since=new Date(Date.now()-86400000).toISOString();const usage=await db.select({n:count()}).from(photos).where(and(eq(photos.userId,user.userId),gte(photos.createdAt,since))).get();if((usage?.n||0)>=30)throw new Error('Daily photo upload limit reached. Please try tomorrow.');
  const id=crypto.randomUUID(),key='console-photos/'+id;await env.BUCKET.put(key,buf,{httpMetadata:{contentType:type}});
  try{await db.insert(photos).values({id,userId:user.userId,objectKey:key,contentType:type,size:file.size,createdAt:new Date().toISOString()})}catch(e){await env.BUCKET.delete(key);throw e}return json({id});
 }
 const body=await readJson(request),now=new Date().toISOString();
 if(body.action==='register'){
  const name=clean(body.name,80),mobile=normalizeMobile(body.mobile);if(name.length<2||!validMobile(mobile))throw new Error('Enter your full name and a valid 10-digit Indian mobile number.');
  await db.insert(customers).values({userId:user.userId,email:user.email,name,mobile,createdAt:now}).onConflictDoUpdate({target:customers.userId,set:{name,mobile,email:user.email}});return json({ok:true});
 }
 if(body.action==='submit'){
  const profile=await db.select().from(customers).where(eq(customers.userId,user.userId)).get();if(!profile)throw new Error('Complete your registration first.');
  const d=body.details||{},device={console:clean(d.console,10),model:clean(d.model,60),condition:clean(d.condition,20),seal:clean(d.seal,20),firmware:clean(d.firmware,40)},estimate=quote(device);if(!estimate.eligible)throw new Error(estimate.note);
  if(['PS4','PS5'].includes(device.console)&&!device.firmware)throw new Error('Enter the firmware version or Not sure.');
  const altMobile=normalizeMobile(d.altMobile);if(altMobile&&!validMobile(altMobile))throw new Error('Alternative mobile must have 10 digits.');
  const details={...device,name:profile.name,mobile:profile.mobile,altMobile,address:clean(d.address,600),landmark:clean(d.landmark,150),pincode:clean(d.pincode,6),city:clean(d.city,80),state:clean(d.state,80),reason:clean(d.reason,50),shipping:clean(d.shipping,20),notes:clean(d.notes,1500),accessories:clean(d.accessories,400),length:Number(d.length),width:Number(d.width),height:Number(d.height),weight:d.weight?Number(d.weight):null,termsVersion:TERMS_VERSION,termsAcceptedAt:now,estimateNote:estimate.note};
  if(details.address.length<10||!/[1-9]\d{5}/.test(details.pincode)||details.pincode.length!==6||details.city.length<2||details.state.length<2)throw new Error('Enter a complete address with a valid 6-digit PIN, city and state.');
  if(!['Need Money','Want to Upgrade','No Need','Other'].includes(details.reason)||!['Self Ship','Pickup'].includes(details.shipping))throw new Error('Select your selling reason and shipping method.');
  if(![details.length,details.width,details.height].every(n=>Number.isFinite(n)&&n>0&&n<=200)||details.weight!==null&&(!Number.isFinite(details.weight)||details.weight<=0||details.weight>50))throw new Error('Enter valid packed dimensions in cm (1–200) and weight in kg (up to 50).');
  if(body.termsAccepted!==true)throw new Error('Please accept the selling terms.');
  const id=clean(body.id,50);if(!/^GP-[0-9a-f-]{36}$/i.test(id))throw new Error('Invalid request reference. Refresh the page.');
  const prior=await db.select().from(requests).where(eq(requests.id,id)).get();if(prior){if(prior.userId!==user.userId)throw new Error('FORBIDDEN');return json({ok:true,id})}
  const photoIds=Array.isArray(body.photoIds)?[...new Set(body.photoIds.map((p:unknown)=>clean(p,50)))]:[];if(photoIds.length<2||photoIds.length>6)throw new Error('Upload 2–6 photos: console front/back, model label, original seal and included accessories.');
  const owned=await db.select().from(photos).where(and(eq(photos.userId,user.userId),inArray(photos.id,photoIds as string[])));if(owned.length!==photoIds.length||owned.some(p=>p.requestId))throw new Error('One of the photos is unavailable. Please upload it again.');

  const recent=await db.select({n:count()}).from(requests).where(and(eq(requests.userId,user.userId),gte(requests.createdAt,new Date(Date.now()-86400000).toISOString()))).get();if((recent?.n||0)>=5)throw new Error('You can submit up to 5 requests per day.');
  await db.batch([db.insert(requests).values({id,userId:user.userId,customerEmail:user.email,details:JSON.stringify(details),estimateMin:estimate.min,estimateMax:estimate.max,createdAt:now,updatedAt:now}),db.insert(events).values({id:crypto.randomUUID(),requestId:id,status:'submitted',note:'Sell request received. Please wait for confirmation before shipping.',createdAt:now}),db.update(photos).set({requestId:id}).where(and(eq(photos.userId,user.userId),inArray(photos.id,photoIds as string[])))]);
  let backup={ok:false,reason:'not_configured'};try{backup=await backupRecord(id,{details,customerEmail:user.email,estimate,status:'submitted',photoIds})}catch{backup={ok:false,reason:'backup_failed'}}return json({ok:true,id,backup:admin?backup:undefined});
 }
 if(body.action==='export'){
  if(!admin)throw new Error('FORBIDDEN');const [c,r,e,p]=await Promise.all([db.select().from(customers),db.select().from(requests),db.select().from(events),db.select().from(photos)]);return json({version:1,exportedAt:now,customers:c,requests:r.map(x=>({...x,details:JSON.parse(x.details)})),events:e,photos:p});
 }
 if(body.action==='backup'){
  if(!admin)throw new Error('FORBIDDEN');if(!backupReady())throw new Error('Private GitHub backup is not connected. Download the data export, or configure GITHUB_BACKUP_TOKEN and GITHUB_BACKUP_REPO as server secrets.');
  const rows=await db.select().from(requests);let done=0;for(const r of rows){const [history,pics]=await Promise.all([db.select().from(events).where(eq(events.requestId,r.id)),db.select().from(photos).where(eq(photos.requestId,r.id))]);const b=await backupRecord(r.id,{...r,details:JSON.parse(r.details),events:history,photos:pics});if(!b.ok)throw new Error('Backup stopped: '+b.reason);done++}return json({ok:true,count:done});
 }
 const id=clean(body.id,50),row=await db.select().from(requests).where(eq(requests.id,id)).get();if(!row||!admin&&row.userId!==user.userId)throw new Error('FORBIDDEN');
 let status='',note='',offer=row.finalOffer;
 if(body.action==='cancel'){if(!CANCELLABLE.includes(row.status))throw new Error('This request can no longer be cancelled online. Contact Games Planet.');status='cancelled';note='Cancelled by customer.';}
 else if(body.action==='accept'){if(row.userId!==user.userId||row.status!=='offer_sent'||offer===null)throw new Error('There is no final offer available to accept.');status='accepted';note='Customer accepted the final offer of ₹'+offer+'.';}
 else if(body.action==='status'){
  if(!admin)throw new Error('FORBIDDEN');status=clean(body.status,30);if(!TRANSITIONS[row.status]?.includes(status))throw new Error('Invalid status transition. Refresh and choose the next stage.');note=clean(body.note,1500);if(note.length<3)throw new Error('Add a customer-visible update note.');
  if(status==='offer_sent'){offer=Number(body.finalOffer);if(!Number.isInteger(offer)||offer===null||offer<1||offer>200000)throw new Error('Enter a valid final offer from ₹1 to ₹2,00,000.');}
 }else throw new Error('Unknown action.');
 // Conditional update prevents stale simultaneous admin/customer actions overwriting a newer state.
 const changed=await env.DB!.batch([env.DB!.prepare('UPDATE sell_requests SET status = ?, final_offer = ?, updated_at = ? WHERE id = ? AND status = ?').bind(status,offer,now,id,row.status),env.DB!.prepare('INSERT INTO request_events (id,request_id,status,note,created_at) SELECT ?,?,?,?,? WHERE changes() = 1').bind(crypto.randomUUID(),id,status,note,now)]);if(!changed[0].meta.changes)throw new Error('This request was updated. Refresh and try again.');
 if(backupReady())try{await backupRecord(id,{...row,status,finalOffer:offer,details:JSON.parse(row.details),latestUpdate:note,updatedAt:now})}catch{/* durable database write remains successful */}
 return json({ok:true,label:STATUS_LABELS[status]});
 }catch(e){return error(e)}}
